
import { convertCCTValueToDualWhite } from '../utils/colorConversions';
import { clamp, parseDeviceState } from '../utils/miscUtils'
import { _ } from 'lodash'
import { Transport } from 'magichome-core';
//import { getLogs } from '../utils/logger';
import * as types from '../types';

const OPTIMIZATION_SETTINGS = {
  INTRA_MESSAGE_TIME: 20,
  POWER_WAIT_TIME: 50,
  STATE_RETRY_WAIT_TIME: 350,
}


const { white, color, both }: types.ColorMasks = {
  white: 0x0F,
  color: 0xF0,
  both: 0xFF,
}

const { ready, busy, pending }: types.IDeviceWriteStatus = {
  ready: 'ready',
  busy: 'busy',
  pending: 'pending',
}

const COMMAND_POWER_ON = [0x71, 0x23, 0x0f];
const COMMAND_POWER_OFF = [0x71, 0x24, 0x0f];


/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class BaseController {

  protected transport;

  //protected interval;

  protected deviceWriteStatus;
  protected newColorCommand: types.IDeviceCommand = null;
  protected bufferDeviceCommand: types.IDeviceCommand = null;


  protected deviceState: types.IDeviceState;
  protected lightStateTemporary: types.IDeviceState
  // logs = getLogs();

  //=================================================
  // Start Constructor //
  constructor(
    protected readonly activeDevice: types.IDeviceProps,
  ) {
    this.transport = new Transport(activeDevice.cachedIPAddress);
    this.deviceState = activeDevice.lastKnownState;
    this.lightStateTemporary = activeDevice.lightStateTemporary
    this.deviceWriteStatus = ready;
  }

  //=================================================
  // End Constructor //

  setOn(value: boolean) {
    const deviceCommand: types.IDeviceCommand = { isOn: value }
    this.processCommand(deviceCommand);
  }

  async setRed(value: number) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { isOn: true, RGB: { red: value } }
    await this.processCommand(deviceCommand);
  }

  setGreen(value: number) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { isOn: true, RGB: { green: value } }
    this.processCommand(deviceCommand);
  }

  setBlue(value: number) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { isOn: true, RGB: { blue: value } }
    this.processCommand(deviceCommand);
  }

  setWarmWhite(value: number) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { CCT: { warmWhite: value } }
    this.processCommand(deviceCommand);
  }

  async setColdWhite(value: number) {
    value = Math.round(clamp(value, 0, 255));
    const deviceCommand: types.IDeviceCommand = { CCT: { coldWhite: value } }
    await this.processCommand(deviceCommand);
  }

  async setAllValues(deviceCommand: types.IDeviceCommand) {
    await this.processCommand(deviceCommand);
  }

  async processCommand(deviceCommand: types.IDeviceCommand) {
    console.log('THIS SHOULD BE NULL', this.bufferDeviceCommand)
    const deviceWriteStatus = this.deviceWriteStatus
    const dummyCommand: types.IDeviceCommand = {
      isOn: true,
      RGB: {
        red: 0,
        green: 0,
        blue: 0,
      },
      CCT: {
        warmWhite: 0,
        coldWhite: 0
      },
      colorMask: both
    }

    console.log(deviceWriteStatus);
    try {


      switch (deviceWriteStatus) {
        case ready:
          this.deviceWriteStatus = pending;
          this.newColorCommand = deviceCommand;
          await this.writeStateToDevice(this.newColorCommand).then((param) => {
            this.newColorCommand = null;
            this.deviceWriteStatus = ready
            console.log(param)
          }).catch((error) => {
            console.log('something failed')
            this.newColorCommand = null;
            this.bufferDeviceCommand = null;
            this.deviceWriteStatus = ready
          });
          break;
        case pending:
          //console.log('deviceCommand on/off', deviceCommand.isOn)
          console.log('setting the pending command')
          this.newColorCommand = _.merge(this.newColorCommand, deviceCommand)
          break;
        case busy:
          //console.log('deviceCommand on/off', deviceCommand.isOn)
          this.bufferDeviceCommand = _.merge(this.bufferDeviceCommand, deviceCommand)
          break;
      }
    } catch (error) {

    }
  }


  async writeStateToDevice(deviceCommand: types.IDeviceCommand, count = 0): Promise<string> {
    let timeout = 0;
    return new Promise(async (resolve, reject) => {
      setTimeout(async() => {
       
        this.deviceWriteStatus = busy;
      const dummyCommand: types.IDeviceCommand = {
        isOn: false,
        RGB: {
          red: 0,
          green: 0,
          blue: 0,
        },
        CCT: {
          warmWhite: 0,
          coldWhite: 0
        },
        colorMask: both
      }

      //console.log('deviceCommand on/off', deviceCommand.isOn)

      deviceCommand = _.merge(dummyCommand, deviceCommand)
      if(this.activeDevice.deviceParameters.needsPowerCommand){
        timeout = OPTIMIZATION_SETTINGS.POWER_WAIT_TIME
        this.send(COMMAND_POWER_ON);
      }
      if (count > 4) return;
     // console.log(count);
     setTimeout(async () => {
          
 
      await this.prepareColorCommand(deviceCommand).then(async () => {
        console.log(this.bufferDeviceCommand)
        if (this.bufferDeviceCommand !== null) {
          const tempBufferDeviceCommand = _.cloneDeep(this.bufferDeviceCommand)
          this.bufferDeviceCommand = null
          await this.writeStateToDevice(tempBufferDeviceCommand);
          resolve('Discontinuing write validity as command buffer contains data.')
        } else {

          this.testValidState(deviceCommand).then(async (isEqual) => {
            if (!isEqual) {
              console.log('retrying color command')
              await this.writeStateToDevice(deviceCommand, count + 1);
            } else {
              this.overwriteLocalState(deviceCommand);
              resolve('success')
            }
          });
        }

      })
    }, OPTIMIZATION_SETTINGS.INTRA_MESSAGE_TIME);
  }, timeout);
    });
  }//setColor


  async testValidState(deviceCommand: types.IDeviceCommand): Promise<boolean> {
    return new Promise(async (resolve, reject) => {

      setTimeout(async () => {
        await this.fetchState().then((deviceState) => {
          const isValid = this.stateHasSoftEquality(deviceCommand, deviceState.LED);
          resolve(isValid);
        });
      }, OPTIMIZATION_SETTINGS.STATE_RETRY_WAIT_TIME);
    });
  }

  stateHasSoftEquality(deviceStateA: types.IDeviceCommand, deviceStateB: types.IDeviceCommand): boolean {
    try {
      let isEqual = false;

      if (_.isEqual(_.omit(deviceStateA, ['colorMask']), (_.omit(deviceStateB, ['colorMask'])))) {
        //console.log('wrong state!')
        isEqual = true;
      }
      //console.log('OLD STATE:\n', deviceStateA)
      //console.log('\nNEWSTATE:\n', deviceStateB)


      return isEqual;
    } catch (error) {
      //this.logs.error('getState() error: ', error);
    }
  }

  overwriteLocalState(deviceCommand: types.IDeviceCommand) {
    Object.assign(this.deviceState.LED, deviceCommand);
  }

  async fetchState() {

    let deviceState: types.IDeviceState;

    let scans = 0, data: Buffer;

    while (data == null && scans < 5) {
      data = await this.transport.getState(1000);
      scans++;
    }
    if (data) {
      deviceState = await parseDeviceState(data);
    }

    return deviceState;
  }



  //=================================================
  // End State Get/Set //


  //=================================================
  // Start LightEffects //

  flashEffect() {
    // this.lightState.LED.HSL.hue = 100 as number;
    // this.lightState.LED.HSL.saturation = 100 as number;

    // let change = true;
    // let count = 0;

    // const interval = setInterval(() => {

    //   if (change) {
    //     this.lightState.LED.brightness = 0;

    //   } else {
    //     this.lightState.LED.brightness = 100;
    //   }

    //   change = !change;
    //   count++;
    //   this.updateDeviceState(b);

    //   if (count >= 20) {

    //     this.lightState.LED.HSL.hue = 0;
    //     this.lightState.LED.HSL.saturation = 5;
    //     this.lightState.LED.brightness = 100;
    //     this.updateDeviceState();
    //     clearInterval(interval);
    //     return;
    //   }
    // }, 300);
  } //flashEffect

  //=================================================
  // End LightEffects //


  async prepareColorCommand(deviceCommand: types.IDeviceCommand): Promise<string> {
    return new Promise(async (resolve, reject) => {

    const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite }, colorMask } = deviceCommand;
    const { isEightByteProtocol } = this.activeDevice.deviceParameters;

    let command;
    if (isEightByteProtocol) {
      command = [0x31, red, green, blue, 0x00, colorMask, 0x0F]; //8th byte checksum calculated later in send()
    } else {
      command = [0x31, red, green, blue, warmWhite, coldWhite, colorMask, 0x0F]; //9 byte
    }
    //console.log('COMMAND', command)
    const deviceResponse = this.send(command);

    if (deviceResponse == undefined && this.activeDevice.deviceParameters.isEightByteProtocol === null) {
      this.activeDevice.deviceParameters.isEightByteProtocol = true;
      await this.prepareColorCommand(deviceCommand);
    }

    resolve( deviceResponse)
    //this.logs.debug('Recieved the following response', output);
  });
  } //send

  async send(command, useChecksum = true, _timeout = 50) {
    const buffer = Buffer.from(command);
    const deviceResponse = await this.transport.send(buffer, useChecksum, _timeout);
    return deviceResponse;
  }

  cacheCurrentLightState() {
    this.lightStateTemporary = this.deviceState;
  }

  async restoreCachedLightState() {
    this.deviceState = this.lightStateTemporary;
    //this.processCommand(both);
  }

  //=================================================
  // End Misc Tools //


} // ZackneticMagichomePlatformAccessory class
