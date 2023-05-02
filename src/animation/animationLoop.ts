import { AnimationStepKey, AnimationStepKeys, BaseController, IAnimationBlueprint, IAnimationColorStep, IAnimationSequenceRange, IAnimationSequenceStep } from "..";
import { calculateSequenceSteps, recursiveArrayToInt } from "./animationUtils";


export class AnimationLoop {
    readonly name: string;
    readonly priority: number;
    readonly syncSequenceTimings: boolean;
    readonly syncSequenceColor: boolean;
    private lightOffsetDurationMS: number;
    readonly blueprintAnimationSequences: IAnimationSequenceRange[];
    readonly isSingularAnimationLoop: boolean;
    private currentAnimationOffsetDurationMS: number;
    private activeLoops: Map<AnimationStepKeys, { currentStepIndex: number, animationSteps: IAnimationColorStep[], previousLoopEndStep: IAnimationColorStep; offsetDurationMS: number; }>
    private STEP_INTERVAL_MS: number;
    associatedLightCount: any;


    constructor(animationBlueprint: IAnimationBlueprint, lightIDs: Array<BaseController['id']>, STEP_INTERVAL_MS: number) {
        this.name = animationBlueprint.name;
        this.priority = animationBlueprint.priority;
        this.syncSequenceTimings = animationBlueprint.syncSequenceTimings;
        this.syncSequenceColor = animationBlueprint.syncSequenceColor;
        this.lightOffsetDurationMS = animationBlueprint.lightOffsetDurationMS;
        this.blueprintAnimationSequences = animationBlueprint.animationSequences;
        this.isSingularAnimationLoop = animationBlueprint.syncSequenceTimings && animationBlueprint.syncSequenceColor; //if syncSequenceTimings is false, then the animation loop is singular else test syncSequenceColor to determine if the animation loop is singular
        this.STEP_INTERVAL_MS = STEP_INTERVAL_MS;
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

    public getAnimationStep(lightID: BaseController['id'], STEP_INTERVAL_MS: number): IAnimationColorStep {
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
            const steps = calculateSequenceSteps(flatSequence, this.STEP_INTERVAL_MS);
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