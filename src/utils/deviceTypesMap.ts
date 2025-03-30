import { DeviceAPI } from '../models/types';

export const deviceTypesMap: Map<number, DeviceAPI> = new Map([
  [
    0x04,
    {
      description: 'RGBW Strip',
      byteOrder: ['r', 'g', 'b', 'ww'],
      simultaneousCCT: true,
      hasColor: true,
      hasCCT: true,
      hasBrightness: true,
      isEightByteProtocol: true, //todo: check this
      needsPowerCommand: false,
    },
  ],
  [
    0x06,
    {
      description: 'RGBW Strip',
      byteOrder: ['r', 'g', 'b', 'ww'],
      simultaneousCCT: true,
      hasColor: true,
      hasCCT: true,
      hasBrightness: true,
      isEightByteProtocol: false,
      needsPowerCommand: null,
    },
  ],
  [
    0x07,
    {
      description: 'RGBCCT Strip',
      byteOrder: ['r', 'g', 'b', 'ww', 'cw'],
      simultaneousCCT: true,
      hasColor: true,
      hasCCT: true,
      hasBrightness: true,
      isEightByteProtocol: false,
      needsPowerCommand: null,
    },
  ],
  [
    0x09,
    {
      description: 'CCT Strip',
      byteOrder: ['ww', 'cw'],
      simultaneousCCT: false,
      hasColor: false,
      hasCCT: true,
      hasBrightness: true,
      isEightByteProtocol: false,
      needsPowerCommand: null,
    },
  ],
  [
    0x21,
    {
      description: 'Dimmer',
      byteOrder: ['r'],
      simultaneousCCT: false,
      hasColor: false,
      hasCCT: true,
      hasBrightness: true,
      isEightByteProtocol: false, //todo: check this
      needsPowerCommand: null,
    },
  ],
  [
    0x25,
    {
      description: 'RGBCCT Strip',
      byteOrder: ['r', 'g', 'b', 'ww', 'cw'],
      simultaneousCCT: true,
      hasColor: true,
      hasCCT: true,
      hasBrightness: true,
      isEightByteProtocol: false,
      needsPowerCommand: null,
    },
  ],
  [
    0x33,
    {
      description: 'GRB Strip',
      byteOrder: ['g', 'r', 'b'],
      simultaneousCCT: false,
      hasColor: true,
      hasCCT: false,
      hasBrightness: true,
      isEightByteProtocol: true,
      needsPowerCommand: null,
    },
  ],
  [
    0x35,
    {
      description: 'RGBCCT Bulb',
      byteOrder: ['r', 'g', 'b', 'ww', 'cw'],
      simultaneousCCT: false,
      hasColor: true,
      hasCCT: true,
      hasBrightness: true,
      isEightByteProtocol: false,
      needsPowerCommand: null,
    },
  ],
  [
    0x41,
    {
      description: 'Dimmer',
      byteOrder: ['r'],
      simultaneousCCT: false,
      hasColor: false,
      hasCCT: false,
      hasBrightness: true,
      isEightByteProtocol: true, //todo: check this
      needsPowerCommand: null,
    },
  ],
  [
    0x44,
    {
      description: 'RGBW Bulb',
      byteOrder: ['r', 'g', 'b', 'ww'],
      simultaneousCCT: false,
      hasColor: true,
      hasCCT: true,
      hasBrightness: true,
      isEightByteProtocol: true,
      needsPowerCommand: null,
    },
  ],
  [
    0x52,
    {
      description: 'RGBCCT Bulb',
      byteOrder: ['r', 'g', 'b', 'ww', 'cw'],
      simultaneousCCT: false,
      hasColor: true,
      hasCCT: true,
      hasBrightness: true,
      isEightByteProtocol: false,
      needsPowerCommand: null,
    },
  ],
  [
    0x65,
    {
      description: 'Dimmer',
      byteOrder: ['r'],
      simultaneousCCT: false,
      hasColor: false,
      hasCCT: false,
      hasBrightness: true,
      isEightByteProtocol: true, //todo: check this
      needsPowerCommand: null,
    },
  ],
  [
    0x93,
    {
      description: 'Power Socket',
      byteOrder: [],
      simultaneousCCT: false,
      hasColor: false,
      hasCCT: false,
      hasBrightness: false,
      isEightByteProtocol: true, //todo: check this
      needsPowerCommand: null,
    },
  ],
  [
    0x97,
    {
      description: 'Power Socket',
      byteOrder: [],
      simultaneousCCT: false,
      hasColor: false,
      hasCCT: false,
      hasBrightness: false,
      isEightByteProtocol: true, //todo: check this
      needsPowerCommand: null,
    },
  ],
  [
    0xa1,
    {
      description: 'RGB Strip',
      byteOrder: ['r', 'g', 'b'],
      simultaneousCCT: false,
      hasColor: true,
      hasCCT: false,
      hasBrightness: true,
      isEightByteProtocol: true, //todo: check this
      needsPowerCommand: null,
    },
  ],
  [
    0xa2,
    {
      description: 'RGB Strip',
      byteOrder: ['r', 'g', 'b'],
      simultaneousCCT: false,
      hasColor: true,
      hasCCT: false,
      hasBrightness: true,
      isEightByteProtocol: true, //todo: check this
      needsPowerCommand: null,
    },
  ],
]);

export const matchingFirmwareVersions: Map<number, any> = new Map([
  [1, { needsPowerCommand: false, isEightByteProtocol: true }],
  [2, { needsPowerCommand: true }],
  [3, { needsPowerCommand: true, isEightByteProtocol: true }],
  [4, { needsPowerCommand: true }],
  [5, { needsPowerCommand: true }],
  [7, { needsPowerCommand: false, isEightByteProtocol: false }],
  [8, { needsPowerCommand: true, isEightByteProtocol: true }],
  [9, { needsPowerCommand: false, isEightByteProtocol: true }],
])

export function getUniqueIdName(uniqueId: string, controllerLogicType: string | null): string {
  const uniqueIdTrunc = uniqueId.slice(-6);
  let deviceType = 'LED';
  if (controllerLogicType) {
    if (isType(controllerLogicType, 'bulb')) {
      deviceType = 'Bulb';
    } else if (isType(controllerLogicType, 'strip')) {
      deviceType = 'Strip';
    } else if (isType(controllerLogicType, 'switch')) {
      deviceType = 'Switch';
    }
  }
  return `${deviceType} ${uniqueIdTrunc}`;
}

function isType(a: string, b: string) {
  return a.toLowerCase().indexOf(b) > -1;
}