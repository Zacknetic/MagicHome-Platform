import { ControllerGenerator } from '../ControllerGenerator';
import { colorTest, colorWave, fireworks, thunderstruck } from '../utils/animationLibrary'
const deviceList = [];

// import { DeviceInterface } from '../DeviceInterface'
// import { ICommandOptions, ICommandResponse, IDeviceCommand } from '../types';

import { assert } from 'console';
import { BaseController } from '../BaseController';
import { ICommandOptions, IDeviceCommand } from 'magichome-core';
import { IAnimationLoop } from '../utils/types';
import { AnimationController } from '../utils/AnimationController';

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
        const ret = await controllerGenerator.discoverCompleteDevices();
        // if (ret.length != protoDevices.length) throw new Error("Every proto-device did not retrieve meta-data successfully");
        completedDevices = ret;
        // console.log(ret)
    })

    it('Should create a controller for each device', async function () {
        const ret = await controllerGenerator.generateControllers(completedDevices);
        // if (ret.length != protoDevices.length) throw new Error("Every proto-device did not retrieve meta-data successfully");
        basecontrollers = ret;
    })
    // it('turn on a light', async function () {
    //     // if (basecontrollers.has("DC4F22CF7C31")) {
    //     const a = basecontrollers.filter((controller: BaseController) => {
    //         return controller.getCachedDeviceInformation().protoDevice.uniqueId = "DC4F22CF7C31";
    //     })
    //     // const a: BaseController = basecontrollers.get("DC4F22CF7C31");
    //     const command: IDeviceCommand = { isOn: true, RGB: { red: 255, green: 255, blue: 25 }, CCT: { warmWhite: 255, coldWhite: 255 }, colorMask: 0x0F }
    //     await a[0].setAllValues(command)

    //     // }
    // })
    it('make colors', async function () {

        // console.log(basecontrollers)
        if (basecontrollers == undefined) return false;

        const onlineDevices = basecontrollers.filter((controller: BaseController) => {
            // return controller.getCachedDeviceInformation().protoDevice.uniqueId == 'B4E84250DA88'
            return controller.getCachedDeviceInformation().deviceState.isOn;
            // return true;

        })

        console.log(onlineDevices.length)
        if ( typeof onlineDevices == 'undefined'|| !onlineDevices) return false;
        animationController = new AnimationController(onlineDevices)
        animationController.animateAsynchronously(onlineDevices, fireworks)
    })



});
const controllerTestCases =

    [
        [
            {
                deviceParameters: {
                    description: 'bad name',
                    simultaneousCCT: true,
                    hasColor: true,
                    hasCCT: true,
                    hasBrightness: true,
                    isEightByteProtocol: false,
                },
                protoDevice: {
                    ipAddress: '192.168.1.21'
                }
            }
        ],

    ]



// controllerTestCases.forEach(async testCase => {
//     test(`testing a new controller`, async () => {
//         const manualDevice: types.CustomCompleteDeviceProps[] = testCase;
//         console.log(await controllerGenerator.createCustomControllers(manualDevice))
//     });
// });

// test(`making new controllers`, async () => {
//     const controllers = await controllerGenerator.discoverControllers();
//     //console.log(controllers)
//     let input = '';

//     let count = 1;

//     for (const [key, activeDevice] of Object.entries(controllers)) {

//         deviceList[count] = activeDevice;
//         count++;

//     }

// });


// async function makeDevices() {

//     return new Promise(async (resolve, reject) => {
//         const controllers = await controllerGenerator.createControllers()



//         let input = '';
//         const deviceList = [];
//         let count = 1;

//         for (const [key, activeDevice] of Object.entries(controllers)) {
//             if (activeDevice.displayName == 'RGBWW Simultaneous') {
//                 deviceList[count] = activeDevice;
//                 count++;
//             }
//         }

//         //while (input != 'exit') {

//         // Get user input


//         deviceList.forEach((value, key) => {
//             console.log(`${key}:`, value.displayName)
//         });

//         // let input = await prompts({
//         //     type: 'number',
//         //     name: 'value',
//         //     message: 'Which device would you like to manipulate',
//         //     //validate: value => deviceList[value] ? `No device exists` : true
//         // });

//         // const device = deviceList[input.value].activeController;
//         // //console.log(device)
//         // input = await prompts({
//         //     type: 'number',
//         //     name: 'value',
//         //     message: 'Set Red (0-255)',
//         //     //validate: value => deviceList[value] ? `No device exists` : true
//         // });
//         deviceList[1].activeController.setRed(0);
//         deviceList[1].activeController.setGreen(200);

//         setTimeout(() => {
//             deviceList[1].activeController.setOn(false);
//         }, 5000);

//     });

// }

// async function manualControllers() {
//     controllerTestCases.forEach(testCase => {
//         return new Promise(async (resolve, reject) => {
//             const manualDevice: types.ICustomCompleteDeviceProps[] = testCase;
//             const controllers = await controllerGenerator.createCustomControllers(manualDevice);
//             console.log(controllers)
//             let input = '';
//             const deviceList = [];
//             let count = 1;

//             for (const [key, activeDevice] of Object.entries(controllers)) {

//                 deviceList[count] = activeDevice;
//                 count++;

//             }

//             deviceList.forEach(controller => {
//                 //console.log(controller)
//                 controller.activeController.setRed(200);
//                 controller.activeController.setBlue(0);
//             })
//         });
//     });
// }

// async function main() {
//     let stop = 0;
//     console.log('starting main')
//     manualControllers();
//     //makeDevices();

//     // const repeat = setInterval(function() {
//     //     console.log(stop)
//     //     stop++
//     // }, 100)



// }

// main();

/*
export { ControllerGenerator } from './ControllerGenerator';
 
const controllerGenerator = new ControllerGenerator();
const deviceList = [];
 
async function makeControllers() {
    return new Promise<BaseController[]>(async (resolve, reject) => {
 
 
        const controllers: Map<string, BaseController> = await controllerGenerator.discoverControllers();
 
        let input = '';
 
        let count = 1;
 
        for (const [key, activeDevice] of Object.entries(controllers)) {
            // if(activeDevice.deviceAPI.description === 'RGBWW Simultaneous'){
            deviceList[count] = activeDevice;
            count++;
            //  }
 
 
        }
 
 
        await animate()
    })
    // const refreshRate = 1000 / 60;
    // const maxXPosition = 255;
    // let speedX = 1;
    // let positionX = 0;
 
    // setInterval(() => {
    //   positionX = positionX + speedX;
    //   if (positionX > maxXPosition || positionX < 0) {
    //     speedX = speedX * (-1);
    //   }
    //   controller.setRed(positionX, false);
    // }, refreshRate);
 
 
}
 
let state = 0
 
function animate() {
    setInterval(() => {
        if (state > 2) state = 0;
        console.log(state)
        deviceList.forEach(async (controller) => {
 
            switch (state) {
                case 0:
                    controller.setRed(1);
                    break;
                case 1:
                    controller.setGreen(1)
                    break;
                case 2:
                    controller.setBlue(1)
                    break;
                default:
                    break;
            }
 
        })
        state++;
 
 
    }, 5000);
}
 
function main() {
    makeControllers();
 
}
 
main();*/

