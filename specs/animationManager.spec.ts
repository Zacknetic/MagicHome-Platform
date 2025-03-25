// // import { rainbow, raining, thunderStruck } from '../animation/animationLibrary';
// // import { BaseController } from '../BaseController';
// // import { ICompleteDevice } from '..';
// // import { AnimationManager } from '../animation/animationManager';
// // const controllerGenerator = new ControllerGenerator();

// import { rainbow, thunderStruck } from "../src/animation/animationLibrary";
// import { AnimationManager } from "../src/animation/animationManager";
// import { ControllerGenerator } from "../src/core/controllerGenerator";

// // let onlineDevices;
// const controllerGenerator = new ControllerGenerator();
// const lights: any[] = [];
// async function generateControllers() {
//   const baseControllers = await controllerGenerator.getDevices();
//   //iterate through the controllers and perform the action if the key is either of the two
//   for (const [_key, value] of baseControllers) {
//     // if (_key == "DC4F22CF7C31" || _key == "2CF432B7D7C5") {
//       lights.push(value);
//     // }
//   }
// }

// describe("Test the AnimationManager class", function () {
//   it("Should start ticks for AnimationManager", async function () {
//     await generateControllers();
//     const animationBlueprints = [rainbow, thunderStruck];
//     const animationManager = AnimationManager.getInstance(
//       lights,
//       animationBlueprints
//     );
//     lights.forEach((light) => {
//       animationManager.addLightToAnimationLoop(light, animationBlueprints);
//       animationBlueprints.forEach((animationBlueprint) => {
//         light.appendAnimationList(animationBlueprint.name);
//       });
//     });
//     animationManager.activateAnimationLoopByName(["rainbow", "thunderStruck"]);

//     setTimeout(() => {
//       animationManager.deactivateAnimationLoopByName([
//         "rainbow",
//         "thunderStruck",
//       ]);
//     }, 240000);
//     // Add your custom logic to check if the ticks have started successfully
//   });

//   //     before(async () => {
//   //         await generateControllers();

//   //     });

//   //     afterEach(done => {
//   //         setTimeout(done, 100);
//   //     });

//   //     it('Should have online devices', function () {
//   //         expect(onlineDevices.length).to.be.greaterThan(0);
//   //     });

//   //     it('Should create AnimationManager with the given lights and animationBlueprints', function () {
//   //         const lights = onlineDevices;
//   //         const animationManager = AnimationManager.getInstance(lights, animationBlueprints);
//   //         expect(animationManager).to.be.instanceOf(AnimationManager);
//   //     });

//   //     it('Should have lights with thunderStruck and rainbow animations', function () {
//   //         onlineDevices.forEach(controller => {
//   //             expect(controller.getAnimationList()).to.include.members(['thunderStruck', 'rainbow']);
//   //         });
//   //     });
// });
