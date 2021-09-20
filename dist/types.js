"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIMIZATION_SETTINGS = exports.DefaultDevice = exports.DefaultCommand = exports.PowerCommands = exports.ColorMasks = exports.DeviceWriteStatus = void 0;
/*----------------------[Constants]----------------------*/
exports.DeviceWriteStatus = {
    ready: 'ready',
    busy: 'busy',
    pending: 'pending',
};
exports.ColorMasks = {
    white: 0x0F,
    color: 0xF0,
    both: 0xFF,
};
exports.PowerCommands = {
    COMMAND_POWER_ON: [0x71, 0x23, 0x0f],
    COMMAND_POWER_OFF: [0x71, 0x24, 0x0f],
};
exports.DefaultCommand = {
    isOn: false,
    RGB: {
        red: 0,
        green: 0,
        blue: 0,
    },
    CCT: {
        warmWhite: 0,
        coldWhite: 0
    }
};
exports.DefaultDevice = {
    ipAddress: '',
    uniqueId: '',
    modelNumber: 'unknown',
};
exports.OPTIMIZATION_SETTINGS = {
    INTRA_MESSAGE_TIME: 10,
    POWER_WAIT_TIME: 100,
    STATE_RETRY_WAIT_TIME: 300,
};
