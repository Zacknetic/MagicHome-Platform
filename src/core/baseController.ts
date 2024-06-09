import {
  CommandType,
  CommandOptions,
  DeviceCommand,
  DeviceState,
  DeviceBundle,
  DeviceManager,
  DEFAULT_COMMAND,
  mergeDeep,
  cloneDeep,
  combineDeep,
  CompleteResponse,
  FetchStateResponse,
} from "magichome-core";

// import { clamp, waitForMe } from "./utils/miscUtils";
import { FullDeviceInformation, DeviceAPI, IAnimationColorStep } from "../models/types";
import { adjustCommandToAPI, getAPI } from "../utils/platformUtils";

const { POWER, ANIMATION_FRAME, LED } = CommandType;

const DEFAULT_COMMAND_OPTIONS: CommandOptions = {
  waitForResponse: true,
  maxRetries: 5,
  commandType: LED,
  isEightByteProtocol: false,
  colorAssist: true,
};
export class BaseController {

  private deviceState: DeviceState;
  private deviceAPI: DeviceAPI;
  private lastOutboundCommand: DeviceCommand | null = null;

  get fullDeviceInformation(): FullDeviceInformation {
    if (this.deviceBundle.completeDevice.fetchStateResponse.deviceMetaData === null) throw Error("DeviceMetaData is null");
    if (this.deviceBundle.completeDevice.protoDevice === null) throw Error("ProtoDevice is null");
    if (this.deviceBundle.completeDevice.fetchStateResponse.deviceState === null) throw Error("DeviceState is null");
    if (this.deviceAPI === null) throw Error("DeviceAPI is null");

    return {
      deviceAPI: this.deviceAPI,
      protoDevice: this.deviceBundle.completeDevice.protoDevice,
      deviceState: this.deviceState,
      deviceMetaData: this.deviceBundle.completeDevice.fetchStateResponse.deviceMetaData
    };
  }

  private _deviceManager: DeviceManager | null = null;
  get deviceManager(): DeviceManager {
    if (this._deviceManager === null) throw Error("DeviceManager is null");
    return this._deviceManager;
  }
  private set deviceManager(deviceManager: DeviceManager) {
    this._deviceManager = deviceManager;
  }

  public manuallyControlled: boolean = false;
  public id: string | null = null;
  // first: boolean = true;
  // initalized: boolean;
  protected animationList: string[] = [];

  //=================================================
  // Start Constructor //
  constructor(protected deviceBundle: DeviceBundle) {
    this.deviceManager = deviceBundle.deviceManager;
    this.deviceState = cloneDeep<DeviceState>(deviceBundle.completeDevice.fetchStateResponse.deviceState);
    this.deviceAPI = getAPI(deviceBundle.completeDevice.fetchStateResponse.deviceMetaData);
  }
  //=================================================
  // End Constructor //

  public async setOn(value: boolean, maxRetries: number = 0) {
    await this.fetchStateRGB();

    //TODO - fix this. It's a hack to prevent sending an off command to a device that is already off, causing a soft lock.
    // However, currently this causes a bug where the device will only turn off after a very long fetchStateRGB timeout.
    // need to figure out a local state cache to fix this.
    if (value === false && this.deviceState.isOn === false) return;

    const deviceCommand: DeviceCommand = combineDeep<DeviceCommand>(DEFAULT_COMMAND, { isOn: value });
    const commandOptions = this.generateCommandOptions(POWER, maxRetries);

    return await this.deviceManager.sendCommand(deviceCommand, commandOptions);
  }

  async setLED(deviceCommand: DeviceCommand, maxRetries: number = 0, colorAssist: boolean = true) {
    const commandOptions = this.generateCommandOptions(LED, maxRetries, colorAssist);
    return await this.sendCommand(deviceCommand, commandOptions);
  }

  private generateCommandOptions(commandType: CommandType, maxRetries: number = 0, colorAssist: boolean = true): CommandOptions {
    let commandOptions: CommandOptions = combineDeep<CommandOptions>(
      DEFAULT_COMMAND_OPTIONS, {
      isEightByteProtocol: this.deviceAPI.isEightByteProtocol,
      commandType,
    });

    if (maxRetries > 0) commandOptions = combineDeep<CommandOptions>(commandOptions, { maxRetries, waitForResponse: true });
    if (!colorAssist) commandOptions = combineDeep<CommandOptions>(commandOptions, { colorAssist: false });
    return commandOptions;
  }

  private async sendCommand(deviceCommand: DeviceCommand, commandOptions: CommandOptions) {
    const newDeviceCommand: DeviceCommand = adjustCommandToAPI(deviceCommand, commandOptions, this.deviceAPI);
    mergeDeep(this.lastOutboundCommand, newDeviceCommand);
    // console.log("Sending Command: ", newDeviceCommand);
    // this.precheckPowerState(deviceCommand, commandOptions);

    const completeResponse: CompleteResponse = await this.deviceManager.sendCommand(newDeviceCommand, commandOptions);
    if (completeResponse.fetchStateResponse?.deviceState) this.overwriteLocalState(completeResponse.fetchStateResponse.deviceState);
    return completeResponse;
  }

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

  //   public async setHSV(hue: number, saturation: number, value: number) {
  //     mergeDeep(this.lastOutboundState, { hue, saturation, value })
  //     try {
  //       await this.fetchStateRGB(500);
  //     } catch (e) {

  //     }

  //     const deviceCommand: IDeviceCommand = mergeDeep({}, DEFAULT_COMMAND, { hue, saturation, value })
  //     const commandOptions = mergeDeep({}, DEFAULT_COMMAND_OPTIONS, { isEightByteProtocol: this.deviceAPI.isEightByteProtocol, commandType: COLOR_COMMAND })
  //     this.deviceInterface.sendCommand(deviceCommand, commandOptions)
  //   }


  setLEDColorAnimation(color: IAnimationColorStep): void {
    const COLOR = {
      red: 0,
      green: 0,
      blue: 0,
      warmWhite: 0,
      coldWhite: 0,
    };
 
    for (const colorKey in color) {
      COLOR[colorKey as keyof IAnimationColorStep] = color[colorKey  as keyof IAnimationColorStep];
    }

    const deviceCommand: DeviceCommand = {
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

    this.sendCommand(deviceCommand, commandOptions);
  }

  // private async precheckPowerState(deviceCommand: DeviceCommand, commandOptions: CommandOptions) {
  //   if (this.first && this.deviceAPI.needsPowerCommand && !this.deviceState.isOn && deviceCommand.isOn) {
  //     this.setOn(true);
  //     await this.deviceManager.sendCommand(
  //       { isOn: true, RGB: null, CCT: null },
  //       {
  //         commandType: POWER,
  //         waitForResponse: false,
  //         maxRetries: 0,
  //         isEightByteProtocol: this.deviceAPI.isEightByteProtocol,
  //       }
  //     );
  //     this.first = false;
  //     this.overwriteLocalState({ isOn: true } as IDeviceState);
  //   }
  // }

  public async fetchStateRGB(): Promise<DeviceState> {
    let scans = 0,
      fetchStateResponse: FetchStateResponse;

    do {
      fetchStateResponse = await this.deviceManager.queryState();

      const byteOrder = this.deviceAPI.byteOrder;
      if (byteOrder[0] == "g" && byteOrder[1] == "r" && byteOrder[2] == "b") {
        const { red, green, blue } = fetchStateResponse.deviceState.RGB;
        fetchStateResponse.deviceState.RGB = { red: green, green: red, blue };
      }
      scans++;
    } while (fetchStateResponse?.deviceState == null && scans < 5);
    if (scans >= 5) throw Error("fetchStateRGB - No response given");
    if (typeof fetchStateResponse == "undefined") throw Error("fetchStateRGB - No response given");

    this.overwriteLocalState(fetchStateResponse.deviceState);
    return fetchStateResponse.deviceState;
  }

  // public async fetchStateHSV(timeout: number = 500): Promise<IDeviceState> {
  //   let scans = 0, completeResponse: ICompleteResponse;
  //   do {
  //     try {
  //       completeResponse = await this.deviceInterface.queryState(timeout)

  //     } catch (e) {

  //     }
  //     scans++;
  //   }
  //   while (completeResponse?.deviceState == null && scans < 5)
  //   if (typeof completeResponse == 'undefined') throw 'no response given';
  // }

  private overwriteLocalState(deviceState: DeviceState): void {
    this.deviceState = deviceState;
  }

  // public cacheCurrentLightState() {
  //   this.LEDStateTemporary = this.deviceState.LEDState;
  // }

  // public async restoreCachedLightState(_commandOptions?: ICommandOptions): Promise<ICommandResponse> {
  //   this.deviceState.LEDState = this.LEDStateTemporary;
  //   const deviceCommand: IDeviceCommand = this.deviceState.LEDState;
  //   return await this.processCommand(deviceCommand, _commandOptions)
  // }
}
