
import { rainbow, thunderStruck } from "../animation/animationLibrary";
import { BaseController, COMMAND_TYPE, ICommandOptions, IDeviceCommand } from "..";
import { InterpolationType, interpolate } from "../animation/animationUtils";

const STEP_INTERVAL_MS = 50;

enum AnimationStepKey { ALL = "all" }
type AnimationStepKeys = AnimationStepKey | BaseController["id"];

interface IAnimationColorRange {
    red: number | number[];
    green: number | number[];
    blue: number | number[];
    warmWhite: number | number[];
    coldWhite: number | number[];
}

interface IAnimationColorStep {
    red: number;
    green: number;
    blue: number;
    warmWhite: number;
    coldWhite: number;
}

interface IAnimationSequenceRange {
    startColor?: IAnimationColorRange;
    targetColor: IAnimationColorRange;
    transitionDurationMS: number | number[];
    durationAtTargetMS: number | number[];
    reverseTransitionDurationMS?: number | number[];
    interpolationType: InterpolationType;
    skipChance: number;
}

interface IAnimationSequenceStep {
    startColor?: IAnimationColorStep;
    targetColor: IAnimationColorStep;
    transitionDurationMS: number;
    durationAtTargetMS: number;
    reverseTransitionDurationMS?: number;
    interpolationType: InterpolationType;
    skipChance: number;
}

export interface IAnimationBlueprint {
    readonly name: string;
    readonly priority: number;
    readonly syncSequenceTimings: boolean;
    readonly syncSequenceColor: boolean;
    readonly lightOffsetDurationMS: number;
    readonly animationSequences: IAnimationSequenceRange[];
}

class AnimationLoop {
    readonly name: string;
    readonly priority: number;
    readonly syncSequenceTimings: boolean;
    readonly syncSequenceColor: boolean;
    private lightOffsetDurationMS: number;
    readonly blueprintAnimationSequences: IAnimationSequenceRange[];
    readonly isSingularAnimationLoop: boolean;
    private currentAnimationOffsetDurationMS: number;
    private activeLoops: Map<AnimationStepKeys, { currentStepIndex: number, animationSteps: IAnimationColorStep[], previousLoopEndStep: IAnimationColorStep; offsetDurationMS: number; }>
    associatedLightCount: any;

    constructor(animationBlueprint: IAnimationBlueprint, lightIDs: Array<BaseController['id']>) {
        this.name = animationBlueprint.name;
        this.priority = animationBlueprint.priority;
        this.syncSequenceTimings = animationBlueprint.syncSequenceTimings;
        this.syncSequenceColor = animationBlueprint.syncSequenceColor;
        this.lightOffsetDurationMS = animationBlueprint.lightOffsetDurationMS;
        this.blueprintAnimationSequences = animationBlueprint.animationSequences;
        this.isSingularAnimationLoop = animationBlueprint.syncSequenceTimings && animationBlueprint.syncSequenceColor; //if syncSequenceTimings is false, then the animation loop is singular else test syncSequenceColor to determine if the animation loop is singular
        this.initialize(lightIDs);
    }

    private initialize(lightIDs: Array<BaseController['id']>) {
        this.currentAnimationOffsetDurationMS = 0;
        this.activeLoops = new Map(lightIDs.map(lightID => {
            this.associatedLightCount++;
            const offsetDurationMS = this.currentAnimationOffsetDurationMS;
            this.currentAnimationOffsetDurationMS += this.lightOffsetDurationMS;
            return [lightID, { currentStepIndex: -2, animationSteps: [], previousLoopEndStep: null, offsetDurationMS }];
        }));
    }

    public getAnimationStep(lightID: BaseController['id']): IAnimationColorStep {
        const animationID: AnimationStepKeys = this.isSingularAnimationLoop ? AnimationStepKey.ALL : lightID;
        const activeAnimation = this.activeLoops.get(animationID);
        let offsetIndex = activeAnimation.currentStepIndex + (activeAnimation.offsetDurationMS / STEP_INTERVAL_MS);
        if (offsetIndex > activeAnimation.animationSteps.length) {
            offsetIndex = offsetIndex % activeAnimation.animationSteps.length;
        }
        const animationStep = activeAnimation.animationSteps[offsetIndex];
        return animationStep;
    }

    public addLightToAnimationLoop(lightID: BaseController['id'] | AnimationStepKey) {
        if (this.activeLoops.has(lightID)) return;
        this.associatedLightCount++;
        const animationID: AnimationStepKeys = this.isSingularAnimationLoop ? AnimationStepKey.ALL : lightID;
        this.initalizeAnimationID(animationID);
    }

    public removeLightFromAnimationLoop(lightID: BaseController['id']) {
        if (!this.activeLoops.has(lightID)) return;
        if (this.associatedLightCount > 0) this.associatedLightCount--;
        this.activeLoops.delete(lightID);
    }

    public tickAllActiveLoops() {
        this.activeLoops.forEach((value, key) => this.tickAnimation(key));
    }

    private tickAnimation(animationID: AnimationStepKeys) {
        if(this.associatedLightCount === 0) return;
        const activeAnimation = this.activeLoops.get(animationID);
        activeAnimation.currentStepIndex++;
        // console.log(activeAnimation.currentStepIndex, activeAnimation.animationSteps.length, activeAnimation.animationSteps[activeAnimation.currentStepIndex])
        if (activeAnimation.currentStepIndex < 0 || activeAnimation.currentStepIndex >= activeAnimation.animationSteps.length) this.generateAnimationSteps(animationID);
    }

    private generateAnimationSteps(animationID: AnimationStepKeys): void {
        const activeAnimation = this.activeLoops.get(animationID);

        const animationSteps: IAnimationColorStep[] = [];
        activeAnimation.currentStepIndex = 0;

        let previousSequenceEndStep: IAnimationColorStep = activeAnimation.previousLoopEndStep || { red: 0, green: 0, blue: 0, warmWhite: 0, coldWhite: 0 };
        this.initalizeAnimationID(animationID);

        for (const sequence of this.blueprintAnimationSequences) {
            if (Math.random() < sequence.skipChance) continue; //skip sequence if lights should be synced and skip chance is met
            const flatSequence = recursiveArrayToInt<IAnimationSequenceStep>(sequence);
            flatSequence.startColor = flatSequence.startColor || previousSequenceEndStep;
            const steps = calculateSequenceSteps(flatSequence);
            previousSequenceEndStep = steps[steps.length - 1];
            animationSteps.push(...steps);
        }

        activeAnimation.animationSteps = animationSteps;
        activeAnimation.previousLoopEndStep = previousSequenceEndStep;
    }

    private initalizeAnimationID(animationID: AnimationStepKeys) {
        if (!this.activeLoops.has(animationID)) {
            this.activeLoops.set(animationID, { currentStepIndex: -2, animationSteps: [], previousLoopEndStep: null, offsetDurationMS: this.currentAnimationOffsetDurationMS });
            this.currentAnimationOffsetDurationMS += this.lightOffsetDurationMS;
        }
    }

}


function calculateSequenceSteps(sequence: IAnimationSequenceStep): IAnimationColorStep[] {

    const animationSteps: IAnimationColorStep[] = [];
    const transitionFrames = sequence.transitionDurationMS / STEP_INTERVAL_MS;
    sequence.durationAtTargetMS = sequence.durationAtTargetMS || 0;
    const reverseTransitionFrames = sequence.reverseTransitionDurationMS / STEP_INTERVAL_MS;

    //calculate transition delta
    const transitionDelta = {};
    for (let color in sequence.targetColor) {
        transitionDelta[color] = (sequence.targetColor[color] - sequence.startColor[color]) / transitionFrames;
    }

    //calculate and add transition frames between start and target color
    for (let i = 0; i < transitionFrames; i++) {
        const step = {};
        for (let color in sequence.targetColor) {
            step[color] = interpolate(sequence.startColor[color], sequence.targetColor[color], i, transitionFrames, sequence.interpolationType);
        }
        animationSteps.push(step as IAnimationColorStep);
    }

    //calculate and add hold frames for target color
    let durationFrames = sequence.durationAtTargetMS / STEP_INTERVAL_MS;
    for (let i = 0; i < durationFrames; i++) {
        const step = {};
        for (let color in sequence.targetColor) {
            step[color] = sequence.targetColor[color];
        }
        animationSteps.push(step as IAnimationColorStep);
    }


    // calculate and add transition frames between target and start color
    for (let i = 0; i < reverseTransitionFrames; i++) {
        const step = {};
        for (let color in sequence.targetColor) {
            step[color] = interpolate(sequence.targetColor[color], sequence.startColor[color], i, reverseTransitionFrames, sequence.interpolationType);
        }
        animationSteps.push(step as IAnimationColorStep);
    }

    return animationSteps;
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

class AnimationManager {
    private lightMap: Map<BaseController['id'], { id: BaseController['id'], controller: BaseController }>;
    private animations: AnimationLoop[];
    private animationBlueprints: IAnimationBlueprint[];
    private startTime: number;
    time = 0

    constructor(controllers: BaseController[], animationBlueprints: IAnimationBlueprint[]) {
        this.lightMap = new Map<BaseController['id'], { id: BaseController['id'], controller: BaseController }>();
        controllers.forEach((controller) => this.lightMap.set(controller.id, { id: controller.id, controller }));

        // console.log(this.lightMap)
        this.animations = [];
        this.animationBlueprints = animationBlueprints;
        this.animationBlueprints.sort((a, b) => a.priority - b.priority);
    }

    public generateAnimationLoopFromBlueprint(animationBlueprint: IAnimationBlueprint) {

        const assignedLightsNames: string[] = Array.from(this.lightMap.values()).filter(light => light.controller.getAnimationList().includes(animationBlueprint.name)).map(light => light.id);

        const animation = new AnimationLoop(animationBlueprint, assignedLightsNames);
        this.animations.push(animation);
    }

    public addLightToAnimationLoop(controller: BaseController, animation: AnimationLoop) {
        animation.addLightToAnimationLoop(controller.id);
    }

    public removeLightFromAnimationLoop(controller: BaseController, animation: AnimationLoop) {
        animation.removeLightFromAnimationLoop(controller.id);

    }

    public startTicks() {
        this.startTime = process.hrtime()[0] * 1000 + process.hrtime()[1] / 1e6;
        this.tick();
    }

    private tick() {
        this.animations.forEach((animation) => {
            animation.tickAllActiveLoops();
        });

        this.tickLights();
        this.time += .04 // 25 fps
        const currentTime = process.hrtime();
        const elapsedTime = (currentTime[0] * 1000 + currentTime[1] / 1e6) - this.startTime; //elapsed time in ms
        this.startTime = currentTime[0] * 1000 + currentTime[1] / 1e6;
        if (elapsedTime >= STEP_INTERVAL_MS) {
            this.startTime = process.hrtime()[0] * 1000 + process.hrtime()[1] / 1e6; //reset startTime to current time
            setTimeout(this.tick.bind(this), STEP_INTERVAL_MS);
        } else {
            setTimeout(this.tick.bind(this), STEP_INTERVAL_MS - elapsedTime);
        }
    }

    private tickLights() {
        this.lightMap.forEach(async (light) => {
            if(!light.controller.manuallyControlled) return;
            //find the next animation in the animations array that this light has included in its animationNames array and which has a  non-zero value for the current step
            const nextAnimation = this.animations.find(animation => light.controller.hasAnimation(animation.name) && animation.getAnimationStep(light.id) !== undefined && Math.max(...Object.values(animation.getAnimationStep(light.id))) > 0);
            let currentStep;
            if (!nextAnimation) currentStep = { red: 100, green: 0, blue: 0, warmWhite: 0, coldWhite: 0 };
            else currentStep = nextAnimation.getAnimationStep(light.id);
            //round the values of the current step to integers
            for (const color in currentStep) {
                currentStep[color] = Math.round(currentStep[color]);
            }
            light.controller.setLightColor(currentStep);
        });
    }

}

export default class test {

    public startTest(controllers: BaseController[]) {
        const lights = [];

        for (const controller of controllers) {
            controller.appendAnimationList(['thunderStruck', 'rainbow'])
            lights.push(controller);
        }

        // console.log(lights, 'lights');

        const animationBlueprints = [thunderStruck, rainbow];
        const animationManager = new AnimationManager(lights, animationBlueprints);
        animationManager.generateAnimationLoopFromBlueprint(thunderStruck);
        animationManager.generateAnimationLoopFromBlueprint(rainbow);
        animationManager.startTicks();
    }



}