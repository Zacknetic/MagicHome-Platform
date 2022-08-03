
import { discoverDevices, ICompleteDevice, IDeviceMetaData, IProtoDevice } from "magichome-core";
import { BaseController } from "..";
import { deviceTypesMap, matchingFirmwareVersions } from "./deviceTypesMap";
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