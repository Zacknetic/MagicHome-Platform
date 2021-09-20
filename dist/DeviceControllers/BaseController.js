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
const LightMap_1 = require("../LightMap");
const miscUtils_1 = require("../utils/miscUtils");
const lodash_1 = require("lodash");
const magichome_core_1 = require("magichome-core");
//import { getLogs } from '../utils/logger';
const types = require("../types");
const { ColorMasks: { white, color, both }, DeviceWriteStatus: { ready, busy, pending }, PowerCommands: { COMMAND_POWER_OFF, COMMAND_POWER_ON }, DefaultCommand, OPTIMIZATION_SETTINGS: { INTRA_MESSAGE_TIME, POWER_WAIT_TIME, STATE_RETRY_WAIT_TIME } } = types;
class BaseController {
    // logs = getLogs();
    //=================================================
    // Start Constructor //
    constructor(protoDevice) {
        this.protoDevice = protoDevice;
        this.newColorCommand = DefaultCommand;
        this.bufferDeviceCommand = DefaultCommand;
    }
    //=================================================
    // End Constructor //
    setOn(value, verifyState = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const baseCommand = { isOn: value };
            let deviceCommand;
            if (this.deviceWriteStatus === ready) {
                this.devicePowerCommand = true;
                deviceCommand = Object.assign(Object.assign({}, this.deviceState.LED), baseCommand);
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                        yield this.processCommand(deviceCommand, verifyState).then(deviceState => {
                            resolve(deviceState);
                        });
                    }));
                }));
            }
        });
    }
    setRed(value, verifyState = true) {
        return __awaiter(this, void 0, void 0, function* () {
            value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
            const deviceCommand = { isOn: true, RGB: { red: value }, colorMask: color };
            return yield this.prepareCommand(deviceCommand, verifyState);
        });
    }
    setGreen(value, verifyState = true) {
        return __awaiter(this, void 0, void 0, function* () {
            value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
            const deviceCommand = { isOn: true, RGB: { green: value }, colorMask: color };
            return yield this.prepareCommand(deviceCommand, verifyState);
        });
    }
    setBlue(value, verifyState = true) {
        return __awaiter(this, void 0, void 0, function* () {
            value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
            const deviceCommand = { isOn: true, RGB: { blue: value }, colorMask: color };
            return yield this.prepareCommand(deviceCommand, verifyState);
        });
    }
    setWarmWhite(value, verifyState = true) {
        return __awaiter(this, void 0, void 0, function* () {
            value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
            const deviceCommand = { isOn: true, CCT: { warmWhite: value }, colorMask: white };
            return yield this.prepareCommand(deviceCommand, verifyState);
        });
    }
    setColdWhite(value, verifyState = true) {
        return __awaiter(this, void 0, void 0, function* () {
            value = Math.round((0, miscUtils_1.clamp)(value, 0, 255));
            const deviceCommand = { isOn: true, CCT: { coldWhite: value }, colorMask: white };
            return yield this.prepareCommand(deviceCommand, verifyState);
        });
    }
    setAllValues(deviceCommand, verifyState = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.prepareCommand(deviceCommand, verifyState);
        });
    }
    prepareCommand(deviceCommand, verifyState = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                yield this.processCommand(deviceCommand, verifyState).then(deviceState => {
                    resolve(deviceState);
                });
            }));
        });
    }
    processCommand(deviceCommand, verifyState = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const deviceWriteStatus = this.deviceWriteStatus;
                switch (deviceWriteStatus) {
                    case ready:
                        this.deviceWriteStatus = pending;
                        this.newColorCommand = deviceCommand;
                        yield this.writeStateToDevice(this.newColorCommand, verifyState).then((param) => {
                            // console.log(param)
                            this.newColorCommand = DefaultCommand;
                            this.devicePowerCommand = false;
                            this.deviceWriteStatus = ready;
                            resolve(this.deviceState);
                        }).catch((error) => {
                            //console.log('something failed: ', error)
                            this.newColorCommand = DefaultCommand;
                            this.bufferDeviceCommand = DefaultCommand;
                            this.devicePowerCommand = false;
                            this.deviceWriteStatus = ready;
                        });
                        break;
                    case pending:
                        if (deviceCommand.isOn !== false)
                            this.newColorCommand = Object.assign({}, this.newColorCommand, deviceCommand);
                        break;
                    case busy:
                        if (deviceCommand.isOn !== false)
                            //this.bufferDeviceCommand = Object.assign({}, this.bufferDeviceCommand, deviceCommand);
                            this.bufferDeviceCommand = deviceCommand;
                        break;
                }
            }));
        });
    }
    writeStateToDevice(deviceCommand, verifyState = true, count = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            let timeout = 0;
            if (count > 5) {
                return 'could not verify state';
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    this.deviceWriteStatus = busy;
                    let sanitizedDeviceCommand = Object.assign({}, DefaultCommand, deviceCommand);
                    sanitizedDeviceCommand.RGB = Object.assign({}, DefaultCommand.RGB, deviceCommand.RGB);
                    //console.log(sanitizedDeviceCommand);
                    if (this.deviceAPI.needsPowerCommand && !this.deviceState.LED.isOn) {
                        timeout = POWER_WAIT_TIME;
                        this.send(COMMAND_POWER_ON);
                    }
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        yield this.prepareColorCommand(sanitizedDeviceCommand).then(() => __awaiter(this, void 0, void 0, function* () {
                            if (this.bufferDeviceCommand !== DefaultCommand) {
                                const tempBufferDeviceCommand = lodash_1._.cloneDeep(this.bufferDeviceCommand);
                                this.bufferDeviceCommand = DefaultCommand;
                                yield this.writeStateToDevice(tempBufferDeviceCommand);
                                resolve('Discontinuing write validity as command buffer contains data.');
                            }
                            else {
                                if (verifyState) {
                                    this.testValidState(sanitizedDeviceCommand).then(({ isValid, deviceState }) => __awaiter(this, void 0, void 0, function* () {
                                        if (isValid) {
                                            this.overwriteLocalState(sanitizedDeviceCommand, deviceState);
                                            resolve('State Successfully Written');
                                        }
                                        else {
                                            resolve(yield this.writeStateToDevice(sanitizedDeviceCommand, verifyState, count + 1));
                                        }
                                    }));
                                }
                                else {
                                    this.overwriteLocalState(sanitizedDeviceCommand);
                                    resolve('State Successfully Written');
                                }
                            }
                        }));
                    }), INTRA_MESSAGE_TIME);
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
            // console.log("DEVICE A", deviceStateA);
            // console.log("DEVICE B", deviceStateB)
            if (!this.devicePowerCommand && deviceStateA.isOn !== deviceStateB.isOn) {
                this.devicePowerCommand = true;
            }
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
    prepareColorCommand(deviceCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log(deviceCommand)
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this.devicePowerCommand) {
                    const deviceResponse = this.send(deviceCommand.isOn ? COMMAND_POWER_ON : COMMAND_POWER_OFF);
                    resolve(deviceResponse);
                }
                else {
                    const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite }, colorMask } = deviceCommand;
                    const { isEightByteProtocol } = this.deviceAPI;
                    if (!deviceCommand.colorMask) {
                        if (this.deviceAPI.simultaneousCCT)
                            deviceCommand.colorMask = both;
                        else
                            deviceCommand.colorMask = color;
                    }
                    let commandByteArray;
                    if (isEightByteProtocol) {
                        commandByteArray = [0x31, red, green, blue, 0x00, colorMask, 0x0F]; //8th byte checksum calculated later in send()
                    }
                    else {
                        commandByteArray = [0x31, red, green, blue, warmWhite, coldWhite, colorMask, 0x0F]; //9 byte
                    }
                    const deviceResponse = yield this.send(commandByteArray);
                    if (deviceResponse == null && this.deviceAPI.isEightByteProtocol === null) {
                        console.log("CHANGING DEVICE PROTOCOL", this.deviceAPI.description);
                        this.deviceAPI.isEightByteProtocol = true;
                        yield this.prepareColorCommand(deviceCommand);
                    }
                    resolve(deviceResponse);
                    //this.logs.debug('Recieved the following response', output);
                }
            }));
        });
    }
    fetchState() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield this.queryState().then((deviceState) => {
                    resolve(deviceState);
                }).catch(reason => {
                    reject(reason);
                });
            }));
        });
    }
    queryState(_timeout = 500) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const { ipAddress } = this.protoDevice;
                if (typeof ipAddress !== 'string') {
                    reject(`Cannot determine controller because invalid IP address. Device:' ${ipAddress}`);
                }
                try {
                    let scans = 0, data;
                    while (data == null && scans < 5) {
                        data = yield this.transport.getState(_timeout);
                        scans++;
                    }
                    if (data) {
                        const deviceState = yield (0, miscUtils_1.parseDeviceState)(data);
                        this.deviceState = deviceState;
                        resolve(deviceState);
                    }
                    else {
                        reject('[DeviceControllers](GetState) unable to retrieve data.');
                    }
                }
                catch (error) {
                    reject(`[DeviceControllers](GetState) failed:', ${error}`);
                }
            }));
        });
    }
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
    restoreCachedLightState(verifyState = true) {
        return __awaiter(this, void 0, void 0, function* () {
            this.deviceState = this.deviceStateTemporary;
            const deviceCommand = this.deviceState.LED;
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                yield this.processCommand(deviceCommand, verifyState).then(deviceState => {
                    resolve(deviceState);
                });
            }));
        });
    }
    assignAPI() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (LightMap_1.lightTypesMap.has(this.deviceState.controllerHardwareVersion)) {
                    const deviceAPI = LightMap_1.lightTypesMap.get(this.deviceState.controllerHardwareVersion);
                    this.deviceAPI = deviceAPI;
                    resolve('Device API successfully found and set.');
                }
                else {
                    reject('Device API could not be found in deviceTypesMap.');
                }
            });
        });
    }
    reInitializeController(deviceAPI) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                this.transport = new magichome_core_1.Transport(this.protoDevice.ipAddress);
                resolve(this.fetchState());
            }).then(() => {
                return new Promise((resolve) => {
                    if (deviceAPI) {
                        resolve(this.assignAPI());
                    }
                    else {
                        resolve(this.deviceAPI);
                    }
                });
            }).then(() => {
                return new Promise((resolve) => {
                    this.needsPowerComand();
                    this.deviceWriteStatus = ready;
                    resolve('Successfully determined if device needs power command');
                });
            }).catch(error => {
                console.log(error);
            });
        });
    }
    needsPowerComand() {
        const matchingFirmwareVersions = [2, 3, 4, 5, 8];
        const firmwareVersion = this.deviceState.controllerFirmwareVersion;
        const modelNumber = this.protoDevice.modelNumber;
        let needsPowerCommand = false;
        if (matchingFirmwareVersions[firmwareVersion] || (firmwareVersion == 1 && modelNumber.includes('HF-LPB100-ZJ200')))
            needsPowerCommand = true;
        // console.log('powerCommand set', this.deviceAPI )
        // console.log('powerCommand set', this.deviceState )
        this.deviceAPI.needsPowerCommand = needsPowerCommand;
    }
    getCachedDeviceInformation() {
        return { deviceAPI: this.deviceAPI, protoDevice: this.protoDevice, deviceState: this.deviceState };
    }
    getCachedState() {
        return this.deviceState;
    }
}
exports.BaseController = BaseController;
