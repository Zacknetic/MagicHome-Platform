
export interface IDeviceQueriedProps {
    deviceParameters: IDeviceParameters;
    initialDeviceState: IDeviceState;
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

export interface IReadWriteStatus {
    deviceWriteStatus: string;
    deviceReadInProgress: boolean;
}

export type IDeviceWriteStatus = {
    ready: 'ready',
    busy: 'busy',
    pending: 'pending',
}

export type ColorMasks = {
    white: 0x0F,
    color: 0xF0,
    both: 0xFF,
}

export interface IDeviceDiscoveredProps {
    ipAddress: string;
    uniqueId: string;
    modelNumber: string;
}

export type IFailedDeviceProps = IDeviceDiscoveredProps & {
    latestScanTimestamp: number;
}

export interface IDeviceState {
    LED: IDeviceCommand;
    controllerHardwareVersion?: number;
    controllerFirmwareVersion?: number;
    rawData: Buffer;
}

export type IDeviceProps = IDeviceQueriedProps & IDeviceDiscoveredProps & {
    uniqueId: string;
    cachedIPAddress: string;
    displayName: string;
    restartsSinceSeen: number;
    lastKnownState?: IDeviceState;
    lightStateTemporary?: IDeviceState;
    activeController?: Object;
}

export interface IDeviceCommand {
    isOn?: boolean;
    RGB?: IColorRGB;
    CCT?: IColorCCT;
    colorMask?: number;
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