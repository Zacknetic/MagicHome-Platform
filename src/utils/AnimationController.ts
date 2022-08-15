import { BaseController } from '../BaseController';
import { IAnimationCommand, IAnimationFrame, IAnimationLoop } from './types';
import { COMMAND_TYPE, DEFAULT_COMMAND, ICommandOptions, IDeviceCommand } from 'magichome-core';



const { COLOR_COMMAND, ANIMATION_FRAME } = COMMAND_TYPE;


const commandOptions: ICommandOptions = {
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


    protected assignedControllers: BaseController[] = [];

    constructor(assignedControlers: BaseController[]) {
        this.assignedControllers = assignedControlers;
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

    public animateAsynchronously(controllers: BaseController[], animations: IAnimationLoop): void {

        for (const controller of controllers) {
            this.animateControllers([controller], animations);
        }

    }

    public animateSynchronously(controllers: BaseController[], animations: IAnimationLoop): void {

        this.animateControllers(controllers, animations);
    }

    private async animateControllers(controllers: BaseController[], animations: IAnimationLoop): Promise<void> {
        if (this.cancelLoop) {
            this.cancelLoop = false;
            return;
        }

        for (const animationFrame of animations.pattern) {

         
            const rollDice = Math.random() * 100;
            // console.log("DEVILS DICE:", rollDice, " YOUR DICE:", chancePercent)
            if (rollDice > chancePercent) continue;

            const newFrame = recursiveArrayToInt(animationFrame)
            let { transitionTimeMS, durationAtTargetMS, chancePercent, colorStart, colorTarget } = animationFrame;
            // transitionTimeMS = arrayToRandomInt(transitionTimeMS);
            // durationAtTargetMS = arrayToRandomInt(durationAtTargetMS);

            await this.fade(controllers, colorStart, colorTarget, transitionTimeMS, 200)
            // countClock(Math.round(durationAtTargetMS as number / 100) - 10)
            await new Promise(async (resolve) => {
                const timeout = await setTimeout(() => {
                    resolve(true)
                }, durationAtTargetMS as number);
                this.transitionTimeouts.push(timeout)
            })


        }
        setImmediate(() => this.animateControllers(controllers, animations));
    }

    private async fade(deviceList: BaseController[], startCommand: IAnimationCommand, endCommand: IAnimationCommand, duration, interval) {

        return new Promise(async (resolve) => {

            const steps = duration / interval;
            const step_u = 1.0 / steps;
            let u = 0.0;
            const repeat = await setInterval(async function () {
                if (u >= 1.0 || this.cancelLoop) {
                    clearInterval(repeat);
                    resolve(true)
                }
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

    public getAssignedControllers(): BaseController[] {
        return this.assignedControllers
    }

    public setAssignedControllers(baseControllers: BaseController[]): void {
        this.assignedControllers = baseControllers;
    }


}

function recursiveLerp(objOne, objTwo, u, objTarget: IDeviceCommand = DEFAULT_COMMAND) {
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

function recursiveArrayToInt(objOne, objTarget: IDeviceCommand = DEFAULT_COMMAND) {
    for (var k in objOne) {
        if (typeof objOne[k] == "object" && objOne[k] !== null) {
            objTarget[k] = recursiveArrayToInt(objOne[k], objTarget[k]);
        } else if (Array.isArray(objOne[k])) {
            objTarget[k] = Math.round(Math.random() * (objOne[k][1] - objOne[k][0]) + objOne[k][0]);
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