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
//import { getLogs } from '../utils/logger';
const types = require("../types");
const { ColorMasks: { white, color, both }, DeviceWriteStatus: { ready, busy, pending }, PowerCommands: { COMMAND_POWER_OFF, COMMAND_POWER_ON }, DefaultCommand, OPTIMIZATION_SETTINGS: { INTRA_MESSAGE_TIME, POWER_WAIT_TIME, STATE_RETRY_WAIT_TIME } } = types;
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class BaseController {
    // logs = getLogs();
    //=================================================
    // Start Constructor //
    constructor(deviceInformation) {
        this.deviceInformation = deviceInformation;
        this.newColorCommand = DefaultCommand;
        this.bufferDeviceCommand = DefaultCommand;
        this.transport = new magichome_core_1.Transport(deviceInformation.cachedIPAddress);
        this.deviceState = deviceInformation.deviceState;
        this.deviceStateTemporary = deviceInformation.deviceStateTemporary;
        this.deviceWriteStatus = ready;
    }
    //=================================================
    // End Constructor //
    setOn(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const baseCommand = { isOn: value };
            let deviceCommand;
            if (this.deviceWriteStatus === ready) {
                this.devicePowerCommand = true;
                deviceCommand = Object.assign(Object.assign({}, this.deviceState.LED), baseCommand);
                yield this.processCommand(deviceCommand);
            }
        });
    }
    setRed(value) {
        return __awaiter(this, void 0, void 0, function* () {
            value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
            const deviceCommand = { isOn: true, RGB: { red: value } };
            yield this.processCommand(deviceCommand);
        });
    }
    setGreen(value) {
        return __awaiter(this, void 0, void 0, function* () {
            value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
            const deviceCommand = { isOn: true, RGB: { green: value } };
            this.processCommand(deviceCommand);
        });
    }
    setBlue(value) {
        return __awaiter(this, void 0, void 0, function* () {
            value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
            const deviceCommand = { isOn: true, RGB: { blue: value } };
            this.processCommand(deviceCommand);
        });
    }
    setWarmWhite(value) {
        return __awaiter(this, void 0, void 0, function* () {
            value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
            const deviceCommand = { isOn: true, CCT: { warmWhite: value } };
            this.processCommand(deviceCommand);
        });
    }
    setColdWhite(value) {
        return __awaiter(this, void 0, void 0, function* () {
            value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
            const deviceCommand = { isOn: true, CCT: { coldWhite: value } };
            yield this.processCommand(deviceCommand);
        });
    }
    setAllValues(deviceCommand, verifyState = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.processCommand(deviceCommand, verifyState);
        });
    }
    processCommand(deviceCommand, verifyState = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceWriteStatus = this.deviceWriteStatus;
            try {
                switch (deviceWriteStatus) {
                    case ready:
                        this.deviceWriteStatus = pending;
                        this.newColorCommand = deviceCommand;
                        yield this.writeStateToDevice(this.newColorCommand, verifyState).then((param) => {
                            this.newColorCommand = DefaultCommand;
                            this.devicePowerCommand = false;
                            this.deviceWriteStatus = ready;
                        }).catch((error) => {
                            console.log('something failed: ', error);
                            this.newColorCommand = DefaultCommand;
                            this.bufferDeviceCommand = DefaultCommand;
                            this.devicePowerCommand = false;
                            this.deviceWriteStatus = ready;
                        });
                        break;
                    case pending:
                        if (deviceCommand.isOn !== false)
                            this.newColorCommand = lodash_1._.merge(this.newColorCommand, deviceCommand);
                        break;
                    case busy:
                        if (deviceCommand.isOn !== false)
                            this.bufferDeviceCommand = lodash_1._.merge(this.bufferDeviceCommand, deviceCommand);
                        break;
                }
            }
            catch (error) {
            }
        });
    }
    writeStateToDevice(deviceCommand, verifyState = true, count = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            let timeout = 0;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    this.deviceWriteStatus = busy;
                    const sanitizedDeviceCommand = lodash_1._.merge(DefaultCommand, deviceCommand);
                    if (this.deviceInformation.deviceParameters.needsPowerCommand && sanitizedDeviceCommand.isOn) {
                        timeout = POWER_WAIT_TIME;
                        this.send(COMMAND_POWER_ON);
                    }
                    if (count > 4)
                        return;
                    if (verifyState) {
                        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                            yield this.prepareColorCommand(sanitizedDeviceCommand).then(() => __awaiter(this, void 0, void 0, function* () {
                                if (this.bufferDeviceCommand !== DefaultCommand) {
                                    const tempBufferDeviceCommand = lodash_1._.cloneDeep(this.bufferDeviceCommand);
                                    this.bufferDeviceCommand = DefaultCommand;
                                    yield this.writeStateToDevice(tempBufferDeviceCommand);
                                    resolve('Discontinuing write validity as command buffer contains data.');
                                }
                                else {
                                    this.testValidState(sanitizedDeviceCommand).then(({ isValid, deviceState }) => __awaiter(this, void 0, void 0, function* () {
                                        if (!isValid) {
                                            yield this.writeStateToDevice(sanitizedDeviceCommand, verifyState, count + 1);
                                        }
                                        else {
                                            this.overwriteLocalState(sanitizedDeviceCommand, deviceState);
                                            resolve('State Successfully Written');
                                        }
                                    }));
                                }
                            }));
                        }), INTRA_MESSAGE_TIME);
                    }
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
                        resolve({ isValid, deviceState });
                    });
                }), STATE_RETRY_WAIT_TIME);
            }));
        });
    }
    stateHasSoftEquality(deviceStateA, deviceStateB) {
        try {
            let isEqual = false;
            if (this.devicePowerCommand) {
                if (deviceStateA.isOn === deviceStateB.isOn) {
                    isEqual = true;
                }
            }
            else if (lodash_1._.isEqual(lodash_1._.omit(deviceStateA, ['colorMask']), (lodash_1._.omit(deviceStateB, ['colorMask'])))) {
                isEqual = true;
            }
            return isEqual;
        }
        catch (error) {
            //this.logs.error('getState() error: ', error);
        }
    }
    overwriteLocalState(deviceCommand, deviceState) {
        if (this.devicePowerCommand) {
            Object.assign(this.deviceState.LED, deviceState);
        }
        else {
            Object.assign(this.deviceState.LED, deviceCommand);
        }
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
    prepareColorCommand(deviceCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this.devicePowerCommand) {
                    const deviceResponse = this.send(deviceCommand.isOn ? COMMAND_POWER_ON : COMMAND_POWER_OFF);
                    resolve(deviceResponse);
                }
                else {
                    const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite }, colorMask } = deviceCommand;
                    const { isEightByteProtocol } = this.deviceInformation.deviceParameters;
                    let command;
                    if (isEightByteProtocol) {
                        command = [0x31, red, green, blue, 0x00, colorMask, 0x0F]; //8th byte checksum calculated later in send()
                    }
                    else {
                        command = [0x31, red, green, blue, warmWhite, coldWhite, colorMask, 0x0F]; //9 byte
                    }
                    const deviceResponse = this.send(command);
                    if (deviceResponse == undefined && this.deviceInformation.deviceParameters.isEightByteProtocol === null) {
                        this.deviceInformation.deviceParameters.isEightByteProtocol = true;
                        yield this.prepareColorCommand(deviceCommand);
                    }
                    resolve(deviceResponse);
                    //this.logs.debug('Recieved the following response', output);
                }
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
        this.deviceStateTemporary = this.deviceState;
    }
    restoreCachedLightState() {
        return __awaiter(this, void 0, void 0, function* () {
            this.deviceState = this.deviceStateTemporary;
            //this.processCommand(both);
        });
    }
} // ZackneticMagichomePlatformAccessory class
exports.BaseController = BaseController;
