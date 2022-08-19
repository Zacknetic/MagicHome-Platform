import { IProtoDevice, ICompleteDevice, COMMAND_TYPE, ICommandOptions, IDeviceCommand, IDeviceState, IDeviceMetaData, DeviceInterface, COLOR_MASKS, ICompleteResponse, DEFAULT_COMMAND, DEFAULT_COMMAND_OPTIONS, mergeDeep } from 'magichome-core';

import { deviceTypesMap } from './utils/deviceTypesMap';
import { clamp, waitForMe } from './utils/miscUtils'
import { IDeviceInformation, IDeviceAPI } from './utils/types';
import { IAnimationLoop } from '.';
import { adjustCommandToAPI, getAPI } from './utils/platformUtils';
import { overwriteDeep } from 'magichome-core/dist/utils/miscUtils';


const { WHITE, COLOR, BOTH } = COLOR_MASKS;
const { POWER_COMMAND, COLOR_COMMAND, ANIMATION_FRAME, QUERY_COMMAND } = COMMAND_TYPE;

export class BaseController {
  protected deviceInterface: DeviceInterface;

  protected deviceWriteStatus;
  protected devicePowerCommand;

  protected completeDevice: ICompleteDevice;
  protected deviceState: IDeviceState;
  protected deviceMetaData: IDeviceMetaData;
  protected protoDevice: IProtoDevice;
  protected deviceAPI: IDeviceAPI;
  protected latestUpdateTime: number

  //=================================================
  // Start Constructor //
  constructor(completeDevice: ICompleteDevice) {
    this.completeDevice = completeDevice;
    this.deviceInterface = completeDevice.deviceInterface;
    this.protoDevice = completeDevice.completeDeviceInfo.protoDevice;
    this.deviceMetaData = completeDevice.completeDeviceInfo.deviceMetaData;
    this.latestUpdateTime = completeDevice.completeDeviceInfo.latestUpdate;
    this.deviceState = completeDevice.completeResponse.deviceState;
    this.deviceAPI = getAPI(this.deviceMetaData);

  };
  //=================================================
  // End Constructor //

  public async setOn(value: boolean) {
    const deviceCommand: IDeviceCommand = mergeDeep({}, { isOn: value }, DEFAULT_COMMAND)
    const commandOptions = mergeDeep({}, { isEightByteProtocol: this.deviceAPI.isEightByteProtocol, commandType: POWER_COMMAND }, DEFAULT_COMMAND_OPTIONS)
    if (!deviceCommand.isOn && this.deviceState.isOn) await this.deviceInterface.sendCommand(deviceCommand, commandOptions);
    return await this.deviceInterface.sendCommand(deviceCommand, commandOptions);
  }

  public async setAllValues(deviceCommand: IDeviceCommand, commandOptions?: ICommandOptions) {

    mergeDeep(commandOptions, { colorAssist: true, isEightByteProtocol: this.deviceAPI.isEightByteProtocol, timeoutMS: 50, bufferMS: 50, commandType: COLOR_COMMAND, maxRetries: 5, remainingRetries: 5 })
    // mergeDeep(commandOptions, DEFAULT_COMMAND_OPTIONS)
    this.writeCommand(deviceCommand, commandOptions)
  }

  private async writeCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICompleteResponse | boolean> {

    this.precheckPowerState();
    const newDeviceCommand = adjustCommandToAPI(deviceCommand, commandOptions, this.deviceAPI);
    let completeResponse: ICompleteResponse;
    try {
      completeResponse = await this.deviceInterface.sendCommand(newDeviceCommand, commandOptions);
    } catch (error) {
      if (this.deviceAPI.isEightByteProtocol === null) {
        //console.log("CHANGING DEVICE PROTOCOL", this.deviceAPI.description, this.protoDevice.uniqueId, this.deviceState.controllerFirmwareVersion, this.deviceState.controllerHardwareVersion);
        this.deviceAPI.isEightByteProtocol = true;
        completeResponse = await this.deviceInterface.sendCommand(newDeviceCommand, commandOptions).catch(()=> {throw "NOT GETTING BACK RESPONSE PLATFORM"});
      }
    }
    console.log(completeResponse)
    if (completeResponse.responseCode > 0) this.overwriteLocalState(completeResponse);
    return completeResponse;
  }

  private async precheckPowerState() {
    if (this.deviceAPI.needsPowerCommand && !this.deviceState.isOn) {
      this.deviceInterface.sendCommand(null, { commandType: POWER_COMMAND, waitForResponse: false });
      await waitForMe(500);
    }
  }

  public async fetchState(_timeout: number = 200): Promise<IDeviceState> {

    let scans = 0, completeResponse: ICompleteResponse;
    while (completeResponse?.deviceState == null && scans < 5) {
      completeResponse = await this.deviceInterface.queryState(500);
      scans++;
    }
    if (completeResponse.deviceState) {
      this.deviceState = completeResponse.deviceState;
      return completeResponse.deviceState;
    }
  }

  private overwriteLocalState(completeResponse: ICompleteResponse): void {

    try {
      // console.log("THIS STATE: ", this.deviceState);
      // console.log("NEW STATE: ", completeResponse.deviceState);
      overwriteDeep(this.deviceState, completeResponse.deviceState);

    } catch (error) {
      console.log("MH PLATFORM ERROR: ", error)
    }
  }


  // public cacheCurrentLightState() {
  //   this.LEDStateTemporary = this.deviceState.LEDState;
  // }

  // public async restoreCachedLightState(_commandOptions?: ICommandOptions): Promise<ICommandResponse> {
  //   this.deviceState.LEDState = this.LEDStateTemporary;
  //   const deviceCommand: IDeviceCommand = this.deviceState.LEDState;
  //   return await this.processCommand(deviceCommand, _commandOptions)
  // }

  public getCachedDeviceInformation(): IDeviceInformation {
    return { deviceAPI: this.deviceAPI, protoDevice: this.protoDevice, deviceState: this.deviceState, deviceMetaData: this.deviceMetaData };
  }
}

