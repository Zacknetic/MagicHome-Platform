import { BaseController } from '../BaseController';
import { IAnimationCommand, IAnimationFrame, IAnimationLoop } from './types';
import { COLOR_MASKS, COMMAND_TYPE, DEFAULT_COMMAND, ICommandOptions, ICompleteDevice, ICompleteResponse, IDeviceCommand, IDeviceState, isStateEqual, mergeDeep } from 'magichome-core';
import { clamp } from './miscUtils';
import { overwriteDeep, sleepTimeout } from 'magichome-core/dist/utils/miscUtils';
import { isCommandEqual } from './platformUtils';



const { COLOR_COMMAND } = COMMAND_TYPE;
const INTERVAL_MS = 25; //time period in milliseconds between each command. i.e. An interval_MS of 25 is 1000ms / 25ms/frame = 40frames/s

const DEFAULT_COMMAND_OPTIONS: ICommandOptions = {
    commandType: COLOR_COMMAND,
    maxRetries: 0,
    bufferMS: 100,
    waitForResponse: false,
    timeoutMS: 0,
    // isAnimationFrame: true
}
export class AnimationController {
    protected transitionIntervals = [];
    protected transitionTimeouts = [];
    protected cancelLoop: boolean = false;
    protected assignedControllers = new Set<String>([

    ])
    public isActive: boolean = false;
    constructor() {

    }

    public clearAnimations() {
        this.cancelLoop = true;
        while (this.transitionIntervals.length > 0) {
            this.cancelLoop = true;
            const interval = this.transitionIntervals.pop()
            clearInterval(interval);
        }
        while (this.transitionTimeouts.length > 0) {
            this.cancelLoop = true;
            const timeout = this.transitionTimeouts.pop()
            clearTimeout(timeout);
        }
        this.isActive = false;

    }

    public async animateAsynchronously(controllers: BaseController[], animations: IAnimationLoop): Promise<void> {
        this.cancelLoop = false;
        this.isActive = true;
        this.createControllerSet(controllers);
        for (const controller of controllers) {
            this.animateControllers([controller], animations);
        }
    }

    public animateSynchronously(controllers: BaseController[], animations: IAnimationLoop): void {
        this.isActive = true;
        this.cancelLoop = false;
        this.createControllerSet(controllers);
        this.animateControllers(controllers, animations);
    }

    createControllerSet(controllers: BaseController[]) {
        for (const controller of controllers) {
            const uniqueId = controller.getCachedDeviceInformation().protoDevice.uniqueId
            this.assignedControllers.add(uniqueId)
        }
    }

    public removeControllerFromAnimation(uniqueId: string) {
        if (this.assignedControllers.has(uniqueId)) this.assignedControllers.delete(uniqueId);
    }

    private async animateControllers(controllers: BaseController[], animations: IAnimationLoop, previousState?: IAnimationCommand): Promise<void> {
        if (this.cancelLoop) {
            this.cancelLoop = false;
            return;
        }

        if (!this.cancelLoop) {
            for (const animationFrame of animations.pattern) {
                const newFrame: IAnimationFrame = recursiveArrayToInt(animationFrame)

                let { transitionTimeMS, durationAtTargetMS, chancePercent, colorStart, colorTarget } = newFrame;
                if (!colorStart) colorStart = previousState ?? DEFAULT_COMMAND;
                previousState = colorTarget;
                const rollDice = Math.random() * 100;
                // console.log("DEVILS DICE:", rollDice, " YOUR DICE:", chancePercent)
                if (rollDice > chancePercent) continue;

                await new Promise(async (resolve) => {
                    await this.fade(controllers, colorStart, colorTarget, transitionTimeMS, INTERVAL_MS);
                    const timeout = await setTimeout(() => {
                        resolve(true)
                    }, durationAtTargetMS as number);
                    this.transitionTimeouts.push(timeout)
                })


            }
            setImmediate(() => this.animateControllers(controllers, animations, previousState));
        }
    }

    private async fade(controllers: BaseController[], startCommand: IAnimationCommand, endCommand: IAnimationCommand, duration, interval) {

        return new Promise(async (resolve) => {
            const steps = duration / interval;
            const step_u = 1.0000 / steps;
            let u = 0.0000;


            const repeat = await setInterval(async () => {
                if (u >= 1.0) {
                    u = 1.0;
                    this.sendStep(controllers, startCommand, endCommand, u, false).catch(e => { })
                    clearInterval(repeat);
                    resolve(true);
                    return;
                }
                u = Math.min(u, 1);
                this.sendStep(controllers, startCommand, endCommand, u, false).catch(e => { })
                u += step_u;
            }, interval);
            this.transitionIntervals.push(repeat)
        })
    };

    async sendStep(controllers: BaseController[], startCommand: IAnimationCommand, endCommand: IAnimationCommand, u, waitForResponse) {
        let deviceCommand: IDeviceCommand = recursiveLerp(startCommand, endCommand, u);
        const finalCommand = overwriteDeep(deviceCommand, { isOn: true })
        for (const controller of controllers) {
            await controller.setAllValues(finalCommand, { waitForResponse, commandType: null, colorAssist: true, timeoutMS: 500, maxRetries: 5 });
        }
    }


}

function recursiveLerp(objOne, objTwo, u, objTarget?: IDeviceCommand) {
    if (!objTarget) objTarget = mergeDeep({}, DEFAULT_COMMAND)

    u = Number.parseFloat(u.toPrecision(5));
    u = clamp(u, 0, 1);
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

function recursiveArrayToInt<Type>(objOne, objTarget = {}): Type {
    for (var k in objOne) {
        if (typeof objOne[k] == "object" && objOne[k] !== null && !Array.isArray(objOne[k])) {
            objTarget[k] = {};
            objTarget[k] = recursiveArrayToInt(objOne[k], objTarget[k]);
        } else if (Array.isArray(objOne[k])) {
            objTarget[k] = Math.round(Math.random() * (objOne[k][1] - objOne[k][0]) + objOne[k][0]);
        } else {
            objTarget[k] = objOne[k];
        }
    }
    return objTarget as Type;
}

function lerp(a, b, u) {
    return Math.round((1 - u) * a + u * b);
};


// function arrayToRandomInt(arr) {
//     if (Array.isArray(arr)) {
//         arr = Math.round(Math.random() * (arr[1] - arr[0]) + arr[0]);
//     }
//     return arr;
// }