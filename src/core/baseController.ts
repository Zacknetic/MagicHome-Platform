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
  CompleteResponse,
  FetchStateResponse,
  ledStateHSV,
  DeviceCommandHSV,
} from 'magichome-core';

import { FullDeviceInformation, DeviceAPI, IAnimationColorStep } from '../models/types';
import { adjustCommandToAPI, getAPI } from '../utils/platformUtils';
import { HSVtoRGB, RGBtoHSV } from '../utils/colorConversions';

const { POWER, ANIMATION_FRAME, LED } = CommandType;

// Define interfaces for partial updates
interface HSVPartial {
  hue?: number;
  saturation?: number;
  value?: number;
}

interface DeviceCommandHSVPartial {
  isOn?: boolean;
  HSV?: HSVPartial;
  CCT?: {
    warmWhite?: number;
    coldWhite?: number;
  };
}

const DEFAULT_COMMAND_OPTIONS: CommandOptions = {
  waitForResponse: false,
  maxRetries: 0,
  commandType: LED,
  isEightByteProtocol: false,
  colorAssist: true,
};
export class BaseController {

  protected _ledStateRGB: LEDStateRGB | null = null;
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

  // protected get options() {
  //   return {
  //     get: (partial: Partial<CommandOptions> & {
  //       maxRetries?: number,
  //       colorAssist?: boolean,
  //       commandType: CommandType
  //     }): CommandOptions => {
  //       let options: CommandOptions = {
  //         isEightByteProtocol: this.deviceAPI.isEightByteProtocol,
  //         commandType,
  //         colorAssist: partial.colorAssist ?? true
  //       };

  //       if (partial.maxRetries && partial.maxRetries > 0) {
  //         options = {
  //           ...options,
  //           maxRetries: partial.maxRetries,
  //           waitForResponse: true
  //         };
  //       }

  //       return combineDeep<CommandOptions>(DEFAULT_COMMAND_OPTIONS, options);
  //     }
  //   };
  // }

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
  get deviceManager(): DeviceManager {
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
    await this.fetchDeviceStateRGB();

    const deviceCommand = this.command.get({ isOn: value });
    const commandOptions = this.generateCommandOptions(POWER, maxRetries);
    return await this.deviceManager.sendCommand(deviceCommand, commandOptions);
  }

  async setLEDRGB(deviceCommandRGB: DeviceCommandRGB, maxRetries: number = 0, colorAssist: boolean = true) {
    const commandOptions = this.generateCommandOptions(LED, maxRetries, colorAssist);    return await this.sendCommandRGB(deviceCommandRGB, commandOptions);
  }

  public async setLEDHSV(deviceCommandHSV: DeviceCommandHSV, maxRetries: number = 0, colorAssist: boolean = true) {
    this.lastKnownHue = deviceCommandHSV.HSV.hue;

    const deviceCommandRGB = this.hsvCommandToRGB(deviceCommandHSV);
    return await this.setLEDRGB(deviceCommandRGB, maxRetries, colorAssist);
  }

  /**
   * Set LED state with partial HSV update
   * This method handles partial updates by merging with the current device state
   * @param {DeviceCommandHSVPartial} partialCommand - Partial HSV command with only the values to update
   * @param {number} maxRetries - Maximum number of retries for the command
   * @param {boolean} colorAssist - Whether to enable color assist
   * @returns {Promise<CompleteResponse>} - Command response
   */
  public async setLEDHSVPartial(partialCommand: DeviceCommandHSVPartial, maxRetries: number = 0, colorAssist: boolean = true) {
    // Get current state
    await this.fetchDeviceStateHSV();
    const currentState = this.ledStateHSV;
    
    // Create a complete command by merging the partial command with current state
    const fullCommand: DeviceCommandHSV = {
      isOn: partialCommand.isOn !== undefined ? partialCommand.isOn : currentState.isOn,
      HSV: {
        hue: partialCommand.HSV?.hue !== undefined ? partialCommand.HSV.hue : currentState.HSV.hue,
        saturation: partialCommand.HSV?.saturation !== undefined ? partialCommand.HSV.saturation : currentState.HSV.saturation,
        value: partialCommand.HSV?.value !== undefined ? partialCommand.HSV.value : currentState.HSV.value,
      },
      CCT: {
        warmWhite: partialCommand.CCT?.warmWhite !== undefined ? partialCommand.CCT.warmWhite : currentState.CCT.warmWhite,
        coldWhite: partialCommand.CCT?.coldWhite !== undefined ? partialCommand.CCT.coldWhite : currentState.CCT.coldWhite,
      },
    };
    
    // If just isOn is being changed, use the specific power command
    if (partialCommand.isOn !== undefined && 
        !partialCommand.HSV && 
        !partialCommand.CCT) {
      return await this.setOn(partialCommand.isOn, maxRetries);
    }
    
    // Store the hue value for future reference
    if (partialCommand.HSV?.hue !== undefined) {
      this.lastKnownHue = partialCommand.HSV.hue;
    }
    
    // Send the complete command
    return await this.setLEDHSV(fullCommand, maxRetries, colorAssist);
  }

  private hsvCommandToRGB(deviceCommandHSV: DeviceCommandHSV): DeviceCommandRGB {
    const rgb = HSVtoRGB(deviceCommandHSV.HSV);
    return { isOn: true, RGB: rgb, CCT: deviceCommandHSV.CCT };
  }

  private async sendCommandRGB(deviceCommand: DeviceCommandRGB, commandOptions: CommandOptions) {
    const newDeviceCommand: DeviceCommandRGB = adjustCommandToAPI(deviceCommand, commandOptions, this.deviceAPI);
    mergeDeep(this.lastOutboundCommand, newDeviceCommand);

    const completeResponse: CompleteResponse = await this.deviceManager.sendCommand(newDeviceCommand, commandOptions);
    this.ledStateRGB = completeResponse.fetchStateResponse.ledStateRGB;
    return completeResponse;
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
      if (byteOrder[0] == 'g' && byteOrder[1] == 'r' && byteOrder[2] == 'b') {
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

    for (const colorKey in color) {
      COLOR[colorKey as keyof IAnimationColorStep] = color[colorKey as keyof IAnimationColorStep];
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