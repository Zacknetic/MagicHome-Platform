import { BaseController } from '../DeviceControllers/BaseController';
import { Controllers } from '../Controllers';
import { IAnimationCommand, IAnimationFrame, IAnimationLoop } from '../types';
import { COMMAND_TYPE, DefaultCommand, ICommandOptions, IDeviceCommand } from 'magichome-core';



const { POWER_COMMAND, COLOR_COMMAND, ANIMATION_FRAME, QUERY_COMMAND } = COMMAND_TYPE;

// const controllerGenerator = new ControllerGenerator();

// async function makeControllers() {
// 	return new Promise<BaseController[]>(async (resolve, reject) => {
// 		const deviceList: BaseController[] = [];
// 		const controllers: Map<string, BaseController> = await controllerGenerator.discoverControllers();

// 		let count = 1;
// 		for (const [key, activeDevice] of Object.entries(controllers)) {
// 			try {
// 				// console.log(activeDevice.protoDevice.uniqueId)
// 				// if (activeDevice.deviceAPI.description == 'RGBWW Simultaneous') {
// 				deviceList[count] = activeDevice;
// 				count++;
// 				// }
// 			} catch (error) {
// 				console.log(error, activeDevice)
// 			}
// 		}
// 		animate(deviceList)
// 	})
// }
const commandOptions: ICommandOptions = {
    commandType: COLOR_COMMAND,
    maxRetries: 0,
    bufferMS: 1000,
    waitForResponse: true,
    timeoutMS: 0,
    // isAnimationFrame: true
}
export class Animations {
    protected transitionIntervals = [];
    protected transitionTimeouts = [];
    protected cancelLoop = false;
    constructor() {

    }

    public clearAnimations() {
        this.cancelLoop = true;
        while (this.transitionIntervals.length > 0) {
            const interval = this.transitionIntervals.pop()
            clearInterval(interval);
        }
        while (this.transitionTimeouts.length > 0) {
            const timeout = this.transitionTimeouts.pop()
            clearTimeout(timeout);
        }

    }

    public animateTogether(deviceList: BaseController[], animations: IAnimationLoop) {
        let state = 0

        let duration = 1000;

    }

    public async animateIndividual(device:  BaseController[], animations: IAnimationLoop) {
        if (this.cancelLoop) return;
       
        for (const animationFrame of animations.pattern) {

            let { transitionTimeMS, durationAtTargetMS, chancePercent, colorStart, colorTarget } = animationFrame;
            const rollDice = Math.random() * 100;
            // console.log("DEVILS DICE:", rollDice, " YOUR DICE:", chancePercent)
            if (rollDice > chancePercent) continue;
            transitionTimeMS = arrayToRandomInt(transitionTimeMS);
            durationAtTargetMS = arrayToRandomInt(durationAtTargetMS);

            await this.fade(device, colorStart, colorTarget, transitionTimeMS, 50)
            // countClock(Math.round(durationAtTargetMS as number / 100) - 10)
            await new Promise(async (resolve) => {
                const timeout = await setTimeout(() => {
                    resolve(true)
                }, durationAtTargetMS as number);
                this.transitionTimeouts.push(timeout)
            })


        }
        setImmediate(() => this.animateIndividual(device, animations))

    }

    private async fade(deviceList: BaseController[], startCommand: IAnimationCommand, endCommand: IAnimationCommand, duration, interval) {

        return new Promise(async (resolve) => {

            const steps = duration / interval;
            const step_u = 1.0 / steps;
            let u = 0.0;
            const repeat = await setInterval(async function () {
                if (u >= 1.0 || this.cancelLoop) {
                    // console.log('clearing interval')
                    clearInterval(repeat);
                    resolve(true)
                }
                // console.log(u)
                let deviceCommand: IDeviceCommand = recursiveLerp(startCommand, endCommand, u)
                const finalCommand = { ison: true, ...deviceCommand }
                for (const device of deviceList) {
                    await device.setAllValues(finalCommand, commandOptions);
                }
                u += step_u;
            }, interval);
            this.transitionIntervals.push(repeat)

        })

    };


}

function recursiveLerp(objOne, objTwo, u, objTarget: IDeviceCommand = DefaultCommand) {
    for (var k in objOne) {
        if (typeof objOne[k] == "object" && objOne[k] !== null) {
            objTarget[k] = recursiveLerp(objOne[k], objTwo[k], u, objTarget[k]);
        }
        else {
            objTarget[k] = lerp(objOne[k], objTwo[k], u);
        }
    }
    return objTarget;
}

function lerp(a, b, u) {
    return Math.round((1 - u) * a + u * b);
};


function arrayToRandomInt(arr) {
    if (Array.isArray(arr)) {
        arr = Math.round(Math.random() * (arr[1] - arr[0]) + arr[0]);
    }
    return arr;
}

async function countClock(time) {
    const inter = setInterval(() => {
        console.log("Time Left: ", time)
        time--;
        if (time < 1) {
            clearInterval(inter);
            return;
        }
    }, 100);
}