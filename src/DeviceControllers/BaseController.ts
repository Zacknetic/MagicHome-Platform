import { deviceTypesMap } from '../DeviceTypesMap';
import { clamp, parseDeviceState } from '../utils/miscUtils'
import { Animations } from '../utils/Animations';
import { _ } from 'lodash'
import { Transport } from 'magichome-core';
import { IDeviceCommand, IDeviceInformation, IDeviceState, IDeviceAPI, IProtoDevice, ICommandOptions, ICommandResponse, ILEDState } from '../types';
import * as types from '../types';
import { IAnimationLoop } from '..';
import Queue from 'queue-promise';
import { resolve } from 'path';

const FINAL_COMMAND_TIMEOUT = 100;
const QUEUE_INTERVAL = 50;

const SLOW_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 20, bufferMS: 0, timeoutMS: 2000 };
const MEDIUM_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 100 };
const FAST_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 20 };

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

  protected newDeviceCommand: IDeviceCommand = DefaultCommand;

  protected deviceState: IDeviceState;
  protected LEDStateTemporary: ILEDState;

  protected deviceInformation: IDeviceInformation;
  protected deviceAPI: IDeviceAPI;

  protected animation: Animations;
  protected queue;
  slowQueueRetry: boolean;

  //=================================================
  // Start Constructor //
  constructor(protected protoDevice: IProtoDevice) {
    _.merge(this.newDeviceCommand, DefaultCommand);
    this.animation = new Animations();
    this.setupCommandQueue();

  };
  //=================================================
  // End Constructor //

  public async setOn(value: boolean, _commandOptions?: ICommandOptions) {
    _.merge(_commandOptions, { isPowerCommand: true });
    const deviceCommand: IDeviceCommand = { isOn: value }
    return await this.prepareCommand(deviceCommand, _commandOptions);
  }

  public async setRed(value: number, _commandOptions?: ICommandOptions) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, RGB: { red: value }, colorMask: color }
    return await this.prepareCommand(deviceCommand, _commandOptions);
  }

  public async setGreen(value: number, _commandOptions?: ICommandOptions) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, RGB: { green: value }, colorMask: color }
    return await this.prepareCommand(deviceCommand, _commandOptions);
  }

  public async setBlue(value: number, _commandOptions?: ICommandOptions) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, RGB: { blue: value }, colorMask: color }
    return await this.prepareCommand(deviceCommand, _commandOptions);
  }

  public async setWarmWhite(value: number, _commandOptions?: ICommandOptions) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, CCT: { warmWhite: value }, colorMask: white }
    return await this.prepareCommand(deviceCommand, _commandOptions);
  }

  public async setColdWhite(value: number, _commandOptions?: ICommandOptions) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, CCT: { coldWhite: value }, colorMask: white }
    return await this.prepareCommand(deviceCommand, _commandOptions);
  }

  public async setAllValues(deviceCommand: IDeviceCommand, _commandOptions?: ICommandOptions) {
    return await this.prepareCommand(deviceCommand, _commandOptions);
  }

  private prepareCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions = MEDIUM_COMMAND_OPTIONS) {

    let _commandResponse
    commandOptions = _.merge({}, CommandDefaults, commandOptions, { remainingRetries: commandOptions.maxRetries })
    deviceCommand = _.merge({}, DefaultCommand, deviceCommand)
    return this.queue.enqueue(async () => {
      let _commandResponse: ICommandResponse;


      if (this.queue.size > 0) {
        this.slowQueueRetry = true;
        commandOptions = FAST_COMMAND_OPTIONS;
      }

      if (!(this.slowQueueRetry && this.queue.size < 1)) {
        this.processCommand(deviceCommand, commandOptions).then((commandResponse: ICommandResponse) => {
          _commandResponse = commandResponse;
        }).catch(eventNumber => {
          const commandResponse: ICommandResponse = { eventNumber, deviceResponse: null };
          _commandResponse = commandResponse;
        }).finally(() => {
          this.newDeviceCommand = DefaultCommand;
        })
      }
    });
  }

  private async processCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICommandResponse> {
    let latestDeviceCommand, latestCommandOptions;

    let timeout;

    this.queue.on('start', () => {
      clearTimeout(timeout);
    });

    this.queue.on('end', async () => {



      timeout = setTimeout(async () => {

        // const validState = this.testValidState(latestDeviceCommand)
        // if (!validState) {
        return this.handleDeviceResponse(deviceResponse, latestDeviceCommand, commandOptions).catch((commandResponse: ICommandResponse) => {

          if (commandResponse.eventNumber == -3) {
            commandOptions.remainingRetries--;
            return this.processCommand(deviceCommand, commandOptions);
          } else {
            return commandResponse;
          }
          // console.log('something failed: ', error, this.deviceAPI.description, this.protoDevice.uniqueId, this.deviceState.controllerHardwareVersion.toString(16), this.deviceAPI.needsPowerCommand, this.deviceState.controllerFirmwareVersion)
        });
        this.slowQueueRetry = false;
        await this.processCommand(latestDeviceCommand, SLOW_COMMAND_OPTIONS);

      }, FINAL_COMMAND_TIMEOUT);
      // }
    });

    this.queue.on('resolve', ({ commandResponse, deviceCommand, commandOptions }) => {
      const resp: ICommandResponse = commandResponse;
      latestDeviceCommand = deviceCommand;
      latestCommandOptions = commandOptions;
      return resp;
    });

    this.queue.on('reject', error => {

    });

    //console.log('everything is probably fine', this.deviceAPI.description, this.protoDevice.uniqueId, this.deviceState.controllerHardwareVersion.toString(16), this.deviceAPI.needsPowerCommand, this.deviceState.controllerFirmwareVersion)

    const deviceResponse = this.writeCommand(deviceCommand, commandOptions);

  }

  private async handleDeviceResponse(deviceResponse, deviceCommand, commandOptions) {
    return new Promise<ICommandResponse>(async (resolve, reject) => {

      if (commandOptions.remainingRetries > 0) {
        console.log(commandOptions.remainingRetries)
        const isValidState = await this.testValidState(deviceCommand, commandOptions);

        if (isValidState) {
          this.overwriteLocalState(deviceCommand);
          const commandResponse: ICommandResponse = { eventNumber: 1, deviceResponse: deviceCommand };
          resolve(commandResponse)
        } else {
          console.log("INVALID STATE")
          const commandResponse: ICommandResponse = { eventNumber: -3, deviceResponse };
          reject(commandResponse);
        }
      } else if (commandOptions.maxRetries > 0) {
        const commandResponse: ICommandResponse = { eventNumber: -4, deviceResponse };
        reject(commandResponse);
      } else {
        const commandResponse: ICommandResponse = { eventNumber: -5, deviceResponse };
        reject(commandResponse);
      }
    })
  }

  private async testValidState(deviceCommand: IDeviceCommand, commandOptions?: ICommandOptions) {
    return new Promise<boolean>(async (resolve, reject) => {

      setTimeout(async () => {
        const deviceState = await this.fetchState(commandOptions.timeoutMS);
        const isValidState = this.compareStates(deviceCommand, deviceState.LEDState, commandOptions);
        this.overwriteLocalState(deviceState.LEDState);

        resolve(isValidState);
      }, STATE_RETRY_WAIT_TIME);
    })
  }

  private compareStates(LEDStateA: ILEDState, LEDStateB: ILEDState, commandOptions: ICommandOptions): boolean {
    try {
      let isEqual = false;
      // console.log("LED STATE A", LEDStateA)
      // console.log("LED STATE b", LEDStateB)

      if (commandOptions.isPowerCommand) {
        if (LEDStateA.isOn === LEDStateB.isOn) {
          isEqual = true;
        }
      } else if (_.isEqual(_.omit(LEDStateA, ['colorMask']), (_.omit(LEDStateB, ['colorMask'])))) {
        isEqual = true;
      }
      // console.log('IS EQUAL:', isEqual)
      return isEqual;
    } catch (error) {

      return error
    }
  }

  private overwriteLocalState(deviceCommand: IDeviceCommand, LEDState?: ILEDState) {
    if (LEDState) {
      _.merge(this.deviceState.LEDState, LEDState);
    } else {
      _.merge(this.deviceState.LEDState, deviceCommand);
    }
  }

  private async writeCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {

    if (commandOptions.isPowerCommand) {
      this.cyclePower(deviceCommand, commandOptions)
    } else {
      let timeout = 0;
      if (this.deviceAPI.needsPowerCommand && !this.deviceState.LEDState.isOn) {
        timeout = 50;
        await this.send(COMMAND_POWER_ON);
      }

      setTimeout(() => {

        const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite } } = deviceCommand;
        const { isEightByteProtocol } = this.deviceAPI;

        if (!commandOptions.colorMask) {
          if (this.deviceAPI.simultaneousCCT) deviceCommand.colorMask = both;
          else {
            if (Math.max(warmWhite, coldWhite) > Math.max(red, green, blue)) {
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

        let deviceResponse = this.send(commandByteArray);
        if (deviceResponse == null && this.deviceAPI.isEightByteProtocol === null) {
          //console.log("CHANGING DEVICE PROTOCOL", this.deviceAPI.description, this.protoDevice.uniqueId, this.deviceState.controllerFirmwareVersion, this.deviceState.controllerHardwareVersion);
          this.deviceAPI.isEightByteProtocol = true;
          return this.writeCommand(deviceCommand, commandOptions).catch(error => {
            //console.log(error);
          });

        }

        return { deviceCommand, deviceResponse }
      }, timeout);
    }

  }

  private async cyclePower(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {
    // if (commandOptions.remainingRetries == 1) {

    //   if (!deviceCommand.isOn && this.deviceState.LEDState.isOn) {
    //     await this.send(COMMAND_POWER_ON);
    //     await this.send(COMMAND_POWER_OFF);
    //   }
    // }
    const deviceResponse = await this.send(deviceCommand.isOn ? COMMAND_POWER_ON : COMMAND_POWER_OFF);
    return ({ deviceCommand, deviceResponse });
  }


  public async fetchState(_timeout: number = 200): Promise<IDeviceState> {
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
      }
      // else {
      //   reject('[DeviceControllers](GetState) unable to retrieve data.');
      // }
    })
  }

  private async send(command, useChecksum = true, _timeout = 20) {
    const buffer = Buffer.from(command);
    const deviceResponse = await this.transport.send(buffer, useChecksum, _timeout);
    return deviceResponse;
  }

  public cacheCurrentLightState() {
    this.LEDStateTemporary = this.deviceState.LEDState;
  }

  public async restoreCachedLightState(_commandOptions?: ICommandOptions) {
    this.deviceState.LEDState = this.LEDStateTemporary;
    const deviceCommand: IDeviceCommand = this.deviceState.LEDState;
    //return await this.processCommand(deviceCommand, _commandOptions)
  }

  public async initializeController(deviceAPI?: IDeviceAPI, deviceState?: IDeviceState) {

    return new Promise(async (resolve, reject) => {
      this.transport = new Transport(this.protoDevice.ipAddress);
      if (deviceState) {
        this.deviceState = deviceState;
      }
      if (deviceAPI) {
        this.deviceAPI = deviceAPI;
        resolve('nice!')
      } else {
        await this.fetchState(1000).catch(reason => {
          reject(reason);
        });
        if (!deviceAPI) {
          this.assignAPI();
        }
        resolve('nice!')
      }
    }).catch(error => {
      console.log(error);
    });

  }

  private async assignAPI(): Promise<string> {
    return new Promise(async (resolve, reject) => {

      const matchingFirmwareVersions = {
        '1': { needsPowerCommand: false },
        '2': { needsPowerCommand: true },
        '3': { needsPowerCommand: true, isEightByteProtocol: true },
        '4': { needsPowerCommand: true },
        '5': { needsPowerCommand: true },
        '8': { needsPowerCommand: true, isEightByteProtocol: true },
        '9': { needsPowerCommand: false, isEightByteProtocol: true },
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

  private setupCommandQueue() {

    this.queue = new Queue({
      concurrent: 1,
      interval: QUEUE_INTERVAL,
      start: false
    });

  }

  public getCachedDeviceInformation(): IDeviceInformation {
    return { deviceAPI: this.deviceAPI, protoDevice: this.protoDevice, deviceState: this.deviceState };
  }

  public async animateIndividual(animation: IAnimationLoop) {
    console.log('starting animation')

    await this.animation.animateIndividual(this, animation);
  }

  public clearAnimations() {
    this.animation.clearAnimations();
  }

}
