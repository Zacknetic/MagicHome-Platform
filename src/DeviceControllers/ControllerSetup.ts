import { BaseController } from "./BaseController";
class ControllerSetup extends BaseController {
    public async initializeController() {
        return new Promise((resolve) => {
          this.transport = new Transport(this.protoDevice.ipAddress);
          resolve(this.fetchState());
        }).then(() => {
          return new Promise((resolve) => {
            if (!this.deviceAPI) {
              resolve(this.assignAPI());
            } else {
              resolve('Device API already provided')
            }
          })
        }).then(() => {
          return new Promise((resolve) => {
            this.needsPowerComand();
            this.deviceWriteStatus = ready;  
            resolve('Successfully determined if device needs power command');
          })
        }).catch(error => {
          console.log(error);
        });
      }
}