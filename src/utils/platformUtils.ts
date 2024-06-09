import { deepEqual, combineDeep, cloneDeep } from "magichome-core/dist/utils/miscUtils";
import { deviceTypesMap } from "./deviceTypesMap";
import { clamp } from "./miscUtils";
import { IAnimationCommand, DeviceAPI } from "../models/types";
import { ColorMask, CommandOptions, DeviceCommand, DeviceMetaData, ProtoDevice, discoverDevices } from "magichome-core";
import { NoMatchingAPIError } from "../models/errorTypes";

export async function discoverProtoDevices(): Promise<ProtoDevice[]> {

  let discoveredDevices: ProtoDevice[] = await discoverDevices(1000);
  for (let scans = 0; scans < 5; scans++) {
    if (discoveredDevices.length > 0) break;
    discoveredDevices = await discoverDevices(1000);
  }

  return discoveredDevices;
}

export function getAPI(deviceMetaData: DeviceMetaData) {
  const { controllerHardwareVersion } = deviceMetaData;
  if (!deviceTypesMap.has(controllerHardwareVersion)) throw new NoMatchingAPIError(deviceMetaData);
  const deviceAPI: DeviceAPI = deviceTypesMap.get(controllerHardwareVersion) as DeviceAPI;

  // if (matchingFirmwareVersions.has(controllerFirmwareVersion)) adjustedProtocols = matchingFirmwareVersions.get(controllerFirmwareVersion);

  return deviceAPI;
}

export function adjustCommandToAPI(deviceCommand: DeviceCommand, commandOptions: CommandOptions, deviceAPI: DeviceAPI): DeviceCommand {
  const { byteOrder, simultaneousCCT, hasCCT, hasColor }: DeviceAPI = deviceAPI;
  if (!hasColor || !commandOptions.colorAssist) return deviceCommand;

  let newDeviceCommand: DeviceCommand = cloneDeep<DeviceCommand>(deviceCommand);

  newDeviceCommand.colorMask = determineColorMask(newDeviceCommand, simultaneousCCT, hasCCT);
  newDeviceCommand = adjustCCT(newDeviceCommand, deviceAPI);
  newDeviceCommand.isOn = adjustIsOn(newDeviceCommand);
  newDeviceCommand = setRGBOrder(newDeviceCommand, byteOrder); //this must be done last as to not interfere with the other adjustments

  return newDeviceCommand;
}

function determineColorMask(deviceCommand: DeviceCommand, simultaneousCCT: boolean, hasCCT: boolean): ColorMask {
  let { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite }, colorMask } = deviceCommand;

  if (simultaneousCCT) colorMask = ColorMask.BOTH;
  if (!hasCCT) colorMask = ColorMask.RGB;

  //catch all for when the colorMask is not explicitly defined by above conditions
  if (!colorMask) colorMask = Math.max(red, green, blue) >= Math.max(warmWhite, coldWhite) ? ColorMask.RGB : ColorMask.CCT;

  return colorMask;
}

function setRGBOrder(deviceCommand: DeviceCommand, byteOrder: Array<string>): DeviceCommand {
  if (byteOrder.length < 3) return deviceCommand;
  const { RGB: { red, green, blue } } = deviceCommand;
  const colorList = [0, 0, 0];

  let i = 0;
  for (const byte of byteOrder) {
    if (i > colorList.length - 1) break;
    switch (byte) {
      case "r":
        colorList[i] = red;
        break;
      case "g":
        colorList[i] = green;
        break;
      case "b":
        colorList[i] = blue;
        break;
      default:
        break;
    }
    i++;
  }

  return combineDeep<DeviceCommand>(deviceCommand, { RGB: { red: colorList[0] || 0, green: colorList[1] || 0, blue: colorList[2] || 0 } });
}

//TODO: these need to be changed so this function is skippable in configuration. This is not the same as the other functions and is more subjective to personal preference
//this could be done at a device object level which could be enabled/disabled on the fly from a GUI
function adjustCCT(deviceCommand: DeviceCommand, deviceAPI: DeviceAPI): DeviceCommand {

  let newDeviceCommand: DeviceCommand = cloneDeep(deviceCommand);
  const { byteOrder, simultaneousCCT }: DeviceAPI = deviceAPI;
  const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite }, colorMask } = deviceCommand;

  const cwAdj = Math.round(coldWhite / 2), wwRedAdj = Math.round(warmWhite / 2), wwGreenAdj = Math.round(warmWhite / 6.8), wwBlueAdj = Math.round(warmWhite / 28.4);

  //todo handle non RGB devices, single brightness devices

  // simultaneousCCT, 5-colors, ColorMask set to CCT
  if (byteOrder.length == 5 && simultaneousCCT && colorMask == ColorMask.CCT) {/*do nothing for now */ }

  // non-simultaneousCCT, 5-colors, ColorMask set to CCT
  else if (byteOrder.length == 5 && !simultaneousCCT && colorMask == ColorMask.CCT) {/*do nothing for now */ }

  // non-simultaneousCCT, 5-colors, ColorMask not explicitly defined or is defined as RGB/BOTH
  else if (byteOrder.length == 5 && !simultaneousCCT) {/*do nothing for now*/ }

  // simultaneousCCT, 4-colors, ColorMask not explicitly defined or is defined as RGB/BOTH
  // (adjusts the color channels to account for the lack of a 2nd white channel by modifying the RGB channels to be cooler)
  else if (byteOrder.length == 4 && simultaneousCCT && coldWhite > 0) {
    newDeviceCommand = combineDeep<DeviceCommand>(deviceCommand, { RGB: { red: clamp(red + cwAdj, 0, 255), green: clamp(green + cwAdj, 0, 255), blue: clamp(blue + cwAdj, 0, 255) }, CCT: { warmWhite: Math.max(coldWhite, warmWhite), coldWhite }, colorMask: ColorMask.BOTH });
  }

  // non-simultaneousCCT, 4-colors, ColorMask set to CCT 
  // (adjusts for the lack of a 2nd white channel by using the highest value for both warm and cold white)
  else if (byteOrder.length == 4 && !simultaneousCCT && colorMask == ColorMask.CCT) {
    newDeviceCommand = combineDeep<DeviceCommand>(deviceCommand, { CCT: { warmWhite: Math.max(warmWhite, coldWhite), coldWhite: 0 } });
  }

  // non-simultaneousCCT, 4-colors, ColorMask not explicitly defined or is defined as RGB
  // (adjusts for the lack of simultaneous CCT and RGB by adding adjustments calculated from both warmWhite and coldWhite to the RGB channels)
  else if (!simultaneousCCT && byteOrder.length == 4) {
    newDeviceCommand = combineDeep<DeviceCommand>(deviceCommand, { RGB: { red: clamp(red + cwAdj + wwRedAdj, 0, 255), green: clamp(green + cwAdj + wwGreenAdj, 0, 255), blue: clamp(blue + cwAdj + wwBlueAdj, 0, 255) }, colorMask: ColorMask.RGB });
  }

  //non-simultaneousCCT, 3-colors, ColorMask not explicitly defined or is defined as RGB
  // (adjusts for the lack of simultaneous CCT and RGB by adding adjustments calculated from both warmWhite and coldWhite to the RGB channels)
  else if (!simultaneousCCT && byteOrder.length == 3) {
    newDeviceCommand = combineDeep<DeviceCommand>(deviceCommand, { RGB: { red: clamp(red + cwAdj + wwRedAdj, 0, 255), green: clamp(green + cwAdj + wwGreenAdj, 0, 255), blue: clamp(blue + cwAdj + wwBlueAdj, 0, 255) }, colorMask: ColorMask.RGB });
  }

  return newDeviceCommand;
}

function adjustIsOn(deviceCommand: DeviceCommand): boolean {
  let isOn = false;
  const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite } } = deviceCommand;

  if (Math.max(red, green, blue, warmWhite, coldWhite) > 0) isOn = true;

  return isOn;
}

export function isCommandEqual(colorStart: IAnimationCommand, colorTarget: IAnimationCommand): boolean {
  let isEqual = false;
  try {
    isEqual = deepEqual(colorStart, colorTarget, ["colorMask"]);
  } catch (error) {
    console.log("Error in isCommandEqual: ", error);
  }
  return isEqual;
}
