import { IProtoDevice, IDeviceState, IDeviceMetaData } from 'magichome-core';
/*----------------------[Constants]----------------------*/


export const DefaultDevice = {
    ipAddress: '',
    uniqueId: '',
    modelNumber: 'unknown',
}


/*----------------------[Device State]--------- -------------*/

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
    deviceMetaData: IDeviceMetaData
}

export interface IControllerInformation {
    displayName: string;
    lastSeenDate: number;
}

export interface IAnimationLoop {
    'name': string,
    'pattern': IAnimationFrame[],
    'accessoryOffsetMS': number,
}

export interface IAnimationFrame {
    'colorStart'?: IAnimationCommand,
    'colorTarget': IAnimationCommand,
    'transitionTimeMS': number | number[],
    'durationAtTargetMS'?: number | number[];
    'chancePercent': number;
}


export type IFailedDeviceProps = IProtoDevice & {
    latestScanTimestamp: number;
}
/*----------------------[Device Commands]----------------------*/

export interface IAnimationCommand {
    RGB?: IAnimationRGB;
    CCT?: IAnimationCCT;
    colorMask?: number;
}

export interface IAnimationRGB {
    red: number | number[]
    green: number | number[];
    blue: number | number[];
}

export interface IAnimationCCT {
    warmWhite: number | number[]
    coldWhite: number | number[];
}