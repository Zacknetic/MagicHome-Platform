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
const ControllerGenerator_1 = require("./ControllerGenerator");
const prompts = require('prompts');
const controllerGenerator = new ControllerGenerator_1.ControllerGenerator();
let controllers_;
const questions = [
    {
        type: 'number',
        name: 'deviceNumber',
        message: 'Which device would you like to manipulate? (i.e. \'42\')'
    },
    {
        type: 'number',
        name: 'deviceAction',
        message: 'What would you like to manipulate?'
    },
    {
        type: 'text',
        name: 'about',
        message: 'Tell something about yourself',
        initial: 'Why should I?'
    }
];
function makeDevices() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const controllers = yield controllerGenerator.createControllers();
            controllers_ = controllers;
            let input = '';
            const deviceList = [];
            let count = 1;
            for (const [key, activeDevice] of Object.entries(controllers)) {
                if (activeDevice.displayName == 'RGBWW Simultaneous') {
                    deviceList[count] = activeDevice;
                    count++;
                }
            }
            //while (input != 'exit') {
            // Get user input
            deviceList.forEach((value, key) => {
                console.log(`${key}:`, value.displayName);
            });
            // let input = await prompts({
            //     type: 'number',
            //     name: 'value',
            //     message: 'Which device would you like to manipulate',
            //     //validate: value => deviceList[value] ? `No device exists` : true
            // });
            // const device = deviceList[input.value].activeController;
            // //console.log(device)
            // input = await prompts({
            //     type: 'number',
            //     name: 'value',
            //     message: 'Set Red (0-255)',
            //     //validate: value => deviceList[value] ? `No device exists` : true
            // });
            deviceList[1].activeController.setRed(222);
            deviceList[1].activeController.setGreen(200);
            setTimeout(() => {
                deviceList[1].activeController.setRed(200);
                deviceList[1].activeController.setBlue(200);
            }, 20);
            setTimeout(() => {
                console.log(deviceList[1].lastKnownState);
            }, 10000);
            //console.log(device.activeDevice.lastKnownState)
            // }
        }));
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let stop = 0;
        console.log('starting main');
        makeDevices();
        // const repeat = setInterval(function() {
        //     console.log(stop)
        //     stop++
        // }, 100)
    });
}
main();
