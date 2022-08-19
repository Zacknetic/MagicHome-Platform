
import { COLOR_MASKS, discoverDevices, ICommandOptions, ICompleteDevice, IDeviceCommand, IDeviceMetaData, IProtoDevice } from "magichome-core";
import { mergeDeep, overwriteDeep } from "magichome-core/dist/utils/miscUtils";
import { BaseController } from "..";
import { deviceTypesMap, matchingFirmwareVersions } from "./deviceTypesMap";
import { clamp } from "./miscUtils";
import { IDeviceAPI } from "./types";

export async function discoverProtoDevices(): Promise<IProtoDevice[] | null> {
    return new Promise(async (resolve, reject) => {
        let discoveredDevices: IProtoDevice[] = await discoverDevices(1000);
        for (let scans = 0; scans < 5; scans++) {

            if (discoveredDevices.length > 0) break;
            discoveredDevices = await discoverDevices(1000);
        }

        if (discoveredDevices.length > 0) {
            resolve(discoveredDevices);
        } else {
            reject('No devices found')
        }
    });
}

export function getAPI(deviceMetaData: IDeviceMetaData) {
    const { controllerFirmwareVersion, controllerHardwareVersion } = deviceMetaData;

    let adjustedProtocols;
    if (matchingFirmwareVersions.has(controllerFirmwareVersion)) adjustedProtocols = matchingFirmwareVersions.get(controllerFirmwareVersion);
    // if (firmwareVersion == '1' && modelNumber.includes('HF-LPB100-ZJ200')) {
    //     needsPowerCommand = { needsPowerCommand: true };
    // }

    if (deviceTypesMap.has(controllerHardwareVersion)) {
        let deviceAPI: IDeviceAPI = deviceTypesMap.get(controllerHardwareVersion);
        deviceAPI = Object.assign(deviceAPI, adjustedProtocols);
        return deviceAPI;
    } else {
        throw new Error("no matching API! WEIRD!");
    }

}

export function adjustCommandToAPI(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions, deviceAPI: IDeviceAPI): IDeviceCommand {

    const newDeviceCommand: IDeviceCommand = mergeDeep({}, deviceCommand);
    const { byteOrder, simultaneousCCT, hasBrightness, hasCCT, hasColor }: IDeviceAPI = deviceAPI;

    if (hasColor && commandOptions.colorAssist) {
        determineColorMask(newDeviceCommand, simultaneousCCT, hasCCT);
        adjustCCT(newDeviceCommand, deviceAPI);
        setRGBOrder(newDeviceCommand, byteOrder);

    }
    return newDeviceCommand;
}

function determineColorMask(newDeviceCommand: IDeviceCommand, simultaneousCCT: boolean, hasCCT: boolean) {
    if (newDeviceCommand.colorMask) return;
    if (simultaneousCCT) newDeviceCommand.colorMask = COLOR_MASKS.BOTH;
    if (!hasCCT) newDeviceCommand.colorMask = COLOR_MASKS.COLOR;

    let { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite }, colorMask } = newDeviceCommand;
    if (!colorMask) colorMask = (red + green + blue) >= Math.max(warmWhite, coldWhite) - 5 ? COLOR_MASKS.COLOR : COLOR_MASKS.WHITE;
    newDeviceCommand.colorMask = colorMask;
}

function setRGBOrder(newDeviceCommand: IDeviceCommand, byteOrder: Array<string>): void {
    if (byteOrder.length < 3) return;
    const { RGB: { red, green, blue } } = newDeviceCommand;
    const colorList = [0, 0, 0];
    let i = 0;
    for (const byte of byteOrder) {
        if (i > colorList.length - 1) break;
        switch (byte) {
            case 'r':
                colorList[i] = red;
                break;
            case 'g':
                colorList[i] = green;
                break;
            case 'b':
                colorList[i] = blue;
                break;
            default:
                break;
        }
        i++;
    }

    overwriteDeep(newDeviceCommand, { RGB: { red: colorList[0], green: colorList[1], blue: colorList[2] } })
}

function adjustCCT(newDeviceCommand: IDeviceCommand, deviceAPI: IDeviceAPI) {
    const { byteOrder, simultaneousCCT, hasBrightness, hasCCT, hasColor }: IDeviceAPI = deviceAPI;
    const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite }, colorMask } = newDeviceCommand;

    if (simultaneousCCT || colorMask != COLOR_MASKS.COLOR || !(warmWhite > 0 || coldWhite > 0)) return;

    const cwAdj = Math.round(coldWhite / 8), wwRedAdj = Math.round(warmWhite / 2), wwGreenAdj = Math.round(warmWhite / 6.8), wwBlueAdj = Math.round(warmWhite / 28.4);
    overwriteDeep(newDeviceCommand, { RGB: { red: clamp(red + cwAdj + wwRedAdj, 0, 255), green: clamp(green + cwAdj + wwGreenAdj, 0, 255), blue: clamp(blue + cwAdj + wwBlueAdj, 0, 255) }, colorMask: COLOR_MASKS.COLOR });


}

