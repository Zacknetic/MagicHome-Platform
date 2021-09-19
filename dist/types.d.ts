/// <reference types="node" />
export interface IProtoDeviceProps {
    ipAddress: string;
    uniqueId: string;
    modelNumber: string;
}
export interface ICustomProtoDevice {
    ipAddress: string;
    uniqueId?: string;
    modelNumber?: string;
}
export interface IDeviceParameters {
    description: string;
    simultaneousCCT: boolean;
    hasColor: boolean;
    hasCCT: boolean;
    hasBrightness: boolean;
    isEightByteProtocol: boolean;
    needsPowerCommand?: boolean;
}
export declare type IDeviceInformation = IDeviceQueriedProps & IProtoDeviceProps & {
    uniqueId: string;
    cachedIPAddress: string;
    displayName: string;
    restartsSinceSeen: number;
    deviceState?: IDeviceState;
    deviceStateTemporary?: IDeviceState;
};
export interface IDeviceState {
    LED: IDeviceCommand;
    controllerHardwareVersion?: number;
    controllerFirmwareVersion?: number;
    rawData: Buffer;
}
export interface IDeviceQueriedProps {
    deviceParameters: IDeviceParameters;
    initialDeviceState: IDeviceState;
}
export interface IReadWriteStatus {
    deviceWriteStatus: string;
    deviceReadInProgress: boolean;
    devicePowerCommand: boolean;
}
export interface CustomCompleteDeviceProps {
    deviceParameters?: IDeviceParameters;
    protoDevice?: ICustomProtoDevice;
}
export declare type DirectCommand = IDeviceCommand & ICustomProtoDevice;
export declare type IFailedDeviceProps = IProtoDeviceProps & {
    latestScanTimestamp: number;
};
export interface IDeviceCommand {
    isOn?: boolean;
    RGB?: IColorRGB;
    CCT?: IColorCCT;
    colorMask?: number;
}
export interface ICommandOptions {
    timeoutMS?: number;
    deviceParameters: IDeviceParameters;
    verifyState?: boolean;
}
export interface IColorRGB {
    red?: number;
    green?: number;
    blue?: number;
}
export interface IColorCCT {
    cctValue?: number;
    warmWhite?: number;
    coldWhite?: number;
}
export declare const DeviceWriteStatus: {
    ready: string;
    busy: string;
    pending: string;
};
export declare const ColorMasks: {
    white: number;
    color: number;
    both: number;
};
export declare const PowerCommands: {
    COMMAND_POWER_ON: number[];
    COMMAND_POWER_OFF: number[];
};
export declare const DefaultCommand: {
    isOn: boolean;
    RGB: {
        red: number;
        green: number;
        blue: number;
    };
    CCT: {
        warmWhite: number;
        coldWhite: number;
    };
    colorMask: number;
};
export declare const DefaultDevice: {
    ipAddress: string;
    uniqueId: string;
    modelNumber: string;
};
export declare const OPTIMIZATION_SETTINGS: {
    INTRA_MESSAGE_TIME: number;
    POWER_WAIT_TIME: number;
    STATE_RETRY_WAIT_TIME: number;
};
