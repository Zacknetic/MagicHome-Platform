import { BaseController } from '../DeviceControllers/BaseController';
import { ControllerGenerator } from '../ControllerGenerator';
import { ColorMasks, DefaultCommand, IAnimationFrame, IAnimationLoop, ICommandOptions, IDeviceCommand } from '../types';
import { type } from 'os';
const { performance } = require('perf_hooks');



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
    protected transitionInterval;
    constructor() {

    }

    public clearAnimations() {
        clearInterval(this.transitionInterval);
    }

    public animateTogether(deviceList: BaseController[], animations: IAnimationLoop) {
        let state = 0

        let duration = 1000;

    }
    public animateIndividual(device: BaseController, animations: IAnimationLoop) {

        for (const animationFrame of animations.pattern) {
            let { transitionTimeMS, durationAtTargetMS, chancePercent, colorStart, colorTarget } = animationFrame;
            const rollDice = Math.random() * 100;
            if (rollDice > chancePercent) continue;
            transitionTimeMS = (Math.random() * (transitionTimeMS[1] - transitionTimeMS[0]) + transitionTimeMS[0] ?? transitionTimeMS) as number;
            durationAtTargetMS = (Math.random() * (durationAtTargetMS[1] - durationAtTargetMS[0]) + durationAtTargetMS[0] ?? durationAtTargetMS) as number;
            console.log('starting')
            this.fade([device], colorStart, colorTarget, transitionTimeMS, 20).then(() => setTimeout(() => {
                console.log('this should run second')
            }, durationAtTargetMS))


        }

    }



    private async fade(deviceList: BaseController[], startCommand: IDeviceCommand, endCommand: IDeviceCommand, duration, interval) {

        const steps = duration / interval;
        const step_u = 1.0 / steps;
        let u = 0.0;
        this.transitionInterval = setInterval(function () {
            if (u >= 1.0) {
                clearInterval(this.transitionInterval);
            }
            console.log(u)
            let command: IDeviceCommand = recursiveLerp(startCommand, endCommand, u)
            const finalCommand = { ison: true, ...command }
            // console.log(command);
            deviceList.forEach(async (controller, index) => {
                await controller.setAllValues(finalCommand, commandOptions);
            });
            u += step_u;
        }, interval);
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


