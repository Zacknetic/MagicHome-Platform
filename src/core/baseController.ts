import {
  CommandType,
  CommandOptions,
  DeviceCommandRGB,
  LEDStateRGB,
  DeviceBundle,
  DeviceManager,
  DEFAULT_COMMAND,
  mergeDeep,
  cloneDeep,
  combineDeep,
  FetchStateResponse,
  ledStateHSV,
  DeviceCommandHSV,
} from 'magichome-core';

import { FullDeviceInformation, DeviceAPI, IAnimationColorStep } from '../models/types';
import { adjustCommandToAPI, getAPI } from '../utils/platformUtils';
import { HSVtoRGB, RGBtoHSV } from '../utils/colorConversions';

const { POWER, ANIMATION_FRAME, LED } = CommandType;


const DEFAULT_COMMAND_OPTIONS: CommandOptions = {
  waitForResponse: false,
  maxRetries: 0,
  commandType: LED,
  isEightByteProtocol: false,
  colorAssist: true,
};

export class BaseController {
  protected _ledStateRGB: LEDStateRGB | null = null;
  // Buffering-related properties


  get ledStateRGB(): LEDStateRGB {
    if (this._ledStateRGB === null) {
      throw Error('ledStateRGB is null');
    }
    //return a deep copy of the ledStateRGB
    return cloneDeep<LEDStateRGB>(this._ledStateRGB);
  }

  protected set ledStateRGB(ledStateRGB: LEDStateRGB) {
    if (ledStateRGB === null) {
      throw Error('Trying to set ledStateRGB but it is null');
    }
    this._ledStateRGB = cloneDeep<LEDStateRGB>(ledStateRGB);
  }

  lastKnownHue: number = 0;
  get ledStateHSV(): ledStateHSV {
    if (this._ledStateRGB === null) {
      throw Error('ledStateRGB is null and cannot be converted to HSV');
    }
    const HSV = RGBtoHSV(this._ledStateRGB.RGB);
    //iterate through the rgb values and if all are 0, then the hue data has been lost and we need to use the last known hue
    const allRGBValuesAreZero = Object.values(this._ledStateRGB.RGB).every(value => value === 0);
    if (allRGBValuesAreZero) {
      HSV.hue = this.lastKnownHue;
    }

    return { isOn: this._ledStateRGB.isOn, HSV, CCT: this._ledStateRGB.CCT }; // already a deep copy from the ledStateRGB
  }

  protected get command() {
    return {
      get: (partial: Partial<DeviceCommandRGB>): DeviceCommandRGB => {
        return combineDeep<DeviceCommandRGB>(DEFAULT_COMMAND, partial);
      },
    };
  }

  protected deviceAPI: DeviceAPI;
  protected lastOutboundCommand: DeviceCommandRGB | null = null;

  get fullDeviceInformation(): FullDeviceInformation {
    if (this.deviceBundle.completeDevice.fetchStateResponse.deviceMetaData === null) {
      throw Error('DeviceMetaData is null');
    }
    if (this.deviceBundle.completeDevice.protoDevice === null) {
      throw Error('ProtoDevice is null');
    }
    if (this.deviceBundle.completeDevice.fetchStateResponse.ledStateRGB === null) {
      throw Error('DeviceState is null');
    }
    if (this.deviceAPI === null) {
      throw Error('DeviceAPI is null');
    }

    return {
      deviceAPI: this.deviceAPI,
      protoDevice: this.deviceBundle.completeDevice.protoDevice,
      ledStateRGB: this.ledStateRGB,
      deviceMetaData: this.deviceBundle.completeDevice.fetchStateResponse.deviceMetaData,
    };
  }

  private _deviceManager: DeviceManager | null = null;
  private get deviceManager(): DeviceManager {
    if (this._deviceManager === null) {
      throw Error('DeviceManager is null');
    }
    return this._deviceManager;
  }
  private set deviceManager(deviceManager: DeviceManager) {
    this._deviceManager = deviceManager;
  }

  public manuallyControlled: boolean = false;
  public id: string | null = null;
  protected animationList: string[] = [];

  constructor(protected deviceBundle: DeviceBundle) {
    this.deviceManager = deviceBundle.deviceManager;
    this.ledStateRGB = deviceBundle.completeDevice.fetchStateResponse.ledStateRGB; //already cloning the ledStateRGB at the setter
    this.deviceAPI = getAPI(deviceBundle.completeDevice.fetchStateResponse.deviceMetaData);
    this.id = deviceBundle.completeDevice.protoDevice.uniqueId;
  }

  public async setOn(value: boolean, maxRetries: number = 0) {
    // Use our buffered partial update with just the isOn property
    const deviceCommand = mergeDeep<DeviceCommandRGB>(DEFAULT_COMMAND, { isOn: value });
    return await this.deviceManager.sendCommand(deviceCommand, this.generateCommandOptions(POWER, maxRetries));
  }

  public async setLEDRGB(deviceCommandRGB: DeviceCommandRGB, maxRetries: number = 0, colorAssist: boolean = true) {
    const commandOptions = this.generateCommandOptions(LED, maxRetries, colorAssist);
    return await this.sendCommandRGB(deviceCommandRGB, commandOptions);
  }

  public async setLEDHSV(deviceCommandHSV: DeviceCommandHSV, maxRetries: number = 0, colorAssist: boolean = true) {
    if (deviceCommandHSV.HSV.hue !== undefined) {
      this.lastKnownHue = deviceCommandHSV.HSV.hue;
    }

    const deviceCommandRGB = this.hsvCommandToRGB(deviceCommandHSV);
    return await this.setLEDRGB(deviceCommandRGB, maxRetries, colorAssist);
  }

  private hsvCommandToRGB(deviceCommandHSV: DeviceCommandHSV) {
    const rgb = HSVtoRGB(deviceCommandHSV.HSV);
    return { isOn: deviceCommandHSV.isOn, RGB: rgb, CCT: deviceCommandHSV.CCT };
  }

  private async sendCommandRGB(deviceCommand: DeviceCommandRGB, commandOptions: CommandOptions) {
    const newDeviceCommand: DeviceCommandRGB = adjustCommandToAPI(deviceCommand, commandOptions, this.deviceAPI);
    mergeDeep(this.lastOutboundCommand, newDeviceCommand);

    await this.deviceManager.sendCommand(newDeviceCommand, commandOptions);
    // this.ledStateRGB = completeResponse.fetchStateResponse.ledStateRGB;
    // return completeResponse;
  }

  private generateCommandOptions(commandType: CommandType, maxRetries: number = 0, colorAssist: boolean = true): CommandOptions {
    let commandOptions: CommandOptions = combineDeep<CommandOptions>(
      DEFAULT_COMMAND_OPTIONS, {
      isEightByteProtocol: this.deviceAPI.isEightByteProtocol,
      commandType,
    });

    if (maxRetries > 0) {
      commandOptions = combineDeep<CommandOptions>(commandOptions, { maxRetries, waitForResponse: true });
    }
    if (!colorAssist) {
      commandOptions = combineDeep<CommandOptions>(commandOptions, { colorAssist: false });
    }
    return commandOptions;
  }

  public async fetchDeviceStateRGB(): Promise<LEDStateRGB> {
    let scans = 0,
      fetchStateResponse: FetchStateResponse;

    do {
      fetchStateResponse = await this.deviceManager.queryState();

      const byteOrder = this.deviceAPI.byteOrder;
      if (byteOrder[0] === 'g' && byteOrder[1] === 'r' && byteOrder[2] === 'b') {
        const { red, green, blue } = fetchStateResponse.ledStateRGB.RGB;
        fetchStateResponse.ledStateRGB.RGB = { red: green, green: red, blue };
      }
      scans++;
    } while (fetchStateResponse?.ledStateRGB == null && scans < 5);
    if (scans >= 5) {
      throw Error('fetchStateRGB - No response given');
    }
    if (typeof fetchStateResponse == 'undefined') {
      throw Error('fetchStateRGB - No response given');
    }

    this.ledStateRGB = fetchStateResponse.ledStateRGB;
    return fetchStateResponse.ledStateRGB;
  }

  public async fetchDeviceStateHSV(): Promise<ledStateHSV> {
    const state = await this.fetchDeviceStateRGB();
    return { isOn: state.isOn, HSV: RGBtoHSV(state.RGB), CCT: state.CCT };
  }

  //#region Animation
  public getAnimationList() {
    return this.animationList;
  }

  public hasAnimation(animationName: string) {
    return this.animationList.includes(animationName);
  }

  public appendAnimationList(animationName: string | string[]) {
    if (Array.isArray(animationName)) {
      animationName.forEach((name) => {
        if (!this.animationList.includes(name)) {
          this.animationList.push(name);
        }
      });
    } else if (!this.animationList.includes(animationName)) {
      this.animationList.push(animationName);
    }
  }

  public removeAnimationFromList(animationName: string | string[]) {
    if (Array.isArray(animationName)) {
      animationName.forEach((name) => {
        const index = this.animationList.indexOf(name);
        if (index > -1) {
          this.animationList.splice(index, 1);
        }
      });
    } else {
      const index = this.animationList.indexOf(animationName);
      if (index > -1) {
        this.animationList.splice(index, 1);
      }
    }
  }

  setLEDColorAnimation(color: IAnimationColorStep): void {
    // console.log(this.fullDeviceInformation.protoDevice.)
    const COLOR = {
      red: 0,
      green: 0,
      blue: 0,
      warmWhite: 0,
      coldWhite: 0,
    };

    // Use a type assertion to handle the index access
    for (const colorKey in color) {
      const key = colorKey as keyof IAnimationColorStep;
      const typedKey = colorKey as keyof typeof COLOR;
      COLOR[typedKey] = color[key] as number;
    }

    const deviceCommand: DeviceCommandRGB = {
      isOn: true,
      RGB: { red: COLOR.red, green: COLOR.green, blue: COLOR.blue },
      CCT: { warmWhite: COLOR.warmWhite, coldWhite: COLOR.coldWhite },
    };

    const commandOptions: CommandOptions = {
      waitForResponse: false,
      isEightByteProtocol: this.deviceAPI.isEightByteProtocol,
      maxRetries: 0,
      commandType: ANIMATION_FRAME,
      colorAssist: true,
    };

    this.sendCommandRGB(deviceCommand, commandOptions);
  }
  //#endregion
} 