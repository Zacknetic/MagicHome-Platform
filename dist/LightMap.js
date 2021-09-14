"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUniqueIdName = exports.lightTypesMap = void 0;
const lightTypesMap = new Map([
    [
        0x04,
        {
            description: 'RGBW Simultaneous',
            simultaneousCCT: true,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
            isEightByteProtocol: null,
        },
    ],
    [
        0x06,
        {
            description: 'RGBW Simultaneous',
            simultaneousCCT: true,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
            isEightByteProtocol: null,
        },
    ],
    [
        0x07,
        {
            description: 'RGBWW Simultaneous',
            simultaneousCCT: true,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
            isEightByteProtocol: false,
        },
    ],
    [
        0x09,
        {
            description: 'CCT Strip',
            simultaneousCCT: false,
            hasColor: false,
            hasCCT: true,
            hasBrightness: true,
            isEightByteProtocol: false,
        },
    ],
    [
        0x21,
        {
            description: 'Dimmer',
            simultaneousCCT: false,
            hasColor: false,
            hasCCT: false,
            hasBrightness: true,
            isEightByteProtocol: null,
        },
    ],
    [
        0x25,
        {
            description: 'RGBWW Simultaneous',
            simultaneousCCT: true,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
            isEightByteProtocol: false,
        },
    ],
    [
        0x33,
        {
            description: 'GRB Strip',
            simultaneousCCT: true,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
            isEightByteProtocol: null,
        },
    ],
    [
        0x35,
        {
            description: 'RGBWW Non-Simultaneous',
            simultaneousCCT: false,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
            isEightByteProtocol: false,
        },
    ],
    [
        0x41,
        {
            description: 'Dimmer',
            simultaneousCCT: false,
            hasColor: false,
            hasCCT: false,
            hasBrightness: true,
            isEightByteProtocol: null,
        },
    ],
    [
        0x44,
        {
            description: 'RGBW Non-Simultaneous',
            simultaneousCCT: false,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
            isEightByteProtocol: null,
        },
    ],
    [
        0x52,
        {
            description: 'RGBWW Non-Simultaneous',
            simultaneousCCT: false,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
            isEightByteProtocol: false,
        },
    ],
    [
        0x65,
        {
            description: 'Dimmer',
            simultaneousCCT: false,
            hasColor: false,
            hasCCT: false,
            hasBrightness: true,
            isEightByteProtocol: null,
        },
    ],
    [
        0x93,
        {
            description: 'Power Socket',
            simultaneousCCT: false,
            hasColor: false,
            hasCCT: false,
            hasBrightness: false,
            isEightByteProtocol: null,
        },
    ],
    [
        0x97,
        {
            description: 'Power Socket',
            simultaneousCCT: false,
            hasColor: false,
            hasCCT: false,
            hasBrightness: false,
            isEightByteProtocol: null,
        },
    ],
    [
        0xa1,
        {
            description: 'RGB Strip',
            simultaneousCCT: false,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
            isEightByteProtocol: null,
        },
    ],
    [
        0xa2,
        {
            description: 'RGB Strip',
            simultaneousCCT: false,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
            isEightByteProtocol: null,
        },
    ],
]);
exports.lightTypesMap = lightTypesMap;
function getUniqueIdName(uniqueId, controllerLogicType) {
    const uniqueIdTruc = uniqueId.slice(-6);
    let deviceType = 'LED';
    if (controllerLogicType) {
        if (isType(controllerLogicType, 'bulb')) {
            deviceType = 'Bulb';
        }
        else if (isType(controllerLogicType, 'strip')) {
            deviceType = 'Strip';
        }
        else if (isType(controllerLogicType, 'switch')) {
            deviceType = 'Switch';
        }
    }
    return `${deviceType} ${uniqueIdTruc}`;
}
exports.getUniqueIdName = getUniqueIdName;
function isType(a, b) {
    return a.toLowerCase().indexOf(b) > -1;
}