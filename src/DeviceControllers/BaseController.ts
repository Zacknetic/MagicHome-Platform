import { lightTypesMap as deviceTypesMap } from '../LightMap';
import { clamp, parseDeviceState } from '../utils/miscUtils'
import { _ } from 'lodash'
import { Transport } from 'magichome-core';
//import { getLogs } from '../utils/logger';
import {IDeviceCommand, IDeviceInformation, IDeviceState, IDeviceAPI, IProtoDevice} from '../types';
import * as types from '../types';

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

  protected retryCount;
  protected deviceInformation: IDeviceInformation;
  protected deviceAPI: IDeviceAPI;

  // logs = getLogs();

  //=================================================
  // Start Constructor //
  constructor(
    protected protoDevice: IProtoDevice,
  ) {
    this.retryCount = 0;
  }

  //=================================================
  // End Constructor //

  public async setOn(value: boolean, verifyState = true) {
    const baseCommand: IDeviceCommand = { isOn: value }
    let deviceCommand: IDeviceCommand;

    if (this.deviceWriteStatus === ready) {
      this.devicePowerCommand = true;
      deviceCommand = { ...this.deviceState.LED, ...baseCommand };
      await this.processCommand(deviceCommand, verifyState)
    }
  }

  public async setRed(value: number, verifyState = true) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, RGB: { red: value }, colorMask: color }
    return await this.prepareCommand(deviceCommand, verifyState);
  }

  public async setGreen(value: number, verifyState = true) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, RGB: { green: value }, colorMask: color }
    return await this.prepareCommand(deviceCommand, verifyState);
  }

  public async setBlue(value: number, verifyState = true) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, RGB: { blue: value }, colorMask: color }
    return await this.prepareCommand(deviceCommand, verifyState);
  }

  public async setWarmWhite(value: number, verifyState = true) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, CCT: { warmWhite: value }, colorMask: white }
    return await this.prepareCommand(deviceCommand, verifyState);
  }

  public async setColdWhite(value: number, verifyState = true) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: IDeviceCommand = { isOn: true, CCT: { coldWhite: value }, colorMask: white }
    return await this.prepareCommand(deviceCommand, verifyState);
  }

  public async setAllValues(deviceCommand: IDeviceCommand, verifyState = true) {
    return await this.prepareCommand(deviceCommand, verifyState)
  }

  private async prepareCommand(deviceCommand: IDeviceCommand, verifyState = true): Promise<IDeviceState> {
    console.log(this.deviceWriteStatus)
    return new Promise<IDeviceState>(async (resolve) => {
      await this.processCommand(deviceCommand, verifyState).then(deviceState => {
        resolve(deviceState)
      })
    });
  }

  private async processCommand(deviceCommand: IDeviceCommand, _commandOptions: IDeviceCommand = CommandDefaults) {
		const commandOptions = {..._commandOptions, ...CommandDefaults}
    return new Promise<IDeviceState>(async (resolve) => {
      const deviceWriteStatus = this.deviceWriteStatus;
			
      switch (deviceWriteStatus) {
        case ready:

				/*
					1. if ready send as normal
						a. change to pending
						b. send message
							i. test message 
								1. if valid, return
								2. if invaid throw error
						c. resolve
							i. move to next item on buffer
							ii. reset all send state
							iii. return state to ready
						d. reject
							i. if there is a buffer ready send message with new buffer
							ii. else if current message has retries left, retry (keep retries in message, good idea)
					2. if pending, modify command
					3. if busy, overwrite any new command / merge (IDEA: option for stream of buffers (buffer stream? I didn't make that up did I) )
				*/

          this.deviceWriteStatus = pending;
          this.newColorCommand = deviceCommand;
          let sanitizedDeviceCommand = Object.assign({}, DefaultCommand, deviceCommand);
          sanitizedDeviceCommand.RGB = Object.assign({}, DefaultCommand.RGB, deviceCommand.RGB);
          sanitizedDeviceCommand.CCT = Object.assign({}, DefaultCommand.CCT, deviceCommand.CCT);


          // await this.writeStateToDevice(this.newColorCommand, verifyState).finally(() => {
          //   // console.log(param)
          //   this.newColorCommand = DefaultCommand;
          //   this.devicePowerCommand = false;
          //   this.deviceWriteStatus = ready
          //   resolve(this.deviceState);
          // }).catch((error) => {
          //   console.log('something failed: ', error)
          // });
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


  private async writeStateToDevice(sanitizedDeviceCommand: IDeviceCommand, verifyState = true) {

    return
    // return new Promise(async (resolve, reject) => {

    //   this.deviceWriteStatus = busy;


    //   setTimeout(resolve, INTRA_MESSAGE_TIME, async () => {
    //     await this.prepareColorCommand(sanitizedDeviceCommand).then(async () => {
    //       if (this.bufferDeviceCommand !== DefaultCommand) {
    //         const tempBufferDeviceCommand = _.cloneDeep(this.bufferDeviceCommand)
    //         this.bufferDeviceCommand = DefaultCommand
    //         await this.writeStateToDevice(tempBufferDeviceCommand);
    //         //reject('Discontinuing write validity as command buffer contains data.')
    //       }
    //       this.overwriteLocalState(sanitizedDeviceCommand);
    //       // resolve('State Successfully Written')


    //     });
    //   });

    //   //reject(sanitizedDeviceCommand)
    // });
  }//setColor


  private async testValidState(deviceCommand: IDeviceCommand): Promise<{ isValid, deviceState }> {
    return new Promise(async (resolve, reject) => {

      setTimeout(async () => {
        await this.fetchState().then((deviceState) => {


          const isValid = this.stateHasSoftEquality(deviceCommand, deviceState.LED);
          resolve({ isValid, deviceState })
        });
      }, STATE_RETRY_WAIT_TIME);
    });
  }

  private stateHasSoftEquality(deviceStateA: IDeviceCommand, deviceStateB: IDeviceCommand): boolean {
    try {
      let isEqual = false;
      // console.log("DEVICE A", deviceStateA);
      // console.log("DEVICE B", deviceStateB)

      if (this.devicePowerCommand) {
        if (deviceStateA.isOn === deviceStateB.isOn) {
          isEqual = true;
        }
      } else if (_.isEqual(_.omit(deviceStateA, ['colorMask']), (_.omit(deviceStateB, ['colorMask'])))) {
        isEqual = true;
      }

      return isEqual;
    } catch (error) {
      //this.logs.error('getState() error: ', error);
    }
  }

  private overwriteLocalState(deviceCommand: IDeviceCommand, deviceState?: IDeviceState) {
    if (this.devicePowerCommand) {
      Object.assign(this.deviceState.LED, deviceState);
    } else {
      Object.assign(this.deviceState.LED, deviceCommand);
    }
  }

  private async prepareColorCommand(deviceCommand: IDeviceCommand): Promise<string> {
    //console.log(deviceCommand)

    return new Promise(async (resolve) => {
      if (this.devicePowerCommand) {
        const deviceResponse = await this.send(deviceCommand.isOn ? COMMAND_POWER_ON : COMMAND_POWER_OFF);
        resolve(deviceResponse);
      } else {

        const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite }, colorMask } = deviceCommand;
        const { isEightByteProtocol } = this.deviceAPI;
        if (!deviceCommand.colorMask) {
          if (this.deviceAPI.simultaneousCCT) deviceCommand.colorMask = both
          else deviceCommand.colorMask = color;
        }

        let commandByteArray;
        if (isEightByteProtocol) {
          commandByteArray = [0x31, red, green, blue, 0x00, colorMask, 0x0F]; //8th byte checksum calculated later in send()
        } else {
          commandByteArray = [0x31, red, green, blue, warmWhite, coldWhite, colorMask, 0x0F]; //9 byte
        }
        // console.log(commandByteArray)
        const deviceResponse = await this.send(commandByteArray);
        if (deviceResponse == null && this.deviceAPI.isEightByteProtocol === null) {
          console.log("CHANGING DEVICE PROTOCOL", this.deviceAPI.description);
          this.deviceAPI.isEightByteProtocol = true;
          await this.prepareColorCommand(deviceCommand);
        }

        resolve(deviceResponse)
        //this.logs.debug('Recieved the following response', output);
      }
    });
  }

  public async fetchState(): Promise<IDeviceState> {
    return new Promise(async (resolve, reject) => {
      await this.queryState().then((deviceState) => {
        resolve(deviceState);
      }).catch(reason => {
        reject(reason);
      });
    });
  }

  private async queryState(_timeout: number = 1000): Promise<IDeviceState> {
    return new Promise(async (resolve, reject) => {
      const { ipAddress } = this.protoDevice;
      if (typeof ipAddress !== 'string') {
        reject(`Cannot determine controller because invalid IP address. Device:' ${ipAddress}`);
      }
      try {
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
      } catch (error) {
        reject(`[DeviceControllers](GetState) failed:', ${error}`);
      }
    });
  }

  private async send(command, useChecksum = true, _timeout = 50) {
    const buffer = Buffer.from(command);
    const deviceResponse = await this.transport.send(buffer, useChecksum, _timeout);
    return deviceResponse;
  }

  public cacheCurrentLightState() {
    this.deviceStateTemporary = this.deviceState;
  }

  public async restoreCachedLightState(verifyState = true) {
    this.deviceState = this.deviceStateTemporary;
    const deviceCommand: IDeviceCommand = this.deviceState.LED;
    return new Promise<IDeviceState>(async (resolve) => {
      await this.processCommand(deviceCommand, verifyState).then(deviceState => {
        resolve(deviceState)
      })
    });
  }



  private async assignAPI(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (deviceTypesMap.has(this.deviceState.controllerHardwareVersion)) {
        const deviceAPI: IDeviceAPI = deviceTypesMap.get(this.deviceState.controllerHardwareVersion);
        this.deviceAPI = deviceAPI;
        resolve('Device API successfully found and set.');
      } else {
        reject('Device API could not be found in deviceTypesMap.');
      }
    });
  }

  public async reInitializeController(deviceAPI?: IDeviceAPI) {
    return new Promise((resolve) => {
      this.transport = new Transport(this.protoDevice.ipAddress);
      resolve(this.fetchState());
    }).then(() => {
      return new Promise((resolve) => {
        if (!deviceAPI) {
          resolve(this.assignAPI());
        } else {
          resolve(this.deviceAPI)
        }
      })
    }).then(() => {
      return new Promise((resolve) => {
        this.needsPowerComand();
        this.deviceWriteStatus = ready;
        resolve('Successfully determined if device needs power command');

      })
    }).catch(error => {
      console.log(error);
    });
  }

  private needsPowerComand() {
    const matchingFirmwareVersions = [2, 3, 4, 5, 8]
    const firmwareVersion = this.deviceState.controllerFirmwareVersion;
    const modelNumber = this.protoDevice.modelNumber;

    let needsPowerCommand = false;

    if (matchingFirmwareVersions[firmwareVersion] || (firmwareVersion == 1 && modelNumber.includes('HF-LPB100-ZJ200'))) needsPowerCommand = true;
    // console.log('powerCommand set', this.deviceAPI )
    // console.log('powerCommand set', this.deviceState )

    this.deviceAPI.needsPowerCommand = needsPowerCommand;
  }

  public getCachedDeviceInformation(): IDeviceInformation {
    return { deviceAPI: this.deviceAPI, protoDevice: this.protoDevice, deviceState: this.deviceState };
  }
  public getCachedState(): IDeviceState {
    return this.deviceState;
  }
}
