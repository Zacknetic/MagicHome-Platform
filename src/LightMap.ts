import { ILightParameters, ControllerTypes } from './types';

const lightTypesMap: Map<number, ILightParameters> = new Map([
  [
    0x04,
    {
      controllerLogicType: ControllerTypes.RGBWStrip,
      description: 'RGBW Simultaneous',
      simultaneousCCT: true,
      hasColor: true,
      hasCCT: false,
      hasBrightness: true,
    },
  ],
  [
    0x06,
    {
      controllerLogicType: ControllerTypes.RGBWStrip,
      description: 'RGBW Simultaneous',
      simultaneousCCT: true,
      hasColor: true,
      hasCCT: false,
      hasBrightness: true,
    },
  ],
  [
    0x07,
    {
      controllerLogicType: ControllerTypes.RGBWWStrip,
      description: 'RGBWW Simultaneous',
      simultaneousCCT: true,
      hasColor: true,
      hasCCT: false,
      hasBrightness: true,
    },
  ],
  [
    0x09,
    {
      controllerLogicType: ControllerTypes.CCTStrip,
      description: 'CCT Strip',
      simultaneousCCT: false,
      hasColor: false,
      hasCCT: true,
      hasBrightness: true,
    },
  ],
  [
    0x21,
    {
      controllerLogicType: ControllerTypes.DimmerStrip,
      description: 'Dimmer',
      simultaneousCCT: false,
      hasColor: false,
      hasCCT: false,
      hasBrightness: true,
    },
  ],
  [
    0x25,
    {
      controllerLogicType: ControllerTypes.RGBWWStrip,
      description: 'RGBWW Simultaneous',
      simultaneousCCT: true,
      hasColor: true,
      hasCCT: false,
      hasBrightness: true,
    },
  ],
  [
    0x33,
    {
      controllerLogicType: ControllerTypes.GRBStrip,
      description: 'GRB Strip',
      simultaneousCCT: true,
      hasColor: true,
      hasCCT: false,
      hasBrightness: true,
    },
  ],
  [
    0x35,
    {
      controllerLogicType: ControllerTypes.RGBWWBulb,
      description: 'RGBWW Non-Simultaneous',
      simultaneousCCT: false,
      hasColor: true,
      hasCCT: false,
      hasBrightness: true,
    },
  ],
  [
    0x41,
    {
      controllerLogicType: ControllerTypes.DimmerStrip,
      description: 'Dimmer',
      simultaneousCCT: false,
      hasColor: false,
      hasCCT: false,
      hasBrightness: true,
    },
  ],
  [
    0x44,
    {
      controllerLogicType: ControllerTypes.RGBWBulb,
      description: 'RGBW Non-Simultaneous',
      simultaneousCCT: false,
      hasColor: true,
      hasCCT: false,
      hasBrightness: true,
    },
  ],
  [
    0x52,
    {
      controllerLogicType: ControllerTypes.RGBWWBulb,
      description: 'RGBWW Non-Simultaneous',
      simultaneousCCT: false,
      hasColor: true,
      hasCCT: false,
      hasBrightness: true,
    },
  ],
  [
    0x65,
    {
      controllerLogicType: ControllerTypes.DimmerStrip,
      description: 'Dimmer',
      simultaneousCCT: false,
      hasColor: false,
      hasCCT: false,
      hasBrightness: true,
    },
  ],
  [
    0x93,
    {
      controllerLogicType: ControllerTypes.Switch,
      description: 'Power Socket',
      simultaneousCCT: false,
      hasColor: false,
      hasCCT: false,
      hasBrightness: false,
    },
  ],
  [
    0x97,
    {
      controllerLogicType: ControllerTypes.Switch,
      description: 'Power Socket',
      simultaneousCCT: false,
      hasColor: false,
      hasCCT: false,
      hasBrightness: false,
    },
  ],
  [
    0xa1,
    {
      controllerLogicType: ControllerTypes.RGBStrip,
      description: 'RGB Strip',
      simultaneousCCT: false,
      hasColor: true,
      hasCCT: false,
      hasBrightness: true,
    },
  ],
  [
    0xa2,
    {
      controllerLogicType: ControllerTypes.RGBStrip,
      description: 'RGB Strip',
      simultaneousCCT: false,
      hasColor: true,
      hasCCT: false,
      hasBrightness: true,
    },
  ],
]);

function getUniqueIdName(uniqueId:string, controllerLogicType:string | null):string{
  const uniqueIdTruc = uniqueId.slice(-6);
  let deviceType = 'LED';
  if(controllerLogicType){
    if( isType(controllerLogicType, 'bulb') ) {
      deviceType = 'Bulb';
    } else if( isType(controllerLogicType, 'strip') ){
      deviceType = 'Strip';
    }else if( isType(controllerLogicType, 'switch') ){
      deviceType = 'Switch';
    }
  }
  return `${deviceType} ${uniqueIdTruc}`;
}

function isType(a,b){
  return a.toLowerCase().indexOf(b) > -1;
}

export { lightTypesMap, getUniqueIdName };