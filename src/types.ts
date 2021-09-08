
export interface IDeviceQueriedProps {
    lightParameters: ILightParameters;
    lightState: ILightState;
}

export interface ILightParameters {
    controllerLogicType: ControllerTypes;
    description: string;
    simultaneousCCT: boolean;
    hasColor:  boolean;
    hasCCT:  boolean;
    hasBrightness: boolean;
}

export enum ControllerTypes {
    RGBWStrip = 'RGBWStrip',
    RGBWWStrip = 'RGBWWStrip',
    CCTStrip = 'CCTStrip',
    DimmerStrip = 'DimmerStrip',
    GRBStrip = 'GRBStrip',
    RGBWWBulb = 'RGBWWBulb',
    RGBWBulb = 'RGBWBulb',
    Switch = 'Switch',
    RGBStrip = 'RGBStrip'
}

export interface IDeviceDiscoveredProps {
    ipAddress: string;
    uniqueId: string;
    modelNumber: string;
}

export type IFailedDeviceProps = IDeviceDiscoveredProps & {
    latestScanTimestamp: number;
}

export interface ILightState {
    isOn: boolean;
    RGB: IColorRGB;
    HSL?: IColorHSL;
    whiteValues:  IWhites;
    brightness?: number;
    colorTemperature?: number;
    controllerHardwareVersion?: number;
    controllerFirmwareVersion?: number;
    rawData?: Buffer;
}

export type IDeviceProps = IDeviceQueriedProps & {
    UUID: string;
    cachedIPAddress: string;
    displayName: string;
    restartsSinceSeen: number;
    lastKnownState?: ILightState;
}

export interface IColorRGB {
    red: number; 
    green: number; 
    blue:number;
}

export interface IColorHSL {
    hue: number; 
    saturation: number; 
    luminance: number;
}

export interface IWhites {
    warmWhite: number; 
    coldWhite: number; 
}