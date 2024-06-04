import { ProtoDevice, DeviceState, DeviceMetaData } from 'magichome-core';
import { BaseController } from '../BaseController';
import { InterpolationType } from '../animation/animationUtils';

/*----------------------[Constants]----------------------*/


export const DefaultDevice = {
    ipAddress: '',
    uniqueId: '',
    modelNumber: 'unknown',
}


/*----------------------[Device State]--------- -------------*/


/**
 * Device API object
 * @param byteOrder - The order of the bytes in the command
 * @param description - A description of the device
 * @param hasColor - Whether the device has color
 * @param hasCCT - Whether the device has CCT
 * @param hasBrightness - Whether the device has brightness
 * @param isEightByteProtocol - Whether the device uses an 8 byte protocol
 * @param needsPowerCommand - Whether the device needs a power command
 * @param simultaneousCCT - Whether the device can handle CCT and RGB commands simultaneously
 */

export type DeviceAPI = {
    byteOrder: string[];
    description: string;
    hasColor: boolean;
    hasCCT: boolean;
    hasBrightness: boolean;
    isEightByteProtocol: boolean;
    needsPowerCommand?: boolean;
    simultaneousCCT: boolean;
}

export type FullDeviceInformation = {
    deviceAPI: DeviceAPI;
    protoDevice: ProtoDevice;
    deviceState: DeviceState;
    deviceMetaData: DeviceMetaData
}

export interface IControllerInformation {
    displayName: string;
    lastSeenDate: number;
}

export interface IColorHSV {
	hue: number;
	saturation: number;
	value: number;
}

export interface IColorTB {
	temperature: number;
	brightness: number;
}


export interface IAnimationLoop {
    name: string,
    pattern: IAnimationFrame[],
    accessoryOffsetMS: number,
}

export interface IAnimationFrame {
    colorStart?: IAnimationCommand,
    colorTarget: IAnimationCommand,
    transitionTimeMS: number | number[],
    durationAtTargetMS?: number | number[];
    chancePercent: number;
    reSyncMs?: number | number[];
}

export interface IAnimationColorRange {
    red: number | number[];
    green: number | number[];
    blue: number | number[];
    warmWhite: number | number[];
    coldWhite: number | number[];
}

export interface IAnimationColorStep {
    red: number;
    green: number;
    blue: number;
    warmWhite: number;
    coldWhite: number;
}

export interface IAnimationSequenceRange {
    startColor?: IAnimationColorRange;
    targetColor: IAnimationColorRange;
    transitionDurationMS: number | number[];
    durationAtTargetMS: number | number[];
    reverseTransitionDurationMS?: number | number[];
    interpolationType: InterpolationType;
    skipChance: number;
}

export interface IAnimationSequenceStep {
    startColor?: IAnimationColorStep;
    targetColor: IAnimationColorStep;
    transitionDurationMS: number;
    durationAtTargetMS: number;
    reverseTransitionDurationMS?: number;
    interpolationType: InterpolationType;
    skipChance: number;
}

export enum AnimationStepKey { ALL = "all" }
export type AnimationStepKeys = AnimationStepKey | BaseController["id"];

export interface IAnimationBlueprint {
    readonly name: string;
    readonly priority: number;
    readonly syncSequenceTimings: boolean;
    readonly syncSequenceColor: boolean;
    readonly lightOffsetDurationMS: number;
    readonly animationSequences: IAnimationSequenceRange[];
}

export type IFailedDeviceProps = ProtoDevice & {
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