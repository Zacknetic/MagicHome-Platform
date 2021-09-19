
import { convertCCTValueToDualWhite } from '../utils/colorConversions';
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

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class BaseController {
  protected transport;

  protected deviceWriteStatus;
  protected devicePowerCommand;

  protected newColorCommand: types.IDeviceCommand = DefaultCommand;
  protected bufferDeviceCommand: types.IDeviceCommand = DefaultCommand;


  protected deviceStateTemporary: types.IDeviceState;
  protected deviceState: types.IDeviceState;
  protected readonly deviceInformation: types.IDeviceInformation;

  // logs = getLogs();

  //=================================================
  // Start Constructor //
  constructor(
    protected protoDevice: types.IProtoDevice,
    protected deviceAPI?: types.IDeviceAPI,
  ) {}

  //=================================================
  // End Constructor //

  public async setOn(value: boolean) {
    const baseCommand: types.IDeviceCommand = { isOn: value }
    let deviceCommand: types.IDeviceCommand;

    if (this.deviceWriteStatus === ready) {
      this.devicePowerCommand = true;
      deviceCommand = { ...this.deviceState.LED, ...baseCommand }
      await this.processCommand(deviceCommand);
    }
  }

  public async setRed(value: number) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { isOn: true, RGB: { red: value } }
    await this.processCommand(deviceCommand);
  }

  public async setGreen(value: number) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { isOn: true, RGB: { green: value } }
    this.processCommand(deviceCommand);
  }

  public async setBlue(value: number) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { isOn: true, RGB: { blue: value } }
    this.processCommand(deviceCommand);
  }

  public async setWarmWhite(value: number) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { isOn: true, CCT: { warmWhite: value } }
    this.processCommand(deviceCommand);
  }

  public async setColdWhite(value: number) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { isOn: true, CCT: { coldWhite: value } }
    await this.processCommand(deviceCommand);
  }

  public async setAllValues(deviceCommand: types.IDeviceCommand, verifyState = true) {
    await this.processCommand(deviceCommand, verifyState);
  }

  private async processCommand(deviceCommand: types.IDeviceCommand, verifyState = true) {
    const deviceWriteStatus = this.deviceWriteStatus

    try {

      switch (deviceWriteStatus) {
        case ready:

          this.deviceWriteStatus = pending;
          this.newColorCommand = deviceCommand;
          await this.writeStateToDevice(this.newColorCommand, verifyState).then((param) => {
            this.newColorCommand = DefaultCommand;
            this.devicePowerCommand = false;
            this.deviceWriteStatus = ready
          }).catch((error) => {
            console.log('something failed: ', error)
            this.newColorCommand = DefaultCommand;
            this.bufferDeviceCommand = DefaultCommand;
            this.devicePowerCommand = false;
            this.deviceWriteStatus = ready
          });
          break;
        case pending:
          if (deviceCommand.isOn !== false)
            this.newColorCommand = _.merge(this.newColorCommand, deviceCommand)
          break;
        case busy:
          if (deviceCommand.isOn !== false)
            this.bufferDeviceCommand = _.merge(this.bufferDeviceCommand, deviceCommand)
          break;
      }
    } catch (error) {

    }
  }


  private async writeStateToDevice(deviceCommand: types.IDeviceCommand, verifyState = true, count = 0): Promise<string> {
    let timeout = 0;
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {

        this.deviceWriteStatus = busy;

        const sanitizedDeviceCommand = _.merge(DefaultCommand, deviceCommand);
        if (this.deviceAPI.needsPowerCommand && sanitizedDeviceCommand.isOn) {
          timeout = POWER_WAIT_TIME;
          this.send(COMMAND_POWER_ON);
        }
        if (count > 4) return;

        if (verifyState) {
          setTimeout(async () => {
            await this.prepareColorCommand(sanitizedDeviceCommand).then(async () => {
              if (this.bufferDeviceCommand !== DefaultCommand) {
                const tempBufferDeviceCommand = _.cloneDeep(this.bufferDeviceCommand)
                this.bufferDeviceCommand = DefaultCommand
                await this.writeStateToDevice(tempBufferDeviceCommand);
                resolve('Discontinuing write validity as command buffer contains data.')
              } else {

                this.testValidState(sanitizedDeviceCommand).then(async ({ isValid, deviceState }) => {
                  if (!isValid) {
                    await this.writeStateToDevice(sanitizedDeviceCommand, verifyState, count + 1);
                  } else {
                    this.overwriteLocalState(sanitizedDeviceCommand, deviceState);
                    resolve('State Successfully Written')
                  }
                });
              }

            })
          }, INTRA_MESSAGE_TIME);
        }

      }, timeout);
    });

  }//setColor


  private async testValidState(deviceCommand: types.IDeviceCommand): Promise<{ isValid, deviceState }> {
    return new Promise(async (resolve, reject) => {

      setTimeout(async () => {
        await this.fetchState().then((deviceState) => {


          const isValid = this.stateHasSoftEquality(deviceCommand, deviceState.LED);
          resolve({ isValid, deviceState });
        });
      }, STATE_RETRY_WAIT_TIME);
    });
  }

  private stateHasSoftEquality(deviceStateA: types.IDeviceCommand, deviceStateB: types.IDeviceCommand): boolean {
    try {
      let isEqual = false;
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

  private overwriteLocalState(deviceCommand: types.IDeviceCommand, deviceState: types.IDeviceState) {
    if (this.devicePowerCommand) {
      Object.assign(this.deviceState.LED, deviceState);
    } else {
      Object.assign(this.deviceState.LED, deviceCommand);
    }
  }

  async prepareColorCommand(deviceCommand: types.IDeviceCommand): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (this.devicePowerCommand) {
        const deviceResponse = this.send(deviceCommand.isOn ? COMMAND_POWER_ON : COMMAND_POWER_OFF);
        resolve(deviceResponse);
      } else {

        const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite }, colorMask } = deviceCommand;
        const { isEightByteProtocol } = this.deviceAPI;

        let command;
        if (isEightByteProtocol) {
          command = [0x31, red, green, blue, 0x00, colorMask, 0x0F]; //8th byte checksum calculated later in send()
        } else {
          command = [0x31, red, green, blue, warmWhite, coldWhite, colorMask, 0x0F]; //9 byte
        }

        const deviceResponse = this.send(command);

        if (deviceResponse == undefined && this.deviceAPI.isEightByteProtocol === null) {
          this.deviceAPI.isEightByteProtocol = true;
          await this.prepareColorCommand(deviceCommand);
        }

        resolve(deviceResponse)
        //this.logs.debug('Recieved the following response', output);
      }
    });
  } 

  async send(command, useChecksum = true, _timeout = 50) {
    const buffer = Buffer.from(command);
    const deviceResponse = await this.transport.send(buffer, useChecksum, _timeout);
    return deviceResponse;
  }

  cacheCurrentLightState() {
    this.deviceStateTemporary = this.deviceState;
  }

  async restoreCachedLightState() {
    this.deviceState = this.deviceStateTemporary;
    //this.processCommand(both);
  }

  //=================================================
  // End Misc Tools //

  private needsPowerComand(): boolean {
    const matchingFirmwareVersions = [2, 3, 4, 5, 8]
    const firmwareVersion = this.deviceState.controllerFirmwareVersion;
    const modelNumber = this.protoDevice.modelNumber;

    let needsPowerCommand = false;

    if (matchingFirmwareVersions[firmwareVersion] || (firmwareVersion == 1 && modelNumber.includes('HF-LPB100-ZJ200'))) needsPowerCommand = true;

    return needsPowerCommand;
  }

  private async fetchState(): Promise<types.IDeviceState> {
    return new Promise(async (resolve, reject) => {
      await this.queryState().then(() => {
        resolve(this.deviceState);
      }).catch(reason => {
        reject(reason);
      });
    });
  }

  private async queryState(_timeout: number = 500): Promise<string> {
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
          resolve('[DeviceControllers](GetState) Successfully retrieved state.');
        } else {
          reject('[DeviceControllers](GetState) unable to retrieve data.');
        }
      } catch (error) {
        reject(`[DeviceControllers](GetState) failed:', ${error}`);
      }
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

  public async initializeController() {
    return new Promise((resolve) => {
      this.transport = new Transport(this.protoDevice.ipAddress);
      resolve(this.fetchState());
    }).then(() => {
      return new Promise((resolve) => {
        if (!this.deviceAPI) {
          resolve(this.assignAPI());
        } else {
          resolve('Device API already provided')
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

  public getDeviceInformation() {
    return this.deviceInformation;
  }

}
