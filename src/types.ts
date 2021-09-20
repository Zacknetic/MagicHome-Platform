/*----------------------[Device State]----------------------*/
export interface IProtoDevice {
    ipAddress: string;
    uniqueId: string;
    modelNumber: string;
}

export interface ICustomProtoDevice {
    ipAddress: string;
    uniqueId?: string;
    modelNumber?: string;
}

export interface IDeviceAPI {
    description: string;
    simultaneousCCT: boolean;
    hasColor: boolean;
    hasCCT: boolean;
    hasBrightness: boolean;
    isEightByteProtocol: boolean;
    needsPowerCommand?: boolean;
}

export interface IDeviceInformation {
    deviceAPI: IDeviceAPI;
    protoDevice: IProtoDevice;
    deviceState: IDeviceState
}

export interface IControllerInformation {
    displayName: string;
    restartsSinceSeen: number;
}

export interface IDeviceState {
    LED: IDeviceCommand;
    controllerHardwareVersion?: number;
    controllerFirmwareVersion?: number;
    rawData: Buffer;
}

// export interface IDeviceQueriedProps {
//     deviceParameters: IDeviceAPI;
//     initialDeviceState: IDeviceState;
// }

// export interface IReadWriteStatus {
//     deviceWriteStatus: string;
//     deviceReadInProgress: boolean;
//     devicePowerCommand: boolean;
// }

export interface CustomCompleteDeviceProps {
    deviceAPI?: IDeviceAPI,
    protoDevice?: ICustomProtoDevice
}

export type DirectCommand = IDeviceCommand & ICustomProtoDevice;

export type IFailedDeviceProps = IProtoDevice & {
    latestScanTimestamp: number;
}
/*----------------------[Device Commands]----------------------*/
export interface IDeviceCommand {
    isOn?: boolean;
    RGB?: IColorRGB;
    CCT?: IColorCCT;
    colorMask?: number;
}

export interface ICommandOptions {
    timeoutMS?: number;
    deviceApi?: IDeviceAPI;
    verifyState?: boolean;
    colorMask?: typeof ColorMasks;
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

/*----------------------[Constants]----------------------*/
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
    isOn: false,
    RGB: {
        red: 0,
        green: 0,
        blue: 0,
    },
    CCT: {
        warmWhite: 0,
        coldWhite: 0
    }
}

export const DefaultDevice = {
    ipAddress: '',
    uniqueId: '',
    modelNumber: 'unknown',
}

export const OPTIMIZATION_SETTINGS = {
    INTRA_MESSAGE_TIME: 10,
    POWER_WAIT_TIME: 100,
    STATE_RETRY_WAIT_TIME: 300,
}