import { existsSync, readFileSync } from 'fs';
import * as types from '../types';


//=================================================
// Start checksum //

//a checksum is needed at the end of the byte array otherwise the message is rejected by the light
//add all bytes and chop off the beginning by & with 0xFF
export function checksum(buffer: Uint8Array) {
  let chk = 0;

  for (const byte of buffer) {
    chk += byte;
  }

  return chk & 0xff;
}


export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function parseDeviceState(data: Buffer) {
  let state: types.IDeviceState = {
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
  }
  return state;
}



export function parseJson<T>(value: string, replacement: T): T {
  try {
    return <T>JSON.parse(value);
  } catch (_error) {
    return replacement;
  }
}

export function loadJson<T>(file: string, replacement: T): T {
  if (!existsSync(file)) {
    return replacement;
  }
  return parseJson<T>(readFileSync(file).toString(), replacement);
}



export function delayToSpeed(delay: never) {
  let clamped = clamp(delay, 1, 31);
  clamped -= 1; // bring into interval [0, 30]
  return 100 - (clamped / 30) * 100;
}

export function speedToDelay(speed: never) {
  const clamped = clamp(speed, 0, 100);
  return 30 - (clamped / 100) * 30 + 1;
}

export function deviceNeedsPowerComand(discoveredDevice: types.IDeviceDiscoveredProps, deviceQueryData: types.IDeviceQueriedProps): boolean {
  const matchingFirmwareVersions = [2,3,4,5,8]
  const firmwareVersion = deviceQueryData.initialDeviceState.controllerFirmwareVersion;
  const modelNumber = discoveredDevice.modelNumber;

  let needsPowerCommand = false;

  if(matchingFirmwareVersions[firmwareVersion] || (firmwareVersion == 1 && modelNumber.includes('HF-LPB100-ZJ200'))) needsPowerCommand = true;

  return needsPowerCommand;
}