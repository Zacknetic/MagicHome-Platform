import { IProtoDevice, ICompleteDevice, COMMAND_TYPE, ICommandOptions, IDeviceCommand, IDeviceState, IDeviceMetaData, DeviceInterface, COLOR_MASKS, ICompleteResponse, DEFAULT_COMMAND, DEFAULT_COMMAND_OPTIONS, mergeDeep } from 'magichome-core';

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
  first: boolean = true;

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

  public setOn(value: boolean) {
    const deviceCommand: IDeviceCommand = mergeDeep({}, { isOn: value }, DEFAULT_COMMAND)
    const commandOptions = mergeDeep({}, { isEightByteProtocol: this.deviceAPI.isEightByteProtocol, commandType: POWER_COMMAND }, DEFAULT_COMMAND_OPTIONS)
    if (!deviceCommand.isOn && this.deviceState.isOn) this.deviceInterface.sendCommand(deviceCommand, commandOptions);
    this.deviceInterface.sendCommand(deviceCommand, commandOptions)
  }

  public setAllValues(deviceCommand: IDeviceCommand, commandOptions?: ICommandOptions) {

    mergeDeep(commandOptions, { colorAssist: true, isEightByteProtocol: this.deviceAPI.isEightByteProtocol, timeoutMS: 50, bufferMS: 50, commandType: COLOR_COMMAND, maxRetries: 5 })
    mergeDeep(commandOptions, DEFAULT_COMMAND_OPTIONS)
    this.writeCommand(deviceCommand, commandOptions);
  }

  private async writeCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {
    // console.log(deviceCommand)
    const newDeviceCommand = adjustCommandToAPI(deviceCommand, commandOptions, this.deviceAPI);
    await this.precheckPowerState(deviceCommand, commandOptions);

    const completeResponse = await this.deviceInterface.sendCommand(newDeviceCommand, commandOptions).catch(e => { }) as ICompleteResponse

    // if (this.deviceAPI.isEightByteProtocol === null) {
    //   this.deviceAPI.isEightByteProtocol = true;
    //   return await this.writeCommand(deviceCommand, commandOptions)
    // }

    if (completeResponse.responseCode > 0) this.overwriteLocalState(completeResponse.deviceState);
  }

  private async precheckPowerState(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {
    // console.log(this.deviceState.isOn)
    if (this.first && this.deviceAPI.needsPowerCommand && !this.deviceState.isOn && deviceCommand.isOn) {
      this.deviceInterface.sendCommand({ isOn: true, RGB: null, CCT: null }, { commandType: POWER_COMMAND, waitForResponse: false, maxRetries: 0, timeoutMS: 50 });
      this.first = false;
      // await waitForMe(500).catch(e => { throw 'waitforme somehow failed?' });
      this.overwriteLocalState( {isOn: true} as IDeviceState)
    }
  }

  public async fetchState(timeout: number = 500): Promise<IDeviceState> {

    let scans = 0, completeResponse: ICompleteResponse;
    do {
      completeResponse = await this.deviceInterface.queryState(timeout).catch(e => { throw e });
      scans++;
    } while (completeResponse?.deviceState == null && scans < 5)
    if (typeof completeResponse == 'undefined') throw 'no response given'
    this.deviceState = completeResponse.deviceState;
    return completeResponse.deviceState;

  }

  private overwriteLocalState(deviceState: IDeviceState): void {

    try {
      overwriteDeep(this.deviceState, deviceState);
    } catch (error) {
      console.log("MH PLATFORM ERROR: ", error)
    }
  }

  public initializeController() {
    // console.log("API!!!!!!!!", this.deviceAPI);

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

