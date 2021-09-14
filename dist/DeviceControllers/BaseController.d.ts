import * as types from '../types';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class BaseController {
    protected readonly activeDevice: types.IDeviceProps;
    protected transport: any;
    protected deviceWriteStatus: any;
    protected newColorCommand: types.IDeviceCommand;
    protected bufferDeviceCommand: types.IDeviceCommand;
    protected deviceState: types.IDeviceState;
    protected lightStateTemporary: types.IDeviceState;
    constructor(activeDevice: types.IDeviceProps);
    setOn(value: boolean): void;
    setRed(value: number): Promise<void>;
    setGreen(value: number): void;
    setBlue(value: number): void;
    setWarmWhite(value: number): void;
    setColdWhite(value: number): Promise<void>;
    setAllValues(deviceCommand: types.IDeviceCommand): Promise<void>;
    processCommand(deviceCommand: types.IDeviceCommand): Promise<void>;
    writeStateToDevice(deviceCommand: types.IDeviceCommand, count?: number): Promise<string>;
    testValidState(deviceCommand: types.IDeviceCommand): Promise<boolean>;
    stateHasSoftEquality(deviceStateA: types.IDeviceCommand, deviceStateB: types.IDeviceCommand): boolean;
    overwriteLocalState(deviceCommand: types.IDeviceCommand): void;
    fetchState(): Promise<types.IDeviceState>;
    flashEffect(): void;
    prepareColorCommand(deviceCommand: types.IDeviceCommand): Promise<string>;
    send(command: any, useChecksum?: boolean, _timeout?: number): Promise<any>;
    cacheCurrentLightState(): void;
    restoreCachedLightState(): Promise<void>;
}
