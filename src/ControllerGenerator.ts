import * as types from './types';
import { v1 as UUID } from 'uuid';
import { scan } from 'magichome-core';
import { BaseController } from './DeviceControllers/BaseController';

/**
 * 
 */
export class ControllerGenerator {

	constructor(
		public activeDevices: Map<string, BaseController> = new Map(),
		public inactiveDeviceQueue: types.IFailedDeviceProps[] = [],
	) { }

	/**
	 * class function discoverControllers
	 * 
	 * Scan the network for compatible MagicHome devices,
	 * @returns a map of <uniqueId, ControllerObject> pairs.
	 */
	public async discoverControllers(): Promise<Map<string, BaseController>> {
		return new Promise<Map<string, BaseController> | null>(async (resolve, reject) => {

			const discoveredDevices: types.IProtoDevice[] = await this.discoverDevices();
			Promise.all(
				discoveredDevices.map(async (discoveredDevice) => {
					return await this.instantiateController(discoveredDevice);
				})
			).finally(() => {
				resolve(this.activeDevices)
			})
		})
	}

	private async discoverDevices(): Promise<types.IProtoDevice[] | null> {
		return new Promise(async (resolve, reject) => {

			let discoveredDevices: types.IProtoDevice[] = await scan(2000);
			for (let scans = 0; scans < 5; scans++) {

				if (discoveredDevices.length > 0) break;
				discoveredDevices = await scan(2000);
			}

			if (discoveredDevices.length > 0) {
				resolve(discoveredDevices);
			} else {
				reject('No devices found')
			}
		});
	}

	/**
	 * class function createCustomControllers
	 * 
	 * Creates compatible MagicHome controllers from a custom parameters
	 * Stores controllers as a map of <uniqueId, BaseController> pairs
	 * 
	 * @param customCompleteDevices array of objects containign setup data
	 * @param customCompleteDevice single object containing setup data
	 * 
	 * @returns a map of <uniqueId, BaseController> pairs or a single BaseController
	 */
	public async createCustomControllers(customCompleteDevices: types.CustomCompleteDeviceProps[] | types.CustomCompleteDeviceProps): Promise<Map<string, BaseController>> {

		if (customCompleteDevices instanceof Array) {
			return new Promise<Map<string, BaseController> | null>(async (resolve) => {
				Promise.all(
					customCompleteDevices.map(async (customCompleteDevice) => {
						await this.createCustomController(customCompleteDevice);
					})
				).finally(() => {
					resolve(this.activeDevices)
				})

			})
		} else {
			this.createCustomController(customCompleteDevices);
		}
	}

	private async createCustomController(customCompleteDevice: types.CustomCompleteDeviceProps) {

		const { protoDevice, deviceAPI } = customCompleteDevice;

		const _protoDevice = Object.assign({ uniqueId: UUID(), modelNumber: 'unknown' }, protoDevice);

		this.activeDevices[protoDevice.uniqueId] = this.generateNewDevice(_protoDevice, deviceAPI);
	}

	private async instantiateController(protoDevice: types.IProtoDevice) {
		if (!this.activeDevices[protoDevice.uniqueId]) {

			this.activeDevices[protoDevice.uniqueId] = await this.generateNewDevice(protoDevice);
		} else {
			console.log('controller exists')
			this.activeDevices[protoDevice.uniqueId].ipAddress = protoDevice.ipAddress;
		}

	}

	private async generateNewDevice(protoDevice: types.IProtoDevice, deviceAPI: types.IDeviceAPI = null): Promise<BaseController | null> {
		return new Promise(async (resolve, reject) => {

			const deviceController = new BaseController(protoDevice);
			await deviceController.initializeController(deviceAPI);
			resolve(deviceController);
		});
	}

	/**
	 * class function getActiveDevices
	 * 
	 * Returns a map of <uniqueId, BaseController> pairs or;
	 * If provided a valid uniqueId, returns a single BaseController
	 * @param uniqueId (optional)
	 * @returns 
	 */
	public getActiveDevices(uniqueId?: string): Map<string, BaseController> | BaseController {
		if (uniqueId) {
			return this.activeDevices[uniqueId];
		} else {
			return this.activeDevices;
		}
	}

	/** TODO
	 * change this to a base controller function
	 * check if the device exists, if not create it. If yes, just send a message using the direct command protocol. 
	 */
	/**
	 * class function sendDirectCommand
	 * 
	 * @param directCommand
	 * @param commandOptions (optional)
	 */

	public async sendDirectCommand(directCommand: types.DirectCommand, commandOptions?: types.ICommandOptions) {

	    const customCompleteDevice: types.CustomCompleteDeviceProps = { protoDevice: directCommand }
	    const controller = this.createCustomControllers([customCompleteDevice])[0];

	    controller.activeDevice.setAllValues(directCommand, commandOptions);

	}

}