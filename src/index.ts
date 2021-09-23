export { ControllerGenerator } from './ControllerGenerator';
export { ICustomProtoDevice, CustomCompleteDeviceProps, DirectCommand, ICommandOptions, IDeviceAPI } from './types'
import { BaseController } from './DeviceControllers/BaseController';
import { ControllerGenerator } from './ControllerGenerator';

const controllerGenerator = new ControllerGenerator();
const deviceList = [];

async function makeControllers() {
    return new Promise<BaseController[]>(async (resolve, reject) => {


        const controllers: Map<string, BaseController> = await controllerGenerator.discoverControllers();

        let input = '';

        let count = 1;

        for (const [key, activeDevice] of Object.entries(controllers)) {
            // if(activeDevice.deviceAPI.description === 'RGBWW Simultaneous'){
            deviceList[count] = activeDevice;
            count++;
            //  }


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
                    controller.setRed(1);
                    break;
                case 1:
                    controller.setGreen(100)
                    break;
                case 2:
                    controller.setBlue(20)
                    break;
                default:
                    break;
            }

        })
        state++;


    }, 5000);
}

function main() {
    makeControllers();

}

main();