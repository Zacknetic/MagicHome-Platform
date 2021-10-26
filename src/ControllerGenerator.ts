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
			const controllers: Map<string, BaseController> = new Map();
			const discoveredDevices: types.IProtoDevice[] = await this.discoverDevices().catch(error => {
				console.log(error)
				return [];
			});
			Promise.all(
				discoveredDevices.map(async (discoveredDevice) => {

					const controller = await this.instantiateController(discoveredDevice);
					controllers.set(discoveredDevice.uniqueId, controller)
					return controller;
				})
			).finally(() => {
				resolve(controllers)
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
	public async createCustomControllers(customCompleteDevices: types.ICustomCompleteDeviceProps[] | types.ICustomCompleteDeviceProps): Promise<BaseController | Map<string, BaseController>> {

		return new Promise<BaseController | Map<string, BaseController> | null>(async (resolve) => {

			if (customCompleteDevices instanceof Array) {
				const customControllersMap = new Map();
				Promise.all(customCompleteDevices.map(async (customCompleteDevice) => {
					const customController = await this.createCustomController(customCompleteDevice);
					customControllersMap.set(customController.getCachedDeviceInformation().protoDevice.uniqueId, customController)
				})
				).finally(() => {
					resolve(customControllersMap)
				})

			} else {
				const customController = await this.createCustomController(customCompleteDevices);
				resolve(customController);
			}
		})

	}

	private async createCustomController(customCompleteDevice: types.ICustomCompleteDeviceProps) {

		const { protoDevice, deviceAPI, deviceState } = customCompleteDevice;
		const _protoDevice = Object.assign({ uniqueId: UUID(), modelNumber: 'unknown' }, protoDevice);

		const customController = await this.generateNewDevice(_protoDevice, deviceAPI, deviceState);
		this.activeDevices[protoDevice.uniqueId] = customController;
		return customController;
	}

	private async instantiateController(protoDevice: types.IProtoDevice) {
		let newController: BaseController;
		if (!this.activeDevices[protoDevice.uniqueId]) {

			newController = await this.generateNewDevice(protoDevice);
			this.activeDevices[protoDevice.uniqueId] = newController;
			return newController;
		} else {
			this.activeDevices[protoDevice.uniqueId].ipAddress = protoDevice.ipAddress;
		}

	}

	private async generateNewDevice(protoDevice: types.IProtoDevice, deviceAPI: types.IDeviceAPI = null, deviceState: types.IDeviceState = null): Promise<BaseController | null> {
		return new Promise(async (resolve) => {
			const deviceController = new BaseController(protoDevice);
			await deviceController.initializeController(deviceAPI, deviceState);
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

		const customCompleteDevice: types.ICustomCompleteDeviceProps = { protoDevice: directCommand }
		const controller = this.createCustomControllers([customCompleteDevice])[0];

		controller.activeDevice.setAllValues(directCommand, commandOptions);
	}

}