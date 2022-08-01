import {EventNumber, IProtoDevice, ICompleteDevice, COMMAND_TYPE, ICommandOptions, IDeviceCommand, IColorRGB, IColorCCT, IDeviceResponse, IDeviceState, IDeviceMetaData, ITransportResponse} from 'magichome-core';
/*----------------------[Constants]----------------------*/


export const DefaultDevice = {
    ipAddress: '',
    uniqueId: '',
    modelNumber: 'unknown',
}


/*----------------------[Device State]----------------------*/


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
    byteOrder: any;
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
    deviceState: IDeviceState;
}

export interface IControllerInformation {
    displayName: string;
    lastSeenDate: number;
}

export interface ICustomCompleteDevice {
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

export interface IAnimationCommand {
    RGB?: IColorRGB;
    CCT?: IColorCCT;
    colorMask?: number;
}