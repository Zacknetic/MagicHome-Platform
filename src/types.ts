import { IColorCCT, IColorRGB, ICommandOptions, IDeviceCommand, IDeviceState } from 'magichome-core';

/*----------------------[Constants]----------------------*/


export const DefaultDevice = {
    ipAddress: '',
    uniqueId: '',
    modelNumber: 'unknown',
}


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
    deviceState: IDeviceState;
}

export interface IControllerInformation {
    displayName: string;
    restartsSinceSeen: number;
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

export interface IAnimationCommand {
    RGB?: IColorRGB;
    CCT?: IColorCCT;
    colorMask?: number;
}