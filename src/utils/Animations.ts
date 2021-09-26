import { BaseController } from '../DeviceControllers/BaseController';
import { ControllerGenerator } from '../ControllerGenerator';
import { ColorMasks, DefaultCommand, ICommandOptions, IDeviceCommand } from '../types';

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
    verifyRetries: 0,
    bufferMS: 100,
    timeoutMS: 0
}
class Animations {
    constructor(parameters) {}

    public animate(deviceList: BaseController[]) {
        let state = 0

        let duration = 1000;
        setInterval(() => {
            if (state > 4) state = 0;
            switch (state) {
                case 0:
                    this.fade(deviceList, { RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 } },
                        { RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 } }, duration, 20)
                    break;
                case 1:
                    this.fade(deviceList, { RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 } },
                        { RGB: { red: 0, green: 0, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 } }, duration, 20)
                    break;
                case 2:
                    this.fade(deviceList, { RGB: { red: 0, green: 0, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 } },
                        { RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 255 } }, duration, 20)
                    break;
                case 3:
                    this.fade(deviceList, { RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 255 } },
                        { RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 255, coldWhite: 0 } }, duration, 20)
                    break;
                case 4:
                    this.fade(deviceList, { RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 255, coldWhite: 0 } },
                        { RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 } }, duration, 20)
                    break;

            }
            state++;
        }, 2 * duration);
    }


    private async fade(deviceList: BaseController[], startCommand: IDeviceCommand, endCommand: IDeviceCommand, duration, interval) {

        const steps = duration / interval;
        const step_u = 1.0 / steps;
        let u = 0.0;
        const theInterval = setInterval(function () {
            if (u >= 1.0) {
                clearInterval(theInterval);
            }

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


