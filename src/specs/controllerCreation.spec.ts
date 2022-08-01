import { Controllers } from '../Controllers';
import * as types from '../types'
const cotrollers = new Controllers();
const deviceList = [];

// import { DeviceInterface } from '../DeviceInterface'
// import { ICommandOptions, ICommandResponse, IDeviceCommand } from '../types';

import { assert } from 'console';
import { BaseController } from '../DeviceControllers/BaseController';
import { ICommandOptions, IDeviceCommand } from 'magichome-core';
import { IAnimationLoop } from '../types';
import { Animations } from '../utils/Animations';

// import * as types from '../types'

let completedDevices;
const controllers = new Controllers;
let basecontrollers;
const animation = new Animations;
describe('Test the scan function for DeviceDiscovery.ts', function () {


    afterEach(done => {
        setTimeout(done, 100);
    });




    it('Should retrieve meta-data on each device', async function () {
        const ret = await controllers.discoverCompleteDevices();
        // if (ret.length != protoDevices.length) throw new Error("Every proto-device did not retrieve meta-data successfully");
        completedDevices = ret;
        // console.log(ret)
    })


    it('Should create a controller for each device', async function () {
        const ret = await controllers.generateControllers(completedDevices);
        // if (ret.length != protoDevices.length) throw new Error("Every proto-device did not retrieve meta-data successfully");
        basecontrollers = ret;

    })
    // it('turn on a light', async function () {
    //     if (basecontrollers.has("DC4F22CF7C31")) {
    //         const a: BaseController = basecontrollers.get("DC4F22CF7C31");
    //         const command: IDeviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 150 }, CCT: { warmWhite: 255, coldWhite: 0 }, colorMask: 0xF0 }
    //         await a.setAllValues(command)

    //     }
    // })
    it('make colors', async function () {
        const onlineDevices = basecontrollers.filter((controller: BaseController) => {
            return controller.getCachedDeviceInformation().deviceState.isOn;
        })

        // console.log(onlineDevices)
        // if (basecontrollers.has("DC4F22CF7C31")) {
        //     const a: BaseController = basecontrollers.get("DC4F22CF7C31");
            animation.animateIndividual(onlineDevices, colorWave)
        //     // setTimeout(() => {
        //     //     animation.clearAnimations();
        //     // }, 10000);
        // }

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

const thunderstruck: IAnimationLoop = {

    'name': 'ThunderStruck',
    'pattern': [
        {
            'colorStart': {
                RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 255 },
            },
            'transitionTimeMS': [2000, 3000],
            'durationAtTargetMS': 100,
            'chancePercent': 10,
        },
        {
            'colorStart': {
                RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 255 },
            },
            'transitionTimeMS': [2000, 3000],
            'durationAtTargetMS': 100,
            'chancePercent': 100,
        },
    ],
    'accessories': [
        'Office Light',
    ],
    'accessoryOffsetMS': 0,
};

const colorWave: IAnimationLoop = {

    'name': 'colorWave',
    'pattern': [
        {
            'colorStart': {
                RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 127, green: 127, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 10000,
            'durationAtTargetMS': 1000,
            'chancePercent': 100,
        },
        {
            'colorStart': {
                RGB: { red: 127, green: 127, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 10000,
            'durationAtTargetMS': 1000,
            'chancePercent': 100,
        },
        {
            'colorStart': {
                RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 0, green: 127, blue: 127 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 10000,
            'durationAtTargetMS': 1000,
            'chancePercent': 100,
        },
        {
            'colorStart': {
                RGB: { red: 0, green: 127, blue: 127 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 0, green: 0, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 10000,
            'durationAtTargetMS': 1000,
            'chancePercent': 100,
        },
        {
            'colorStart': {
                RGB: { red: 0, green: 0, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 127, green: 0, blue: 127 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 10000,
            'durationAtTargetMS': 1000,
            'chancePercent': 100,
        },
        {
            'colorStart': {
                RGB: { red: 127, green: 0, blue: 127 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 10000,
            'durationAtTargetMS': 1000,
            'chancePercent': 100,
        },
    ],
    'accessories': [
        'Office Light',
    ],
    'accessoryOffsetMS': 0,
};