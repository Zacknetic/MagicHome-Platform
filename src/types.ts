
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

export interface IDeviceDiscoveredProps {
    ipAddress: string;
    uniqueId: string;
    modelNumber: string;
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

export const DeviceWriteStatus = {
    ready: 'ready',
    busy: 'busy',
    pending: 'pending',
}

export const ColorMasks = {
    white: 0x0F,
    color: 0xF0,
    both: 0xFF,
}

export const PowerCommands = {
    COMMAND_POWER_ON: [0x71, 0x23, 0x0f],
    COMMAND_POWER_OFF: [0x71, 0x24, 0x0f],
}

export const DefaultCommand = {
    RGB: {
        red: 0,
        green: 0,
        blue: 0,
    },
    CCT: {
        warmWhite: 0,
        coldWhite: 0
    },
    colorMask: 0
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