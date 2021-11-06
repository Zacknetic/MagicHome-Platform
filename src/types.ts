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
    INTRA_MESSAGE_TIME: 0,
    POWER_WAIT_TIME: 0,
    STATE_RETRY_WAIT_TIME: 0,
}

export const EventNumber = new Map([
    [-5, 'incorrect device state, no retries requested'],
    [-4, 'incorrect device state, insufficient retries'],
    [-3, 'incorrect device state, sufficient retries'],
    [-2, 'cannot write, device busy'],
    [-1, 'unknown failure'],
    [0, 'task failed successfully'],
    [1, 'device responded with valid state']
]);


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

/**
 * DeviceAPI
 */
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
    LEDState: ILEDState;
    controllerHardwareVersion?: number;
    controllerFirmwareVersion?: number;
    rawData?: Buffer;
}

export interface ICustomCompleteDeviceProps {
    deviceAPI?: IDeviceAPI,
    protoDevice?: ICustomProtoDevice,
    deviceState?: IDeviceState
}

export interface IAnimationLoop {
    'name': string,
    'pattern': IAnimationFrame[],
    'accessories': string[],
    'accessoryOffsetMS': number,
}

export interface IAnimationFrame {
    'colorStart'?: IAnimationCommand,
    'colorTarget': IAnimationCommand,
    'transitionTimeMS': number | number[],
    'durationAtTargetMS'?: number | number[];
    'chancePercent': number;
}

export type DirectCommand = IDeviceCommand & ICustomProtoDevice & IDeviceAPI;

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

export interface ILEDState {
    isOn?: boolean;
    RGB?: IColorRGB;
    CCT?: IColorCCT;
}

export interface IAnimationCommand {
    RGB?: IColorRGB;
    CCT?: IColorCCT;
    colorMask?: number;
}

export interface ICommandOptions {
    timeoutMS?: number;
    bufferMS?: number;
    colorMask?: number;
    remainingRetries?: number;
    maxRetries?: number;
    isAnimationFrame?: boolean;
    isPowerCommand?: boolean;
}

export const CommandDefaults: ICommandOptions = {
    timeoutMS: 50,
    bufferMS: 20,
    colorMask: null,
    remainingRetries: 5,
}

export interface IColorRGB {
    red?: number;
    green?: number;
    blue?: number;
}

export interface IColorCCT {
    warmWhite?: number;
    coldWhite?: number;
}

export interface ICommandResponse {
    eventNumber: number;
    deviceResponse: IDeviceCommand | string;
}