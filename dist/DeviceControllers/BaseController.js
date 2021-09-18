"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
const miscUtils_1 = require("../utils/miscUtils");
const lodash_1 = require("lodash");
const magichome_core_1 = require("magichome-core");
const OPTIMIZATION_SETTINGS = {
    INTRA_MESSAGE_TIME: 20,
    POWER_WAIT_TIME: 50,
    STATE_RETRY_WAIT_TIME: 350,
};
const { white, color, both } = {
    white: 0x0F,
    color: 0xF0,
    both: 0xFF,
};
const { ready, busy, pending } = {
    ready: 'ready',
    busy: 'busy',
    pending: 'pending',
};
const COMMAND_POWER_ON = [0x71, 0x23, 0x0f];
const COMMAND_POWER_OFF = [0x71, 0x24, 0x0f];
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class BaseController {
    // logs = getLogs();
    //=================================================
    // Start Constructor //
    constructor(activeDevice) {
        this.activeDevice = activeDevice;
        this.newColorCommand = null;
        this.bufferDeviceCommand = null;
        this.transport = new magichome_core_1.Transport(activeDevice.cachedIPAddress);
        this.deviceState = activeDevice.lastKnownState;
        this.lightStateTemporary = activeDevice.lightStateTemporary;
        this.deviceWriteStatus = ready;
    }
    //=================================================
    // End Constructor //
    setOn(value) {
        const deviceCommand = { isOn: value };
        this.processCommand(deviceCommand);
    }
    setRed(value) {
        return __awaiter(this, void 0, void 0, function* () {
            value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
            const deviceCommand = { isOn: true, RGB: { red: value } };
            yield this.processCommand(deviceCommand);
        });
    }
    setGreen(value) {
        value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
        const deviceCommand = { isOn: true, RGB: { green: value } };
        this.processCommand(deviceCommand);
    }
    setBlue(value) {
        value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
        const deviceCommand = { isOn: true, RGB: { blue: value } };
        this.processCommand(deviceCommand);
    }
    setWarmWhite(value) {
        value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
        const deviceCommand = { CCT: { warmWhite: value } };
        this.processCommand(deviceCommand);
    }
    setColdWhite(value) {
        return __awaiter(this, void 0, void 0, function* () {
            value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
            const deviceCommand = { CCT: { coldWhite: value } };
            yield this.processCommand(deviceCommand);
        });
    }
    setAllValues(deviceCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.processCommand(deviceCommand);
        });
    }
    processCommand(deviceCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceWriteStatus = this.deviceWriteStatus;
            const dummyCommand = {
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
            };
            console.log(deviceWriteStatus);
            try {
                switch (deviceWriteStatus) {
                    case ready:
                        this.deviceWriteStatus = pending;
                        this.newColorCommand = deviceCommand;
                        yield this.writeStateToDevice(this.newColorCommand).then((param) => {
                            this.newColorCommand = null;
                            this.deviceWriteStatus = ready;
                            console.log(param);
                        }).catch((error) => {
                            console.log('something failed');
                            this.newColorCommand = null;
                            this.bufferDeviceCommand = null;
                            this.deviceWriteStatus = ready;
                        });
                        break;
                    case pending:
                        //console.log('deviceCommand on/off', deviceCommand.isOn)
                        console.log('setting the pending command');
                        this.newColorCommand = lodash_1._.merge(this.newColorCommand, deviceCommand);
                        break;
                    case busy:
                        //console.log('deviceCommand on/off', deviceCommand.isOn)
                        this.bufferDeviceCommand = lodash_1._.merge(this.bufferDeviceCommand, deviceCommand);
                        break;
                }
            }
            catch (error) {
            }
        });
    }
    writeStateToDevice(deviceCommand, count = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            let timeout = 0;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    this.deviceWriteStatus = busy;
                    const dummyCommand = {
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
                    };
                    //console.log('deviceCommand on/off', deviceCommand.isOn)
                    deviceCommand = lodash_1._.merge(dummyCommand, deviceCommand);
                    if (this.activeDevice.deviceParameters.needsPowerCommand) {
                        timeout = OPTIMIZATION_SETTINGS.POWER_WAIT_TIME;
                        this.send(COMMAND_POWER_ON);
                    }
                    if (count > 4)
                        return;
                    // console.log(count);
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        yield this.prepareColorCommand(deviceCommand).then(() => __awaiter(this, void 0, void 0, function* () {
                            console.log(this.bufferDeviceCommand);
                            if (this.bufferDeviceCommand !== null) {
                                const tempBufferDeviceCommand = lodash_1._.cloneDeep(this.bufferDeviceCommand);
                                this.bufferDeviceCommand = null;
                                yield this.writeStateToDevice(tempBufferDeviceCommand);
                                resolve('Discontinuing write validity as command buffer contains data.');
                            }
                            else {
                                this.testValidState(deviceCommand).then((isEqual) => __awaiter(this, void 0, void 0, function* () {
                                    if (!isEqual) {
                                        console.log('retrying color command');
                                        yield this.writeStateToDevice(deviceCommand, count + 1);
                                    }
                                    else {
                                        this.overwriteLocalState(deviceCommand);
                                        resolve('success');
                                    }
                                }));
                            }
                        }));
                    }), OPTIMIZATION_SETTINGS.INTRA_MESSAGE_TIME);
                }), timeout);
            }));
        });
    } //setColor
    testValidState(deviceCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    yield this.fetchState().then((deviceState) => {
                        const isValid = this.stateHasSoftEquality(deviceCommand, deviceState.LED);
                        resolve(isValid);
                    });
                }), OPTIMIZATION_SETTINGS.STATE_RETRY_WAIT_TIME);
            }));
        });
    }
    stateHasSoftEquality(deviceStateA, deviceStateB) {
        try {
            let isEqual = false;
            if (lodash_1._.isEqual(lodash_1._.omit(deviceStateA, ['colorMask']), (lodash_1._.omit(deviceStateB, ['colorMask'])))) {
                //console.log('wrong state!')
                isEqual = true;
            }
            //console.log('OLD STATE:\n', deviceStateA)
            //console.log('\nNEWSTATE:\n', deviceStateB)
            return isEqual;
        }
        catch (error) {
            //this.logs.error('getState() error: ', error);
        }
    }
    overwriteLocalState(deviceCommand) {
        Object.assign(this.deviceState.LED, deviceCommand);
    }
    fetchState() {
        return __awaiter(this, void 0, void 0, function* () {
            let deviceState;
            let scans = 0, data;
            while (data == null && scans < 5) {
                data = yield this.transport.getState(1000);
                scans++;
            }
            if (data) {
                deviceState = yield (0, miscUtils_1.parseDeviceState)(data);
            }
            return deviceState;
        });
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
    prepareColorCommand(deviceCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite }, colorMask } = deviceCommand;
                const { isEightByteProtocol } = this.activeDevice.deviceParameters;
                let command;
                if (isEightByteProtocol) {
                    command = [0x31, red, green, blue, 0x00, colorMask, 0x0F]; //8th byte checksum calculated later in send()
                }
                else {
                    command = [0x31, red, green, blue, warmWhite, coldWhite, colorMask, 0x0F]; //9 byte
                }
                //console.log('COMMAND', command)
                const deviceResponse = this.send(command);
                if (deviceResponse == undefined && this.activeDevice.deviceParameters.isEightByteProtocol === null) {
                    this.activeDevice.deviceParameters.isEightByteProtocol = true;
                    yield this.prepareColorCommand(deviceCommand);
                }
                resolve(deviceResponse);
                //this.logs.debug('Recieved the following response', output);
            }));
        });
    } //send
    send(command, useChecksum = true, _timeout = 50) {
        return __awaiter(this, void 0, void 0, function* () {
            const buffer = Buffer.from(command);
            const deviceResponse = yield this.transport.send(buffer, useChecksum, _timeout);
            return deviceResponse;
        });
    }
    cacheCurrentLightState() {
        this.lightStateTemporary = this.deviceState;
    }
    restoreCachedLightState() {
        return __awaiter(this, void 0, void 0, function* () {
            this.deviceState = this.lightStateTemporary;
            //this.processCommand(both);
        });
    }
} // ZackneticMagichomePlatformAccessory class
exports.BaseController = BaseController;
