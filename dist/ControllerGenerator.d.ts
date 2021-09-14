import * as types from './types';
export declare class ControllerGenerator {
    activeDevices: Map<string, types.IDeviceProps>;
    inactiveDeviceQueue: types.IFailedDeviceProps[];
    constructor(activeDevices?: Map<string, types.IDeviceProps>, inactiveDeviceQueue?: types.IFailedDeviceProps[]);
    createControllers(): Promise<Map<string, types.IDeviceProps>>;
    discoverDevices(): Promise<types.IDeviceDiscoveredProps[] | null>;
    createController(discoveredDevice: types.IDeviceDiscoveredProps): Promise<void>;
    getState(ipAddress: any, _timeout?: number): Promise<types.IDeviceState | null>;
    assignController(initialState: types.IDeviceState): Promise<types.IDeviceQueriedProps | null>;
    generateNewDevice(discoveredDevice: types.IDeviceDiscoveredProps, deviceQueryData: types.IDeviceQueriedProps): Promise<types.IDeviceProps | null>;
}
