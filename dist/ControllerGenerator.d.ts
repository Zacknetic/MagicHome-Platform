import * as types from './types';
import { BaseController } from './DeviceControllers/BaseController';
export declare class ControllerGenerator {
    activeDevices: Map<string, BaseController>;
    inactiveDeviceQueue: types.IFailedDeviceProps[];
    constructor(activeDevices?: Map<string, BaseController>, inactiveDeviceQueue?: types.IFailedDeviceProps[]);
    discoverControllers(): Promise<Map<string, BaseController>>;
    private discoverDevices;
    createCustomControllers(customCompleteDevices: types.CustomCompleteDeviceProps[] | types.CustomCompleteDeviceProps): Promise<Map<string, BaseController>>;
    private createCustomController;
    private instantiateController;
    private generateNewDevice;
    getActiveDevices(uniqueId?: string): Map<string, BaseController> | BaseController;
    sendDirectCommand(directCommand: types.DirectCommand, commandOptions?: types.ICommandOptions): Promise<void>;
}
