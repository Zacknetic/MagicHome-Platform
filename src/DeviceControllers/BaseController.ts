import { EventNumber, CommandOptionDefaults, IProtoDevice, ICompleteDevice, COMMAND_TYPE, ICommandOptions, IDeviceCommand, IColorRGB, IColorCCT, IDeviceResponse, IDeviceState, IDeviceMetaData, ITransportResponse, DeviceInterface, ColorMasks, DefaultCommand } from 'magichome-core';

import { deviceTypesMap } from '../DeviceTypesMap';
import { clamp } from '../utils/miscUtils'
// import { Animations } from '../utils/Animations';
import { _ } from 'lodash'
import { IDeviceInformation, IDeviceAPI } from '../types';
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
  protected sendCommand;
  protected first = true;
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

  public setOn(value: boolean, _commandOptions: ICommandOptions = CommandOptionDefaults) {
    const deviceCommand: IDeviceCommand = Object.assign({}, DefaultCommand, { isOn: value })
    _commandOptions = Object.assign({}, CommandOptionDefaults, { isEightByteProtocol: this.deviceAPI.isEightByteProtocol, commandType: POWER_COMMAND })
    this.prepareCommand(deviceCommand, _commandOptions);
  }

  public async setAllValues(deviceCommand: IDeviceCommand, _commandOptions: ICommandOptions = CommandOptionDefaults) {

    _commandOptions = Object.assign({}, CommandOptionDefaults, _commandOptions, { isEightByteProtocol: this.deviceAPI.isEightByteProtocol, commandType: COLOR_COMMAND })


    this.prepareCommand(deviceCommand, _commandOptions)
    
    if (this.first) {
      this.first = false;
      console.log(this.deviceMetaData.controllerHardwareVersion, " : ", this.deviceMetaData.controllerFirmwareVersion)
    //   let i = 0;

    //   testing();
    //   async function testing() {
    //     await setTimeout(() => {
    //       console.log(i)
    //       if (i > 1000) return
    //       i++;
    //       setImmediate(() => testing())
    //     }, 1000);
    //   }

    }
  }



  private async prepareCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {
    //console.log('everything is probably fine', this.deviceAPI.description, this.protoDevice.uniqueId, this.deviceState.controllerHardwareVersion.toString(16), this.deviceAPI.needsPowerCommand, this.deviceState.controllerFirmwareVersion)

    return await this.writeCommand(deviceCommand, commandOptions)

  }

  private overwriteLocalState(deviceCommand: IDeviceCommand) {
    if (this.devicePowerCommand) {
      _.merge(this.deviceState, deviceCommand.isOn);
    } else {
      _.merge(this.deviceState, deviceCommand);
    }
  }

  private async writeCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ITransportResponse | boolean> {
    let transportResponse;

    // if (commandOptions.commandType == POWER_COMMAND) {
    //   console.log("POWER")
    //   // if (!deviceCommand.isOn && this.deviceState.LEDState.isOn) {
    //   //   this.deviceInterface.sendCommand(deviceCommand, commandOptions);
    //   //   this.deviceInterface.sendCommand(COMMAND_POWER_OFF);
    //   // }

    //   transportResponse = await this.deviceInterface.sendCommand(deviceCommand, commandOptions);
    //   return transportResponse;
    // } else {
    let powerUpWaitTime = 0;
    if (this.deviceAPI.needsPowerCommand && !this.deviceState.isOn) {
      powerUpWaitTime = 500;
      this.deviceInterface.sendCommand(null, { commandType: POWER_COMMAND, waitForResponse: false });
    }

    return new Promise(async resolve => {
      await setTimeout(async () => {
        const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite } } = deviceCommand;
        const { isEightByteProtocol } = this.deviceAPI;
        if (!deviceCommand.colorMask) {
          if (this.deviceAPI.simultaneousCCT) deviceCommand.colorMask = both;
          if (this.deviceAPI.hasCCT && Math.max(warmWhite, coldWhite) > Math.max(red, green, blue)) deviceCommand.colorMask = white;
          else deviceCommand.colorMask = color;
        }

        try {

          transportResponse = await this.deviceInterface.sendCommand(deviceCommand, commandOptions);
        } catch (error) {
          if (this.deviceAPI.isEightByteProtocol === null) {
            //console.log("CHANGING DEVICE PROTOCOL", this.deviceAPI.description, this.protoDevice.uniqueId, this.deviceState.controllerFirmwareVersion, this.deviceState.controllerHardwareVersion);
            this.deviceAPI.isEightByteProtocol = true;
            transportResponse = await this.writeCommand(deviceCommand, commandOptions);
          }
        }

        this.deviceState = transportResponse.deviceState;
        resolve(transportResponse);
      }, powerUpWaitTime);
    })

    // }

  }

  public async fetchState(_timeout: number = 200): Promise<IDeviceState> {


    let scans = 0, transportResponse: ITransportResponse;


    while (transportResponse.deviceState == null && scans < 5) {
      transportResponse = await this.deviceInterface.queryState(500);
      scans++;
    }
    if (transportResponse.deviceState) {

      this.deviceState = transportResponse.deviceState;
      return transportResponse.deviceState;
    }
    // else {
    //   reject('[DeviceControllers](GetState) unable to retrieve data.');
    // }

  }



  // public cacheCurrentLightState() {
  //   this.LEDStateTemporary = this.deviceState.LEDState;
  // }

  // public async restoreCachedLightState(_commandOptions?: ICommandOptions): Promise<ICommandResponse> {
  //   this.deviceState.LEDState = this.LEDStateTemporary;
  //   const deviceCommand: IDeviceCommand = this.deviceState.LEDState;
  //   return await this.processCommand(deviceCommand, _commandOptions)
  // }

  public async initializeController(deviceAPI?: IDeviceAPI, deviceState?: IDeviceState) {



  }



  public getCachedDeviceInformation(): IDeviceInformation {
    return { deviceAPI: this.deviceAPI, protoDevice: this.protoDevice, deviceState: this.deviceState };
  }

  // public async animateIndividual(animation: IAnimationLoop) {
  //   console.log('starting animation')

  //   await this.animation.animateIndividual(this, animation);
  // }

  // public clearAnimations() {
  //   this.animation.clearAnimations();
  // }

}
