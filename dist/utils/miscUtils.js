"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.speedToDelay = exports.delayToSpeed = exports.loadJson = exports.parseJson = exports.parseDeviceState = exports.clamp = exports.checksum = void 0;
const fs_1 = require("fs");
//=================================================
// Start checksum //
//a checksum is needed at the end of the byte array otherwise the message is rejected by the light
//add all bytes and chop off the beginning by & with 0xFF
function checksum(buffer) {
    let chk = 0;
    for (const byte of buffer) {
        chk += byte;
    }
    return chk & 0xff;
}
exports.checksum = checksum;
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
exports.clamp = clamp;
function parseDeviceState(data) {
    let state = {
        LED: {
            isOn: data.readUInt8(2) === 0x23,
            RGB: {
                red: data.readUInt8(6),
                green: data.readUInt8(7),
                blue: data.readUInt8(8),
            },
            CCT: {
                warmWhite: data.readUInt8(9),
                coldWhite: data.readUInt8(11),
            },
        },
        controllerHardwareVersion: data.readUInt8(1),
        controllerFirmwareVersion: data.readUInt8(10),
        rawData: data,
    };
    return state;
}
exports.parseDeviceState = parseDeviceState;
function parseJson(value, replacement) {
    try {
        return JSON.parse(value);
    }
    catch (_error) {
        return replacement;
    }
}
exports.parseJson = parseJson;
function loadJson(file, replacement) {
    if (!(0, fs_1.existsSync)(file)) {
        return replacement;
    }
    return parseJson((0, fs_1.readFileSync)(file).toString(), replacement);
}
exports.loadJson = loadJson;
function delayToSpeed(delay) {
    let clamped = clamp(delay, 1, 31);
    clamped -= 1; // bring into interval [0, 30]
    return 100 - (clamped / 30) * 100;
}
exports.delayToSpeed = delayToSpeed;
function speedToDelay(speed) {
    const clamped = clamp(speed, 0, 100);
    return 30 - (clamped / 100) * 30 + 1;
}
exports.speedToDelay = speedToDelay;
