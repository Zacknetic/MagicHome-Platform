export { ControllerGenerator } from './ControllerGenerator';
export { ICustomProtoDevice, CustomCompleteDeviceProps, DirectCommand, ICommandOptions, IDeviceAPI } from './types'
import { BaseController } from './DeviceControllers/BaseController';
import { ControllerGenerator } from './ControllerGenerator';

const controllerGenerator = new ControllerGenerator();
const deviceList = [];

async function makeControllers() {
    return new Promise<BaseController[]>(async (resolve, reject) => {

        const controllers: Map<string, BaseController> = await controllerGenerator.discoverControllers();
      
        let count = 1;
        for (const [key, activeDevice] of Object.entries(controllers)) {
            try {
                // console.log(activeDevice.protoDevice.uniqueId)
                //if (activeDevice.protoDevice.uniqueId === 'DC4F22E192D0') {
                    deviceList[count] = activeDevice;
                    count++;
               // }
            } catch (error) {
                console.log(error, activeDevice)
            }


        }
        await animate()
    })
    // const refreshRate = 1000 / 60;
    // const maxXPosition = 255;
    // let speedX = 1;
    // let positionX = 0;

    // setInterval(() => {
    //   positionX = positionX + speedX;
    //   if (positionX > maxXPosition || positionX < 0) {
    //     speedX = speedX * (-1);
    //   }
    //   controller.setRed(positionX, false);
    // }, refreshRate);


}

let state = 0

function animate() {
    setInterval(() => {
        if (state > 2) state = 0;
        console.log(state)
        deviceList.forEach(async (controller) => {

            switch (state) {
                case 0:
                    controller.setRed(1, {timeoutMS: 10, bufferMS: 0, verifyRetries: 0});
                    break;
                case 1:
                    controller.setGreen(1, {timeoutMS: 10, bufferMS: 0, verifyRetries: 0});
                    break;
                case 2:
                    controller.setBlue(1, {timeoutMS: 10, bufferMS: 0, verifyRetries: 0});
                    break;
                default:
                    break;
            }

        })
        state++;


    }, 50);
}

function main() {
    makeControllers();

}

main();