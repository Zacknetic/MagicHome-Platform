import { lightTypesMap as deviceTypesMap } from '../LightMap';
import { clamp, parseDeviceState } from '../utils/miscUtils'
import { _ } from 'lodash'
import { Transport } from 'magichome-core';
//import { getLogs } from '../utils/logger';
import { IDeviceCommand, IDeviceInformation, IDeviceState, IDeviceAPI, IProtoDevice } from '../types';
import * as types from '../types';
import { ICommandOptions } from '..';
import { resolve } from 'path';
import { rejects } from 'assert';


const {
  ColorMasks: { white, color, both },
  DeviceWriteStatus: { ready, busy, pending },
  PowerCommands: { COMMAND_POWER_OFF, COMMAND_POWER_ON },
  DefaultCommand,
  OPTIMIZATION_SETTINGS: { INTRA_MESSAGE_TIME, POWER_WAIT_TIME, STATE_RETRY_WAIT_TIME },
  CommandDefaults
} = types;

export class BaseController {
  protected transport;

  protected deviceWriteStatus;
  protected devicePowerCommand;

  protected newColorCommand: IDeviceCommand = DefaultCommand;
  protected bufferDeviceCommand: IDeviceCommand = DefaultCommand;

  protected deviceState: IDeviceState;
  protected deviceStateTemporary: IDeviceState;

  protected deviceInformation: IDeviceInformation;
  protected deviceAPI: IDeviceAPI;

  // logs = getLogs();

  //=================================================
  // Start Constructor //
  constructor(
    protected protoDevice: IProtoDevice,
  ) {
  }

  //=================================================
  // End Constructor //

  public async setOn(value: boolean, _commandOptions?: ICommandOptions) {
    const baseCommand: IDeviceCommand = { isOn: value }
    let deviceCommand: IDeviceCommand;

    if (this.deviceWriteStatus === ready) {
      this.devicePowerCommand = true;
      deviceCommand = { ...this.deviceState.LED, ...baseCommand };
      return await this.processCommand(deviceCommand, _commandOptions);
    }
  }

  public async setRed(value: number, _commandOptions?: ICommandOptions) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, RGB: { red: value }, colorMask: color }
    return await this.processCommand(deviceCommand, _commandOptions);
  }

  public async setGreen(value: number, _commandOptions?: ICommandOptions) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, RGB: { green: value }, colorMask: color }
    return await this.processCommand(deviceCommand, _commandOptions);
  }

  public async setBlue(value: number, _commandOptions?: ICommandOptions) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, RGB: { blue: value }, colorMask: color }
    return await this.processCommand(deviceCommand, _commandOptions);
  }

  public async setWarmWhite(value: number, _commandOptions?: ICommandOptions) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, CCT: { warmWhite: value }, colorMask: white }
    return await this.processCommand(deviceCommand, _commandOptions);
  }

  public async setColdWhite(value: number, _commandOptions?: ICommandOptions) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, CCT: { coldWhite: value }, colorMask: white }
    return await this.processCommand(deviceCommand, _commandOptions);
  }

  public async setAllValues(deviceCommand: IDeviceCommand, _commandOptions: ICommandOptions = CommandDefaults) {
    return await this.processCommand({isOn: true, ...deviceCommand}, _commandOptions);
  }

  private async processCommand(deviceCommand: IDeviceCommand, _commandOptions: ICommandOptions = CommandDefaults) {
    return new Promise<IDeviceState>(async (resolve) => {
      const deviceWriteStatus = this.deviceWriteStatus;
      switch (deviceWriteStatus) {
        case ready:

          this.deviceWriteStatus = pending;
          this.newColorCommand = deviceCommand;
          const commandOptions = { ...CommandDefaults, ..._commandOptions }

          await this.writeStateToDevice(this.newColorCommand, commandOptions).then((msg) => {
            // switch (logCode) {
            //   case 0x01:  //success on the first attempt

            //     break;
            //   case 0x02:  //success after retries
            //     // console.log(msg, _commandOptions.verifyRetries - retries)
            //     break;
            //   case 0x03:

            //     break;

            //   default:
            //     break;
            //}

          }).finally(() => {
            this.newColorCommand = DefaultCommand;
            this.devicePowerCommand = false;
            this.deviceWriteStatus = ready
            resolve(this.deviceState);
          });
          break;

        case pending:
          if (deviceCommand.isOn !== false)
            this.newColorCommand = Object.assign({}, this.newColorCommand, deviceCommand);
          break;

        case busy:
          if (deviceCommand.isOn !== false)
            //this.bufferDeviceCommand = Object.assign({}, this.bufferDeviceCommand, deviceCommand);
            this.bufferDeviceCommand = deviceCommand
          break;
      }

    });
  }

  private async writeStateToDevice(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<Object> {


    this.newColorCommand = Object.assign({}, this.newColorCommand, deviceCommand);

    return new Promise<Object>(async (resolve, reject) => {

      return setTimeout(async () => {
        this.deviceWriteStatus = busy;
        let sanitizedDeviceCommand = Object.assign({}, DefaultCommand, this.newColorCommand);
        sanitizedDeviceCommand.RGB = Object.assign({}, DefaultCommand.RGB, deviceCommand.RGB);
        sanitizedDeviceCommand.CCT = Object.assign({}, DefaultCommand.CCT, deviceCommand.CCT);
        //console.log('everything is probably fine', this.deviceAPI.description, this.protoDevice.uniqueId, this.deviceState.controllerHardwareVersion.toString(16), this.deviceAPI.needsPowerCommand, this.deviceState.controllerFirmwareVersion)


        await this.prepareColorCommand(sanitizedDeviceCommand, commandOptions);
        if (commandOptions.verifyRetries > 0) {
          const isValidState = await this.testValidState(sanitizedDeviceCommand, commandOptions).catch((reason) => reject(reason));
          if (isValidState) {
            this.overwriteLocalState(sanitizedDeviceCommand);
            resolve({ msg: { content: 'Successfull write: ', retriesLeft: commandOptions.verifyRetries }, logCode: 0x01 })
          } else {
            reject({ msg: { content: 'Unsuccessful write... retrying: ', retriesLeft: commandOptions.verifyRetries }, logCode: 0x02 });
          }
        } else {
          reject({ msg: { content: 'Ran out of retries: ', retriesLeft: commandOptions.verifyRetries }, logCode: 0x03 })
        }
      }, commandOptions.bufferMS);
    }).catch(async (error) => {
      if (commandOptions.verifyRetries > 0) {
        console.log('retries left:', commandOptions.verifyRetries)
        commandOptions.verifyRetries--;
        return await this.writeStateToDevice(this.newColorCommand, commandOptions);
      }
      // console.log('something failed: ', error, this.deviceAPI.description, this.protoDevice.uniqueId, this.deviceState.controllerHardwareVersion.toString(16), this.deviceAPI.needsPowerCommand, this.deviceState.controllerFirmwareVersion)

    });
  }//setColor


  private async testValidState(deviceCommand: IDeviceCommand, commandOptions?: ICommandOptions) {
    return new Promise(async (resolve, reject) =>
      setTimeout(async () => {
        return await this.fetchState(commandOptions.timeoutMS).then((deviceState) => {
          const isValid = this.stateHasSoftEquality(deviceCommand, deviceState.LED);
          if(!isValid) {
            this.overwriteLocalState(deviceState.LED);
          }
          resolve(isValid)
        }).catch(error => {
          
          reject(error);
        });
      }, STATE_RETRY_WAIT_TIME));
  }

  private stateHasSoftEquality(deviceStateA: IDeviceCommand, deviceStateB: IDeviceCommand): boolean {
    try {
      let isEqual = false;
      // console.log("DEVICE A", deviceStateA);
      // console.log("DEVICE B", deviceStateB);

      if (this.devicePowerCommand) {
        if (deviceStateA.isOn === deviceStateB.isOn) {
          isEqual = true;
        }
      } else if (_.isEqual(_.omit(deviceStateA, ['colorMask']), (_.omit(deviceStateB, ['colorMask'])))) {
        isEqual = true;
      }  else {
        
      }

      return isEqual;
    } catch (error) {
      return error
    }
  }

  private overwriteLocalState(deviceCommand: IDeviceCommand, deviceState?: IDeviceState) {
    if (this.devicePowerCommand) {
      Object.assign(this.deviceState.LED, deviceState);
    } else {
      Object.assign(this.deviceState.LED, deviceCommand);
    }
  }

  private async prepareColorCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<string> {
    //console.log(deviceCommand)

    return new Promise(async (resolve) => {
      if (this.devicePowerCommand) {
        const deviceResponse = await this.send(deviceCommand.isOn ? COMMAND_POWER_ON : COMMAND_POWER_OFF);
        resolve(deviceResponse);
      } else {
        let timeout = 0;
        if (this.deviceAPI.needsPowerCommand && !this.deviceState.LED.isOn) {
          timeout = 200;
          await this.send(COMMAND_POWER_ON);
        }
        setTimeout(async () => {
          
    
        const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite } } = deviceCommand;
        const { isEightByteProtocol } = this.deviceAPI;
        if (!commandOptions.colorMask) {
          if (this.deviceAPI.simultaneousCCT) deviceCommand.colorMask = both;
          else {
            if(Math.max(warmWhite, coldWhite) > Math.max(red, green, blue) ){
              commandOptions.colorMask = white;
            } else {
              commandOptions.colorMask = color;
            }
            
          }
        }

        let commandByteArray;
        if (isEightByteProtocol) {
          commandByteArray = [0x31, red, green, blue, warmWhite, commandOptions.colorMask, 0x0F]; //8th byte checksum calculated later in send()
        } else {
          commandByteArray = [0x31, red, green, blue, warmWhite, coldWhite, commandOptions.colorMask, 0x0F]; //9 byte
        }
        // console.log(commandByteArray)
        const deviceResponse = await this.send(commandByteArray);
        if (deviceResponse == null && this.deviceAPI.isEightByteProtocol === null) {
          console.log("CHANGING DEVICE PROTOCOL", this.deviceAPI.description, this.protoDevice.uniqueId, this.deviceState.controllerFirmwareVersion, this.deviceState.controllerHardwareVersion);
          this.deviceAPI.isEightByteProtocol = true;
          await this.prepareColorCommand(deviceCommand, commandOptions);
        }

        resolve(deviceResponse)
        //this.logs.debug('Recieved the following response', output);
      }, timeout);
      }
    });
  }

  public async fetchState(_timeout: number = 200): Promise<IDeviceState> {
    return new Promise(async (resolve, reject) => {
      return await this.queryState(_timeout).then((deviceState) => {
        resolve(deviceState);
      }).catch(reason => {
        reject(reason);
      });
    });
  }

  private async queryState(_timeout): Promise<IDeviceState> {
    return new Promise(async (resolve, reject) => {
      const { ipAddress } = this.protoDevice;
      if (typeof ipAddress !== 'string') {
        reject(`Cannot determine controller because invalid IP address. Device:' ${ipAddress}`);
      }

      let scans = 0, data: Buffer;

      while (data == null && scans < 5) {
        data = await this.transport.getState(_timeout);
        scans++;
      }
      if (data) {
        const deviceState = await parseDeviceState(data);
        this.deviceState = deviceState;
        resolve(deviceState);
      } else {
        reject('[DeviceControllers](GetState) unable to retrieve data.');
      }
    });
  }

  private async send(command, useChecksum = true, _timeout = 20) {
    const buffer = Buffer.from(command);
    const deviceResponse = await this.transport.send(buffer, useChecksum, _timeout);
    return deviceResponse;
  }

  public cacheCurrentLightState() {
    this.deviceStateTemporary = this.deviceState;
  }

  public async restoreCachedLightState(_commandOptions?: ICommandOptions) {
    this.deviceState = this.deviceStateTemporary;
    const deviceCommand: IDeviceCommand = this.deviceState.LED;
    return new Promise<IDeviceState>(async (resolve) => {
      await this.processCommand(deviceCommand, _commandOptions).then(deviceState => {
        resolve(deviceState);
      });
    });
  }

  public async initializeController(deviceAPI?: IDeviceAPI) {
    return new Promise(async (resolve, reject) => {
      this.transport = new Transport(this.protoDevice.ipAddress);
      await this.fetchState().catch(reason => {
        reject(reason);
      });
      if (!deviceAPI) {
        this.assignAPI();
      } else {
      }
      resolve('nice!')




    }).finally(() => {
      this.deviceWriteStatus = ready;
      resolve('completed device')
    }).catch(error => {
      console.log(error);
    });
  }

  private async assignAPI(): Promise<string> {
    return new Promise(async (resolve, reject) => {


      const matchingFirmwareVersions = {
        '2': { needsPowerCommand: true },
        '3': { needsPowerCommand: true, isEightByteProtocol: true },
        '4': { needsPowerCommand: true },
        '5': { needsPowerCommand: true },
        '8': { needsPowerCommand: true, isEightByteProtocol: true },
        '9': { needsPowerCommand: true, isEightByteProtocol: true },
      }

      const firmwareVersion = this.deviceState.controllerFirmwareVersion.toString(16);
      const modelNumber = this.protoDevice.modelNumber;

      let needsPowerCommand = matchingFirmwareVersions[firmwareVersion];
      if (firmwareVersion == '1' && modelNumber.includes('HF-LPB100-ZJ200')) {
        needsPowerCommand = { needsPowerCommand: true };
      }


      if (deviceTypesMap.has(this.deviceState.controllerHardwareVersion)) {
        const deviceAPI: IDeviceAPI = await deviceTypesMap.get(this.deviceState.controllerHardwareVersion);
        this.deviceAPI = { ...deviceAPI, ...needsPowerCommand };
        resolve('Device API successfully found and set.');
      } else {
        console.log('no matching API! WEIRD!: ', this.deviceState.controllerHardwareVersion)
        reject('Device API could not be found in deviceTypesMap.');
      }
    });
  }

  public getCachedDeviceInformation(): IDeviceInformation {
    return { deviceAPI: this.deviceAPI, protoDevice: this.protoDevice, deviceState: this.deviceState };
  }

  public getCachedState(): IDeviceState {
    return this.deviceState;
  }
}
