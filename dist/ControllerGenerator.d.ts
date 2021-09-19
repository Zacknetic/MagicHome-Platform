import * as types from './types';
export declare class ControllerGenerator {
    activeDevices: Map<string, types.IDeviceInformation>;
    inactiveDeviceQueue: types.IFailedDeviceProps[];
    constructor(activeDevices?: Map<string, types.IDeviceInformation>, inactiveDeviceQueue?: types.IFailedDeviceProps[]);
    discoverControllers(): Promise<Map<string, types.IDeviceInformation>>;
    createCustomControllers(customCompleteDevices: types.CustomCompleteDeviceProps[] | types.CustomCompleteDeviceProps): Promise<Map<string, types.IDeviceInformation>>;
    private createCustomController;
    private discoverDevices;
    private createController;
    getState(ipAddress: string, _timeout?: number): Promise<types.IDeviceState | null>;
    private assignController;
    private generateNewDevice;
    getActiveDevices(uniqueId?: string): Map<string, types.IDeviceInformation> | types.IDeviceInformation;
    sendDirectCommand(directCommand: types.DirectCommand, commandOptions?: types.ICommandOptions): Promise<void>;
}
