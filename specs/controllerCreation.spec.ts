import { ControllerGenerator } from "../src/core/controllerGenerator";
// import { cctColorWave, cctRgbTest, cctWave, colorTest, colorWave, fireworks, hellStruck, thunderStruck } from '../animation/animationLibrary'
// const deviceList = [];
// import ChatGPTAnimation from '../utils/chatGPTAnimation';
// import { DeviceInterface } from '../DeviceInterface'
// import { ICommandOptions, ICommandResponse, IDeviceCommand } from '../types';

import { BaseController } from "../src/core/baseController";
import { DeviceCommand } from "magichome-core";
// import { IAnimationLoop } from '../utils/types';
// import { sleepTimeout } from 'magichome-core/dist/utils/miscUtils';
// import { Console } from 'console';

// import * as types from '../types'

const controllerGenerator = new ControllerGenerator();

// let deviceBundles: DeviceBundle[];
// let baseControllers: BaseController[] = [];

describe("Test the scan function for DeviceDiscovery.ts", function () {
  this.beforeAll(async function () {
    try {
      const ret = await controllerGenerator.getDevices();
      // if (ret.length != protoDevices.length) // throw new Error("Every proto-device did not retrieve meta-data successfully");
    } catch (error) {
      console.error(error);
      return;
    }
  });
  afterEach((done) => {
    setTimeout(done, 100);
  });

  // it('Should retrieve meta-data on each device', async function () {

  //     const ret = await controllerGenerator.discoverDeviceBundles();
  //     deviceBundles = ret;
  //     console.log("deviceBundles", deviceBundles)

  // })

  // it('Should create a controller for each device', async function () {
  //     try {

  //         const ret = await controllerGenerator.getDevices();
  //         // if (ret.length != protoDevices.length) // throw new Error("Every proto-device did not retrieve meta-data successfully");
  //         baseControllers = ret;
  //     } catch (error) {
  //         console.log(error)
  //         return
  //     }
  // })
  it("turn on a light", async function () {
    // for(const [_key, value] of baseControllers) {
    //     value.setLED({ isOn: true, RGB: { red: 255, green: 0, blue: 25 }, CCT: { warmWhite: 1, coldWhite: 1 }})
    // }
    const baseControllers = await controllerGenerator.getDevices();
    // console.log("baseControllers", baseControllers);
    //iterate through the controllers and perform the action if the key is either of the two
    for (const [_key, value] of baseControllers) {
      if (_key == "5CCF7FF72822") {
        value.setLED({
          isOn: true,
          RGB: { red: 0, green: 255, blue: 0 },
          CCT: { warmWhite: 0, coldWhite: 0 },
        });
      }
 

    // if (
    //   baseControllers.has("DC4F22CF7C31") ||
    //   baseControllers.has("2CF432B7D7C5")
    // ) {
    //   // const a = baseControllers.filter((controller: BaseController) => {
    //   //     return controller.getCachedDeviceInformation().protoDevice.uniqueId = "DC4F22CF7C31";
    //   // })

    //   const controller: BaseController | undefined =
    //     baseControllers.get("DC4F22CF7C31");
    //   const controllerB;
    //   if (!controller) throw new Error("No controller found");
    //   const command: DeviceCommand = {
    //     isOn: true,
    //     RGB: { red: 0, green: 255, blue: 0 },
    //     CCT: { warmWhite: 100, coldWhite: 255 },
    //   };
    //   await controller.setLED(command);
    // } else {
    //   console.log("No controller found");
    }
  });

  // it('make colors', function () {

  //     try {
  //         if (baseControllers == undefined) return false;

  //         const onlineDevices = baseControllers.filter((controller: BaseController) => {
  //             // return controller.getCachedDeviceInformation().protoDevice.uniqueId == 'DC4F22CF7C31'
  //             // return controller.getCachedDeviceInformation().protoDevice.uniqueId == '2CF432B7D7C5'

  //             return true;

  //             // controller.getCachedDeviceInformation().deviceAPI

  //             // return controller.getCachedDeviceInformation().protoDevice.ipAddress == '192.168.1.7'

  //             // return controller.getCachedDeviceInformation().deviceState.isOn;

  //         });

  //         // console.log(onlineDevices[0].getCachedDeviceInformation().deviceAPI)
  //         // console.log("ONLINE DEVICES", onlineDevices)
  //         if (typeof onlineDevices == 'undefined' || !onlineDevices || onlineDevices.length < 1) {

  //             return false;
  //         }
  //         // const commandOptions: ICommandOptions = { waitForResponse: false, maxRetries: 5, remainingRetries: 5, commandType: COMMAND_TYPE.COLOR_COMMAND, timeoutMS: 50, isEightByteProtocol: false, colorAssist: true};
  //         // const deviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xFF };

  //         chatGPTAnimation.startTest(onlineDevices);
  //         // onlineDevices.forEach(async (controller: BaseController) => {

  //         //     // await controller.setAllValues(deviceCommand).then((res) => {
  //         //     //     console.log("res", res)
  //         //     // }).catch((err) => {
  //         //     //     console.log("ERROR", err)
  //         //     // });
  //         //     // controller.fetchState(1000);

  //         // });

  //         // animationController = new AnimationController()
  //         // animationController.animateAsynchronously(onlineDevices, hellStruck)
  //         // await sleepTimeout(200000);
  //         // animationController.clearAnimations();
  //     } catch (error) {
  //         console.log(error)
  //         return;
  //     }
  // })
});
