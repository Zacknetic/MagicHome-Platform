/// <reference types="node" />
import * as types from '../types';
export declare function checksum(buffer: Uint8Array): number;
export declare function clamp(value: number, min: number, max: number): number;
export declare function parseDeviceState(data: Buffer): types.IDeviceState;
export declare function parseJson<T>(value: string, replacement: T): T;
export declare function loadJson<T>(file: string, replacement: T): T;
export declare function delayToSpeed(delay: never): number;
export declare function speedToDelay(speed: never): number;
export declare function deviceNeedsPowerComand(discoveredDevice: types.IProtoDeviceProps, deviceQueryData: types.IDeviceQueriedProps): boolean;
