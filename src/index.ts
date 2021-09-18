import { Transport } from 'magichome-core';
import { ControllerGenerator } from './ControllerGenerator';

const prompts = require('prompts');
const controllerGenerator = new ControllerGenerator();
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


async function makeDevices() {

    return new Promise(async (resolve, reject) => {
        const controllers = await controllerGenerator.createControllers()
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
            console.log(`${key}:`, value.displayName)
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
    });

}

async function main() {
    let stop = 0;
    console.log('starting main')
    makeDevices();



    // const repeat = setInterval(function() {
    //     console.log(stop)
    //     stop++
    // }, 100)



}

main();