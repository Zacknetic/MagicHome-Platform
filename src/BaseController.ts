import { IProtoDevice, ICompleteDevice, COMMAND_TYPE, ICommandOptions, IDeviceCommand, IDeviceState, IDeviceMetaData, DeviceInterface, COLOR_MASKS, ICompleteResponse, DEFAULT_COMMAND, DEFAULT_COMMAND_OPTIONS, mergeDeep } from 'magichome-core';

import { deviceTypesMap } from './utils/deviceTypesMap';
import { clamp } from './utils/miscUtils'
import { IDeviceInformation, IDeviceAPI } from './utils/types';
import { IAnimationLoop } from '.';
import { getAPI } from './utils/platformUtils';


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
  protected sendCommand;

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

  public async setOn(value: boolean, _commandOptions?: ICommandOptions) {
    const deviceCommand: IDeviceCommand = mergeDeep({}, DEFAULT_COMMAND, { isOn: value })
    _commandOptions = mergeDeep({}, DEFAULT_COMMAND_OPTIONS, { isEightByteProtocol: this.deviceAPI.isEightByteProtocol, commandType: POWER_COMMAND })
    this.writeCommand(deviceCommand, _commandOptions);
  }

  public async setAllValues(deviceCommand: IDeviceCommand, _commandOptions: ICommandOptions) {

    _commandOptions = Object.assign({}, DEFAULT_COMMAND_OPTIONS, _commandOptions, { isEightByteProtocol: this.deviceAPI.isEightByteProtocol, commandType: COLOR_COMMAND })
    this.writeCommand(deviceCommand, _commandOptions)
  }

  private overwriteLocalState(completeResponse: ICompleteResponse): boolean {
    try {
      this.deviceState = Object.assign({}, this.deviceState, completeResponse.deviceState);
      return true;
    } catch (e) {
      return false;
    }
  }

  private async writeCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICompleteResponse | boolean> {
    let completeResponse;

    if (commandOptions.commandType == POWER_COMMAND) {
      if (!deviceCommand.isOn && this.deviceState.isOn) this.deviceInterface.sendCommand(deviceCommand, commandOptions);
      completeResponse = await this.deviceInterface.sendCommand(deviceCommand, commandOptions);
    } else {
      let powerUpWaitTime = 0;
      if (this.deviceAPI.needsPowerCommand && !this.deviceState.isOn) {
        powerUpWaitTime = 500;
        this.deviceInterface.sendCommand(null, { commandType: POWER_COMMAND, waitForResponse: false });
      }

      completeResponse = new Promise(async resolve => {
        await setTimeout(async () => {
          const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite } } = deviceCommand;
          const { isEightByteProtocol } = this.deviceAPI;

          try {
            completeResponse = await this.deviceInterface.sendCommand(deviceCommand, commandOptions);
          } catch (error) {
            if (this.deviceAPI.isEightByteProtocol === null) {
              //console.log("CHANGING DEVICE PROTOCOL", this.deviceAPI.description, this.protoDevice.uniqueId, this.deviceState.controllerFirmwareVersion, this.deviceState.controllerHardwareVersion);
              this.deviceAPI.isEightByteProtocol = true;
              completeResponse = await this.writeCommand(deviceCommand, commandOptions);
            }
          }

          resolve(completeResponse);
        }, powerUpWaitTime);
      })

    }
    this.overwriteLocalState(completeResponse);
    return completeResponse;
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