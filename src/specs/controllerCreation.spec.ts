import { ControllerGenerator } from '../ControllerGenerator';
import { cctColorWave, cctRgbTest, cctWave, colorTest, colorWave, fireworks, hellStruck, thunderStruck } from '../utils/animationLibrary'
const deviceList = [];

// import { DeviceInterface } from '../DeviceInterface'
// import { ICommandOptions, ICommandResponse, IDeviceCommand } from '../types';

import { BaseController } from '../BaseController';
import { ICommandOptions, IDeviceCommand } from 'magichome-core';
import { IAnimationLoop } from '../utils/types';
import { AnimationController } from '../utils/AnimationController';
import { sleepTimeout } from 'magichome-core/dist/utils/miscUtils';
import { Console } from 'console';

// import * as types from '../types'

const controllerGenerator = new ControllerGenerator();

let completedDevices;
let basecontrollers;
let animationController: AnimationController;

describe('Test the scan function for DeviceDiscovery.ts', function () {


    afterEach(done => {
        setTimeout(done, 100);
    });

    it('Should retrieve meta-data on each device', async function () {
        try {



            const ret = await controllerGenerator.discoverCompleteDevices().catch(e => { console.log(e) });
            // if (ret.length != protoDevices.length) throw new Error("Every proto-device did not retrieve meta-data successfully");
            completedDevices = ret;
        } catch (error) {
            console.log(error)
        }
    })

    it('Should create a controller for each device', function () {
        try {


            const ret = controllerGenerator.generateControllers(completedDevices);
            // if (ret.length != protoDevices.length) throw new Error("Every proto-device did not retrieve meta-data successfully");
            basecontrollers = ret;

        } catch (error) {
            console.log(error)
            return
        }
    })
    // it('turn on a light', async function () {
    //     if (basecontrollers.has("DC4F22CF7C31")) {
    //     // const a = basecontrollers.filter((controller: BaseController) => {
    //     //     return controller.getCachedDeviceInformation().protoDevice.uniqueId = "DC4F22CF7C31";
    //     // })
    //     const a: BaseController = basecontrollers.get("DC4F22CF7C31");
    // //     const command: IDeviceCommand = { isOn: true, RGB: { red: 255, green: 255, blue: 25 }, CCT: { warmWhite: 255, coldWhite: 255 }, colorMask: 0x0F }
    //     await a[0].setAllValues(command)

    //     // }
    // })
    it('make colors', async function () {

        try {
            if (basecontrollers == undefined) return false;

            const onlineDevices = basecontrollers.filter((controller: BaseController) => {
                // return controller.getCachedDeviceInformation().protoDevice.uniqueId == 'DC4F22E192D0'
                // controller.getCachedDeviceInformation().deviceAPI

                // return controller.getCachedDeviceInformation().protoDevice.ipAddress == '192.168.1.7'

                // return controller.getCachedDeviceInformation().deviceState.isOn;
                return true;

            })

            // console.log(onlineDevices[0].getCachedDeviceInformation().deviceAPI)
            // console.log("ONLINE DEVICES", onlineDevices)
            if (typeof onlineDevices == 'undefined' || !onlineDevices || onlineDevices.length < 1) {
           
                return false;
            } 
            animationController = new AnimationController()
            animationController.animateAsynchronously(onlineDevices, hellStruck)
            // await sleepTimeout(200000);
            // animationController.clearAnimations();
        } catch (error) {
            console.log(error)
            return;
        }
    })
});