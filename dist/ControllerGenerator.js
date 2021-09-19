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
exports.ControllerGenerator = void 0;
const types = require("./types");
const uuid_1 = require("uuid");
const magichome_core_1 = require("magichome-core");
const miscUtils_1 = require("./utils/miscUtils");
const LightMap_1 = require("./LightMap");
const BaseController_1 = require("./DeviceControllers/BaseController");
const { DefaultDevice } = types;
class ControllerGenerator {
    constructor(activeDevices = new Map(), inactiveDeviceQueue = []) {
        this.activeDevices = activeDevices;
        this.inactiveDeviceQueue = inactiveDeviceQueue;
    }
    discoverControllers() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const discoveredDevices = yield this.discoverDevices();
                Promise.all(discoveredDevices.map((discoveredDevice) => __awaiter(this, void 0, void 0, function* () {
                    yield this.createController(discoveredDevice);
                }))).finally(() => {
                    resolve(this.activeDevices);
                });
            }));
        });
    }
    createCustomControllers(customCompleteDevices) {
        return __awaiter(this, void 0, void 0, function* () {
            if (customCompleteDevices instanceof Array) {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    Promise.all(customCompleteDevices.map((customCompleteDevice) => __awaiter(this, void 0, void 0, function* () {
                        yield this.createCustomController(customCompleteDevice);
                    }))).finally(() => {
                        resolve(this.activeDevices);
                    });
                }));
            }
            else {
                this.createCustomController(customCompleteDevices);
            }
        });
    }
    createCustomController(customCompleteDevice) {
        return __awaiter(this, void 0, void 0, function* () {
            const { protoDevice, deviceParameters } = customCompleteDevice;
            console.log("PROTODEVICE", protoDevice);
            console.log("deviceParameters", deviceParameters);
            if (!protoDevice.ipAddress) {
                return;
            }
            if (!protoDevice.uniqueId) {
                protoDevice.uniqueId = (0, uuid_1.v1)();
            }
            if (!customCompleteDevice.hasOwnProperty('deviceParameters')) {
                const autoDevice = Object.assign(Object.assign({}, DefaultDevice), protoDevice);
                yield this.createController(autoDevice);
            }
            else {
                const initialDeviceState = yield this.getState(protoDevice.ipAddress);
                const deviceQueryData = { deviceParameters, initialDeviceState };
                const autoDevice = Object.assign(Object.assign({}, DefaultDevice), protoDevice);
                const newDevice = yield this.generateNewDevice(autoDevice, deviceQueryData);
                this.activeDevices[newDevice.uniqueId] = newDevice;
            }
        });
    }
    discoverDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let discoveredDevices = yield (0, magichome_core_1.scan)(2000);
                for (let scans = 0; scans < 5; scans++) {
                    if (discoveredDevices.length > 0)
                        break;
                    discoveredDevices = yield (0, magichome_core_1.scan)(2000);
                }
                if (discoveredDevices.length > 0) {
                    resolve(discoveredDevices);
                }
                else {
                    reject('No devices');
                }
            }));
        });
    }
    createController(protoDevice) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.activeDevices[protoDevice.uniqueId]) {
                return new Promise((resolve) => {
                    resolve(this.getState(protoDevice.ipAddress));
                }).then((initialState) => {
                    return new Promise((resolve) => {
                        resolve(this.assignController(initialState));
                    });
                }).then((deviceQueryData) => {
                    return new Promise((resolve) => {
                        resolve(this.generateNewDevice(protoDevice, deviceQueryData));
                    });
                }).then((newDevice) => {
                    this.activeDevices[protoDevice.uniqueId] = newDevice;
                }).catch(error => {
                    console.log(error);
                });
            }
            else {
                console.log('controller exists');
                this.activeDevices[protoDevice.uniqueId].cachedIPAddress = protoDevice.ipAddress;
            }
        });
    }
    getState(ipAddress, _timeout = 500) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const transport = new magichome_core_1.Transport(ipAddress);
                if (typeof ipAddress !== 'string') {
                    reject(`Cannot determine controller because invalid IP address. Device:' ${ipAddress}`);
                }
                try {
                    let scans = 0, data;
                    while (data == null && scans < 5) {
                        data = yield transport.getState(_timeout);
                        scans++;
                    }
                    if (data) {
                        const state = yield (0, miscUtils_1.parseDeviceState)(data);
                        resolve(state);
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
    assignController(initialState) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (LightMap_1.lightTypesMap.has(initialState.controllerHardwareVersion)) {
                    const deviceParameters = LightMap_1.lightTypesMap.get(initialState.controllerHardwareVersion);
                    const deviceQueryData = { deviceParameters: deviceParameters, initialDeviceState: initialState };
                    resolve(deviceQueryData);
                }
                else {
                    reject(null);
                }
            });
        });
    }
    generateNewDevice(protoDevice, deviceQueryData) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const newProps = {
                    UUID: protoDevice.uniqueId,
                    cachedIPAddress: protoDevice.ipAddress,
                    displayName: deviceQueryData.deviceParameters.description,
                    restartsSinceSeen: 0,
                    lastKnownState: deviceQueryData.initialDeviceState
                };
                deviceQueryData.deviceParameters.needsPowerCommand = (0, miscUtils_1.deviceNeedsPowerComand)(protoDevice, deviceQueryData);
                const deviceInformation = Object.assign(newProps, deviceQueryData, protoDevice);
                const deviceController = new BaseController_1.BaseController(deviceInformation);
                resolve(deviceController);
            });
        });
    }
    getActiveDevices(uniqueId) {
        if (uniqueId) {
            return this.activeDevices[uniqueId];
        }
        else {
            return this.activeDevices;
        }
    }
    sendDirectCommand(directCommand, commandOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const customCompleteDevice = { protoDevice: directCommand, deviceParameters: commandOptions.deviceParameters };
            const controller = this.createCustomControllers([customCompleteDevice])[0];
            controller.activeDevice.setAllValues(directCommand, commandOptions.verifyState);
        });
    }
}
exports.ControllerGenerator = ControllerGenerator;
