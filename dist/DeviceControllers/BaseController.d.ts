import * as types from '../types';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class BaseController {
    protected readonly deviceInformation: types.IDeviceInformation;
    protected transport: any;
    protected deviceWriteStatus: any;
    protected devicePowerCommand: any;
    protected newColorCommand: types.IDeviceCommand;
    protected bufferDeviceCommand: types.IDeviceCommand;
    protected deviceStateTemporary: types.IDeviceState;
    protected deviceState: types.IDeviceState;
    constructor(deviceInformation: types.IDeviceInformation);
    setOn(value: boolean): Promise<void>;
    setRed(value: number): Promise<void>;
    setGreen(value: number): Promise<void>;
    setBlue(value: number): Promise<void>;
    setWarmWhite(value: number): Promise<void>;
    setColdWhite(value: number): Promise<void>;
    setAllValues(deviceCommand: types.IDeviceCommand, verifyState?: boolean): Promise<void>;
    processCommand(deviceCommand: types.IDeviceCommand, verifyState?: boolean): Promise<void>;
    writeStateToDevice(deviceCommand: types.IDeviceCommand, verifyState?: boolean, count?: number): Promise<string>;
    testValidState(deviceCommand: types.IDeviceCommand): Promise<{
        isValid: any;
        deviceState: any;
    }>;
    stateHasSoftEquality(deviceStateA: types.IDeviceCommand, deviceStateB: types.IDeviceCommand): boolean;
    overwriteLocalState(deviceCommand: types.IDeviceCommand, deviceState: types.IDeviceState): void;
    fetchState(): Promise<types.IDeviceState>;
    flashEffect(): void;
    prepareColorCommand(deviceCommand: types.IDeviceCommand): Promise<string>;
    send(command: any, useChecksum?: boolean, _timeout?: number): Promise<any>;
    cacheCurrentLightState(): void;
    restoreCachedLightState(): Promise<void>;
}
