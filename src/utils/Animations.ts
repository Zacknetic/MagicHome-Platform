import { BaseController } from '../DeviceControllers/BaseController';
import { ControllerGenerator } from '../ControllerGenerator';
import { ColorMasks, DefaultCommand, IAnimationFrame, IAnimationLoop, ICommandOptions, IDeviceCommand } from '../types';
import { type } from 'os';
import { time } from 'console';



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
    maxRetries: 0,
    bufferMS: 100,
    timeoutMS: 0,
    isAnimationFrame: true
}
export class Animations {
    protected transitionIntervals = [];
    protected transitionTimeouts = [];
    protected cancelLoop = true;
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

    public async animateIndividual(device: BaseController, animations: IAnimationLoop) {
        this.cancelLoop = false;
        while (!this.cancelLoop) {
            for (const animationFrame of animations.pattern) {
                // animations.pattern.forEach(animationFrame => {
                // console.log('STARTING A PATTERN')


                let { transitionTimeMS, durationAtTargetMS, chancePercent, colorStart, colorTarget } = animationFrame;
                const rollDice = Math.random() * 100;
                // console.log("DEVILS DICE:", rollDice, " YOUR DICE:", chancePercent)
                if (rollDice > chancePercent) continue;
                transitionTimeMS = arrayToRandomInt(transitionTimeMS);
                durationAtTargetMS = arrayToRandomInt(durationAtTargetMS);


                // console.log(transitionTimeMS)
                // console.log('starting')
                await this.fade([device], colorStart, colorTarget, transitionTimeMS, 20)
                // countClock(Math.round(durationAtTargetMS as number / 100) - 10)
                await new Promise(async (resolve) => {
                    const timeout = await setTimeout(() => {
                        resolve(true)
                    }, durationAtTargetMS as number);
                    this.transitionTimeouts.push(timeout)
                })




                // });
            }
        }

    }



    private fade(deviceList: BaseController[], startCommand: IDeviceCommand, endCommand: IDeviceCommand, duration, interval) {

        return new Promise((resolve) => {

            const steps = duration / interval;
            const step_u = 1.0 / steps;
            let u = 0.0;
            const repeat = setInterval(function () {
                if (u >= 1.0 || this.cancelLoop) {
                    // console.log('clearing interval')
                    clearInterval(repeat);
                    resolve(true)
                }
                // console.log(u)
                let command: IDeviceCommand = recursiveLerp(startCommand, endCommand, u)
                const finalCommand = { ison: true, ...command }
                deviceList.forEach((controller, index) => {
                    controller.setAllValues(finalCommand, commandOptions);
                });
                u += step_u;
            }, interval);
            this.transitionIntervals.push(repeat)

        })

    };


}

function recursiveLerp(objOne, objTwo, u, objTarget = {}) {
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