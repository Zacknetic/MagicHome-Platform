
import { lightTypesMap as deviceTypesMap } from '../LightMap';
import { clamp, parseDeviceState } from '../utils/miscUtils'
import { _ } from 'lodash'
import { Transport } from 'magichome-core';
//import { getLogs } from '../utils/logger';
import * as types from '../types';

const {
  ColorMasks: { white, color, both },
  DeviceWriteStatus: { ready, busy, pending },
  PowerCommands: { COMMAND_POWER_OFF, COMMAND_POWER_ON },
  DefaultCommand,
  OPTIMIZATION_SETTINGS: { INTRA_MESSAGE_TIME, POWER_WAIT_TIME, STATE_RETRY_WAIT_TIME }
} = types;

export class BaseController {
  protected transport;

  protected deviceWriteStatus;
  protected devicePowerCommand;

  protected newColorCommand: types.IDeviceCommand = DefaultCommand;
  protected bufferDeviceCommand: types.IDeviceCommand = DefaultCommand;


  protected deviceStateTemporary: types.IDeviceState;
  protected deviceState: types.IDeviceState;

  protected deviceInformation: types.IDeviceInformation;
  protected deviceAPI: types.IDeviceAPI;

  // logs = getLogs();

  //=================================================
  // Start Constructor //
  constructor(
    protected protoDevice: types.IProtoDevice,
  ) { }

  //=================================================
  // End Constructor //

  public async setOn(value: boolean, verifyState = true) {
    const baseCommand: types.IDeviceCommand = { isOn: value }
    let deviceCommand: types.IDeviceCommand;

    if (this.deviceWriteStatus === ready) {
      this.devicePowerCommand = true;
      deviceCommand = { ...this.deviceState.LED, ...baseCommand }
      return new Promise<string>(async (resolve, reject) => {

        return new Promise<types.IDeviceState>(async (resolve) => {
          await this.processCommand(deviceCommand, verifyState).then(deviceState => {
            resolve(deviceState)
          })
        });
      });
    }
  }

  public async setRed(value: number, verifyState = true) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { isOn: true, RGB: { red: value }, colorMask: color }
    return await this.prepareCommand(deviceCommand, verifyState);
  }

  public async setGreen(value: number, verifyState = true) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { isOn: true, RGB: { green: value }, colorMask: color }
    return await this.prepareCommand(deviceCommand, verifyState);
  }

  public async setBlue(value: number, verifyState = true) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { isOn: true, RGB: { blue: value }, colorMask: color }
    return await this.prepareCommand(deviceCommand, verifyState);
  }

  public async setWarmWhite(value: number, verifyState = true) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { isOn: true, CCT: { warmWhite: value }, colorMask: white }
    return await this.prepareCommand(deviceCommand, verifyState);
  }

  public async setColdWhite(value: number, verifyState = true) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { isOn: true, CCT: { coldWhite: value }, colorMask: white }
    return await this.prepareCommand(deviceCommand, verifyState);
  }

  public async setAllValues(deviceCommand: types.IDeviceCommand, verifyState = true) {
    return await this.prepareCommand(deviceCommand, verifyState)
  }

  private async prepareCommand(deviceCommand: types.IDeviceCommand, verifyState = true): Promise<types.IDeviceState> {
    return new Promise<types.IDeviceState>(async (resolve) => {
      await this.processCommand(deviceCommand, verifyState).then(deviceState => {
        resolve(deviceState)
      })
    });
  }

  private async processCommand(deviceCommand: types.IDeviceCommand, verifyState = true) {

    return new Promise<types.IDeviceState>(async (resolve, reject) => {
      const deviceWriteStatus = this.deviceWriteStatus


      switch (deviceWriteStatus) {
        case ready:

          this.deviceWriteStatus = pending;
          this.newColorCommand = deviceCommand;
          await this.writeStateToDevice(this.newColorCommand, verifyState).then((param) => {
            // console.log(param)
            this.newColorCommand = DefaultCommand;
            this.devicePowerCommand = false;
            this.deviceWriteStatus = ready
            resolve(this.deviceState);
          }).catch((error) => {
            //console.log('something failed: ', error)
            this.newColorCommand = DefaultCommand;
            this.bufferDeviceCommand = DefaultCommand;
            this.devicePowerCommand = false;
            this.deviceWriteStatus = ready
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


  private async writeStateToDevice(deviceCommand: types.IDeviceCommand, verifyState = true, count = 0): Promise<string> {
    let timeout = 0;
    if (count > 5) {
      return 'could not verify state'
    }

    return new Promise<string>(async (resolve, reject) => {

      setTimeout(async () => {

        this.deviceWriteStatus = busy;
        let sanitizedDeviceCommand = Object.assign({}, DefaultCommand, deviceCommand);
        sanitizedDeviceCommand.RGB = Object.assign({}, DefaultCommand.RGB, deviceCommand.RGB);

        //console.log(sanitizedDeviceCommand);
        if (this.deviceAPI.needsPowerCommand && !this.deviceState.LED.isOn) {
          timeout = POWER_WAIT_TIME;
          this.send(COMMAND_POWER_ON);
        }

        setTimeout(async () => {
          await this.prepareColorCommand(sanitizedDeviceCommand).then(async () => {
            if (this.bufferDeviceCommand !== DefaultCommand) {
              const tempBufferDeviceCommand = _.cloneDeep(this.bufferDeviceCommand)
              this.bufferDeviceCommand = DefaultCommand
              await this.writeStateToDevice(tempBufferDeviceCommand);
              resolve('Discontinuing write validity as command buffer contains data.')
            } else {

              if (verifyState) {

                this.testValidState(sanitizedDeviceCommand).then(async ({ isValid, deviceState }) => {

                  if (isValid) {
                    this.overwriteLocalState(sanitizedDeviceCommand, deviceState);
                    resolve('State Successfully Written')
                  } else {
                    resolve(await this.writeStateToDevice(sanitizedDeviceCommand, verifyState, count + 1))
                  }
                })
              } else {
                this.overwriteLocalState(sanitizedDeviceCommand);
                resolve('State Successfully Written')
              }
            }
          });
        }, INTRA_MESSAGE_TIME);
      }, timeout);
    });

  }//setColor


  private async testValidState(deviceCommand: types.IDeviceCommand): Promise<{ isValid, deviceState }> {
    return new Promise(async (resolve, reject) => {

      setTimeout(async () => {
        await this.fetchState().then((deviceState) => {


          const isValid = this.stateHasSoftEquality(deviceCommand, deviceState.LED);
          resolve({ isValid, deviceState })
        });
      }, STATE_RETRY_WAIT_TIME);
    });
  }

  private stateHasSoftEquality(deviceStateA: types.IDeviceCommand, deviceStateB: types.IDeviceCommand): boolean {
    try {
      let isEqual = false;
      // console.log("DEVICE A", deviceStateA);
      // console.log("DEVICE B", deviceStateB)

      if (!this.devicePowerCommand && deviceStateA.isOn !== deviceStateB.isOn) {
        this.devicePowerCommand = true;
      }

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

  private overwriteLocalState(deviceCommand: types.IDeviceCommand, deviceState?: types.IDeviceState) {
    if (this.devicePowerCommand) {
      Object.assign(this.deviceState.LED, deviceState);
    } else {
      Object.assign(this.deviceState.LED, deviceCommand);
    }
  }

  private async prepareColorCommand(deviceCommand: types.IDeviceCommand): Promise<string> {
    //console.log(deviceCommand)

    return new Promise(async (resolve, reject) => {
      if (this.devicePowerCommand) {
        const deviceResponse = this.send(deviceCommand.isOn ? COMMAND_POWER_ON : COMMAND_POWER_OFF);
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

  public async fetchState(): Promise<types.IDeviceState> {
    return new Promise(async (resolve, reject) => {
      await this.queryState().then((deviceState) => {
        resolve(deviceState);
      }).catch(reason => {
        reject(reason);
      });
    });
  }

  private async queryState(_timeout: number = 500): Promise<types.IDeviceState> {
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
    const deviceCommand: types.IDeviceCommand = this.deviceState.LED;
    return new Promise<types.IDeviceState>(async (resolve) => {
      await this.processCommand(deviceCommand, verifyState).then(deviceState => {
        resolve(deviceState)
      })
    });
  }



  private async assignAPI(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (deviceTypesMap.has(this.deviceState.controllerHardwareVersion)) {
        const deviceAPI: types.IDeviceAPI = deviceTypesMap.get(this.deviceState.controllerHardwareVersion);
        this.deviceAPI = deviceAPI;
        resolve('Device API successfully found and set.');
      } else {
        reject('Device API could not be found in deviceTypesMap.');
      }
    });
  }

  public async reInitializeController(deviceAPI?: types.IDeviceAPI) {
    return new Promise((resolve) => {
      this.transport = new Transport(this.protoDevice.ipAddress);
      resolve(this.fetchState());
    }).then(() => {
      return new Promise((resolve) => {
        if (deviceAPI) {
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

  public getCachedDeviceInformation(): types.IDeviceInformation {
    return { deviceAPI: this.deviceAPI, protoDevice: this.protoDevice, deviceState: this.deviceState };
  }
  public getCachedState(): types.IDeviceState {
    return this.deviceState;
  }
}
