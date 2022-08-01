import { DirectCommand, ICustomCompleteDevice, IDeviceAPI, IFailedDeviceProps, } from './types';
import { v1 as UUID } from 'uuid';
import { discoverDevices, completeDevices, ICommandOptions, ICompleteDevice, IProtoDevice } from 'magichome-core';
import { BaseController } from './DeviceControllers/BaseController';
import { discoverProtoDevices } from './utils/platformUtils';

/**
 * 
 */
export class Controllers {
	public activeDevices: Map<string, BaseController> = new Map();
	public inactiveDeviceQueue: IFailedDeviceProps[] = [];
	constructor() { }

	/**
	 * class function discoverControllers
	 * 
	 * Scan the network for compatible MagicHome devices,
	 * @returns a map of <uniqueId, ControllerObject> pairs.
	 */
	public async discoverCompleteDevices(): Promise<ICompleteDevice[] | null> {
		const protoDevices: IProtoDevice[] = await discoverProtoDevices().catch(error => {
			console.log(error)
			return null;
		});

		const completedDevices: ICompleteDevice[] = await completeDevices(protoDevices);
		return completedDevices;
	}

	public generateControllers(completedDevices: ICompleteDevice[]): Map<string, BaseController> {

		for (const completedDevice of completedDevices) {
			const deviceController: BaseController = new BaseController(completedDevice);
			this.activeDevices.set(completedDevice.protoDevice.uniqueId, deviceController)
		}

		return this.activeDevices;
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
	// public async createCustomControllers(customCompleteDevices: ICustomCompleteDevice[] | ICustomCompleteDevice): Promise<BaseController | Map<string, BaseController>> {

	// 	return new Promise<BaseController | Map<string, BaseController> | null>(async (resolve) => {

	// 		if (customCompleteDevices instanceof Array) {
	// 			const customControllersMap = new Map();
	// 			Promise.all(customCompleteDevices.map(async (customCompleteDevice) => {
	// 				const customController = await this.createCustomController(customCompleteDevice);
	// 				customControllersMap.set(customController.getCachedDeviceInformation().protoDevice.uniqueId, customController)
	// 			})
	// 			).finally(() => {
	// 				resolve(customControllersMap)
	// 			})

	// 		} else {
	// 			const customController = await this.createCustomController(customCompleteDevices);
	// 			resolve(customController);
	// 		}
	// 	})

	// }

	// private async createCustomController(customCompleteDevice: ICustomCompleteDevice) {

	// 	const { protoDevice, deviceAPI, deviceState } = customCompleteDevice;
	// 	const _protoDevice = Object.assign({ uniqueId: UUID(), modelNumber: 'unknown' }, protoDevice);

	// 	const customController = await this.generateNewDevice(_protoDevice, deviceAPI, deviceState);
	// 	this.activeDevices[protoDevice.uniqueId] = customController;
	// 	return customController;
	// }

	// private async instantiateController(protoDevice: IProtoDevice) {
	// 	let newController: BaseController;
	// 	if (!this.activeDevices[protoDevice.uniqueId]) {

	// 		newController = await this.generateNewDevice(protoDevice);
	// 		this.activeDevices[protoDevice.uniqueId] = newController;
	// 		return newController;
	// 	} else {
	// 		this.activeDevices[protoDevice.uniqueId].ipAddress = protoDevice.ipAddress;
	// 	}

	// }



	/**
	 * class function getActiveDevices
	 * 
	 * Returns a map of <uniqueId, BaseController> pairs or;
	 * If provided a valid uniqueId, returns a single BaseController
	 * @param uniqueId (optional)
	 * @returns 
	 */
	public getActiveDevice(uniqueId?: string): Map<string, BaseController> | BaseController {
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

	// public async sendDirectCommand(directCommand: DirectCommand, commandOptions?: ICommandOptions) {

	// 	const customCompleteDevice: ICustomCompleteDevice = { protoDevice: directCommand }
	// 	const controller = this.createCustomControllers([customCompleteDevice])[0];

	// 	controller.activeDevice.setAllValues(directCommand, commandOptions);
	// }

}

