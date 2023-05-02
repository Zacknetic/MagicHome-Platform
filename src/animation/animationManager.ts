import { BaseController, IAnimationBlueprint } from "..";
import { AnimationLoop } from "./animationLoop";

export class AnimationManager {
    private lightMap: Map<BaseController['id'], { id: BaseController['id'], controller: BaseController }>;
    private animations: AnimationLoop[];
    private animationBlueprints: IAnimationBlueprint[];
    private startTime: number;
    private STEP_INTERVAL_MS: number;
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