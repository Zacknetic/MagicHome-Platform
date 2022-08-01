import { DeviceInterface, ICommandOptions, ICompleteDevice, IDeviceCommand, IDeviceMetaData, IDeviceState, IProtoDevice, IIncompleteCommand, ITransportResponse } from 'magichome-core';

import { deviceTypesMap } from '../DeviceTypesMap';
import { clamp } from '../utils/miscUtils'
// import { Animations } from '../utils/Animations';
import { _ } from 'lodash'
import { IDeviceInformation, IDeviceAPI } from '../types';
import { ColorMasks, DefaultCommand, CommandDefaults, COMMAND_TYPE } from 'magichome-core';
import { IAnimationLoop } from '..';
import { getAPI } from '../utils/platformUtils';


const { white, color, both } = ColorMasks;
const { POWER_COMMAND, COLOR_COMMAND, ANIMATION_FRAME, QUERY_COMMAND } = COMMAND_TYPE;

export class BaseController {
  protected deviceInterface: DeviceInterface;

  protected deviceWriteStatus;
  protected devicePowerCommand;

  protected newDeviceCommand: IDeviceCommand = DefaultCommand;

  protected deviceState: IDeviceState;
  protected deviceMetaData: IDeviceMetaData;
  protected protoDevice: IProtoDevice;
  protected deviceAPI: IDeviceAPI;
  protected latestUpdateTime: number

  // protected animation: Animations;

  //=================================================
  // Start Constructor //
  constructor(completedDevice: ICompleteDevice) {
    _.merge(this.newDeviceCommand, DefaultCommand);


    this.deviceInterface = completedDevice.deviceInterface;
    this.protoDevice = completedDevice.protoDevice;
    this.latestUpdateTime = completedDevice.latestUpdate;
    this.deviceState = completedDevice.transportResponse.deviceState;
    this.deviceMetaData = completedDevice.transportResponse.deviceMetaData;
    this.deviceAPI = getAPI(this.deviceMetaData)
    // this.animation = new Animations();
  };
  //=================================================
  // End Constructor //

  // public async setOn(value: boolean, _commandOptions?: ICommandOptions) {
  //   const deviceCommand: IIncompleteCommand = Object.ass{ isOn: value }
  //   return await this.processCommand(deviceCommand, _commandOptions);
  // }

  // public async setAllValues(deviceCommand: IDeviceCommand, _commandOptions: ICommandOptions = CommandDefaults) {
  //   return await this.processCommand(deviceCommand, _commandOptions);
  // }

  // private async processCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions = CommandDefaults): Promise<ICommandResponse> {


  // }

  // private async prepareCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICommandResponse> {


  //   //console.log('everything is probably fine', this.deviceAPI.description, this.protoDevice.uniqueId, this.deviceState.controllerHardwareVersion.toString(16), this.deviceAPI.needsPowerCommand, this.deviceState.controllerFirmwareVersion)

  //   const deviceResponse = await this.writeCommand(deviceCommand, commandOptions);

  // }

  // private overwriteLocalState(deviceCommand: IDeviceCommand) {
  //   if (this.devicePowerCommand) {
  //     _.merge(this.deviceState, deviceCommand.isOn);
  //   } else {
  //     _.merge(this.deviceState, deviceCommand);
  //   }
  // }

  // private async writeCommand(deviceCommand: IIncompleteCommand, commandOptions: ICommandOptions): Promise<ITransportResponse> {
  //   let transportResponse: ITransportResponse;
  //   if (commandOptions.commandType == POWER_COMMAND) {

  //     // if (!deviceCommand.isOn && this.deviceState.LEDState.isOn) {
  //     //   this.deviceInterface.sendCommand(deviceCommand, commandOptions);
  //     //   this.deviceInterface.sendCommand(COMMAND_POWER_OFF);
  //     // }

  //     transportResponse = await this.deviceInterface.sendCommand(deviceCommand, commandOptions);
  //     return transportResponse;
  //   } else {
  //     let powerUpWaitTime = 0;
  //     if (this.deviceAPI.needsPowerCommand && !this.deviceState.LEDState.isOn) {
  //       powerUpWaitTime = 500;
  //       this.send(COMMAND_POWER_ON);
  //     }

  //     setTimeout(async () => {

  //       const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite } } = deviceCommand;
  //       const { isEightByteProtocol } = this.deviceAPI;
  //       if (!deviceCommand.colorMask) {
  //         if (this.deviceAPI.simultaneousCCT) deviceCommand.colorMask = both;
  //         else {
  //           if (Math.max(warmWhite, coldWhite) > Math.max(red, green, blue)) {
  //             deviceCommand.colorMask = white;
  //           } else {
  //             deviceCommand.colorMask = color;
  //           }
  //         }
  //       }


  //       transportResponse = this.deviceInterface.sendCommand(deviceCommand, commandOptions);
  //       if (transportResponse == null && this.deviceAPI.isEightByteProtocol === null) {
  //         //console.log("CHANGING DEVICE PROTOCOL", this.deviceAPI.description, this.protoDevice.uniqueId, this.deviceState.controllerFirmwareVersion, this.deviceState.controllerHardwareVersion);
  //         this.deviceAPI.isEightByteProtocol = true;
  //         transportResponse = await this.writeCommand(deviceCommand, commandOptions).catch(error => {
  //           //console.log(error);
  //         });
  //       }

  //       if (!deviceCommand.isOn) {
  //         transportResponse = await this.send(COMMAND_POWER_OFF);
  //       }
  //       return transportResponse
  //     }, powerUpWaitTime);
  //   }

  // }

  // public async fetchState(_timeout: number = 200): Promise<IDeviceState> {
  //   return new Promise(async (resolve, reject) => {
  //     const { ipAddress } = this.protoDevice;
  //     if (typeof ipAddress !== 'string') {
  //       reject(`Cannot determine controller because invalid IP address. Device:' ${ipAddress}`);
  //     }

  //     let scans = 0, data: Buffer;

  //     while (data == null && scans < 5) {
  //       data = await this.deviceInterface.getState(_timeout);
  //       scans++;
  //     }
  //     if (data) {
  //       const deviceState = await parseDeviceState(data);
  //       this.deviceState = deviceState;
  //       resolve(deviceState);
  //     }
  //     // else {
  //     //   reject('[DeviceControllers](GetState) unable to retrieve data.');
  //     // }
  //   })
  // }



  // public cacheCurrentLightState() {
  //   this.LEDStateTemporary = this.deviceState.LEDState;
  // }

  // public async restoreCachedLightState(_commandOptions?: ICommandOptions): Promise<ICommandResponse> {
  //   this.deviceState.LEDState = this.LEDStateTemporary;
  //   const deviceCommand: IDeviceCommand = this.deviceState.LEDState;
  //   return await this.processCommand(deviceCommand, _commandOptions)
  // }

  // public async initializeController(deviceAPI?: IDeviceAPI, deviceState?: IDeviceState) {



  // }



  // public getCachedDeviceInformation(): IDeviceInformation {
  //   return { deviceAPI: this.deviceAPI, protoDevice: this.protoDevice, deviceState: this.deviceState };
  // }

  // public async animateIndividual(animation: IAnimationLoop) {
  //   console.log('starting animation')

  //   await this.animation.animateIndividual(this, animation);
  // }

  // public clearAnimations() {
  //   this.animation.clearAnimations();
  // }

}
