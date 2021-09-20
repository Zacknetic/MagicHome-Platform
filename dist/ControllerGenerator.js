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
const uuid_1 = require("uuid");
const magichome_core_1 = require("magichome-core");
const BaseController_1 = require("./DeviceControllers/BaseController");
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
                    yield this.instantiateController(discoveredDevice);
                }))).finally(() => {
                    resolve(this.activeDevices);
                });
            }));
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
                    reject('No devices found');
                }
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
            const { protoDevice, deviceAPI } = customCompleteDevice;
            if (!protoDevice.ipAddress) {
                return;
            }
            if (!protoDevice.uniqueId) {
                protoDevice.uniqueId = (0, uuid_1.v1)();
            }
            //this.activeDevices[protoDevice.uniqueId] = 
        });
    }
    instantiateController(protoDevice) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.activeDevices[protoDevice.uniqueId]) {
                this.activeDevices[protoDevice.uniqueId] = yield this.generateNewDevice(protoDevice);
            }
            else {
                console.log('controller exists');
                this.activeDevices[protoDevice.uniqueId] = protoDevice.ipAddress;
            }
        });
    }
    generateNewDevice(protoDevice, deviceAPI = null) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const deviceController = new BaseController_1.BaseController(protoDevice);
                yield deviceController.reInitializeController(deviceAPI);
                resolve(deviceController);
            }));
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
            const customCompleteDevice = { protoDevice: directCommand, deviceAPI: commandOptions.deviceApi };
            const controller = this.createCustomControllers([customCompleteDevice])[0];
            controller.activeDevice.setAllValues(directCommand, commandOptions.verifyState);
        });
    }
}
exports.ControllerGenerator = ControllerGenerator;
