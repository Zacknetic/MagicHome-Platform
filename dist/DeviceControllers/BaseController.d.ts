import * as types from '../types';
export declare class BaseController {
    protected protoDevice: types.IProtoDevice;
    protected transport: any;
    protected deviceWriteStatus: any;
    protected devicePowerCommand: any;
    protected newColorCommand: types.IDeviceCommand;
    protected bufferDeviceCommand: types.IDeviceCommand;
    protected deviceStateTemporary: types.IDeviceState;
    protected deviceState: types.IDeviceState;
    protected deviceInformation: types.IDeviceInformation;
    protected deviceAPI: types.IDeviceAPI;
    constructor(protoDevice: types.IProtoDevice);
    setOn(value: boolean, verifyState?: boolean): Promise<string>;
    setRed(value: number, verifyState?: boolean): Promise<types.IDeviceState>;
    setGreen(value: number, verifyState?: boolean): Promise<types.IDeviceState>;
    setBlue(value: number, verifyState?: boolean): Promise<types.IDeviceState>;
    setWarmWhite(value: number, verifyState?: boolean): Promise<types.IDeviceState>;
    setColdWhite(value: number, verifyState?: boolean): Promise<types.IDeviceState>;
    setAllValues(deviceCommand: types.IDeviceCommand, verifyState?: boolean): Promise<types.IDeviceState>;
    private prepareCommand;
    private processCommand;
    private writeStateToDevice;
    private testValidState;
    private stateHasSoftEquality;
    private overwriteLocalState;
    private prepareColorCommand;
    fetchState(): Promise<types.IDeviceState>;
    private queryState;
    private send;
    cacheCurrentLightState(): void;
    restoreCachedLightState(verifyState?: boolean): Promise<types.IDeviceState>;
    private assignAPI;
    reInitializeController(deviceAPI?: types.IDeviceAPI): Promise<unknown>;
    private needsPowerComand;
    getCachedDeviceInformation(): types.IDeviceInformation;
    getCachedState(): types.IDeviceState;
}
