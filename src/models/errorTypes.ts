import { DeviceMetaData } from "magichome-core";

export class NoMatchingAPIError extends Error {
    constructor(deviceMetaData: DeviceMetaData, message = `No matching API found for device with hardware version ${deviceMetaData.controllerHardwareVersion} and firmware version ${deviceMetaData.controllerFirmwareVersion}`) {
        super(message);
        this.name = "NoMatchingAPIError";
    }
}