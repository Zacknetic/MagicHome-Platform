import { BaseController } from './baseController';
import { discoverProtoDevices } from '../utils/platformUtils';
import { DeviceBundle, InterfaceOptions, ProtoDevice, generateDeviceBundles } from 'magichome-core';


/**
 * 
 */
export class ControllerGenerator {
	// public customControllers: Map<string, BaseController>;
	// public inactiveDeviceQueue: IFailedDeviceProps[] = [];
	private interfaceOptions: InterfaceOptions = { timeoutMS: 700 };
	constructor() { }


	set activeControllers(activeControllers: Map<string, BaseController>) {
		this.activeControllers = activeControllers;
	}

	get activeControllers() {
		return this.activeControllers;
	}

	public async getDevices(): Promise<Map<string, BaseController>> {
		const deviceBundles: DeviceBundle[] = await this.discoverDeviceBundles();
		const activeControllers: Map<string, BaseController> = this.generateControllers(deviceBundles);
		return activeControllers;
	}

	public async discoverDeviceBundles(): Promise<DeviceBundle[]> {
		const protoDevices: ProtoDevice[] = await discoverProtoDevices();
		const deviceBundles: DeviceBundle[] = await generateDeviceBundles(protoDevices, this.interfaceOptions);
		return deviceBundles;
	}

	private generateControllers(deviceBundles: DeviceBundle[]): Map<string, BaseController> {

		const activeControllers: Map<string, BaseController> = this.iterateDevices(deviceBundles);
		return activeControllers;
	}

	// public generateCustomControllers(ICompleteDevicesInfo: ICompleteDeviceInfo[]): Map<string, BaseController> {

	// 	const completeDevices: ICompleteDevice[] = completeCustomDevices(ICompleteDevicesInfo);
	// 	const customControllers: Map<string, BaseController> = this.iterateDevices(completeDevices);
	// 	this.customControllers = customControllers;

	// 	return customControllers;
	// }

	private iterateDevices(deviceBundles: DeviceBundle[]): Map<string, BaseController> {
		const baseControllers: Map<string, BaseController> = new Map();
		for (const deviceBundle of deviceBundles) {
			const uniqueId: string = deviceBundle.completeDevice.protoDevice.uniqueId;
			const baseController: BaseController = new BaseController(deviceBundle);
			if(!baseController) {
				console.error('Error creating base controller for device:', deviceBundle.completeDevice.protoDevice);
				continue;
			}

			baseControllers.set(uniqueId, baseController)
		}

		return baseControllers;
	}

	// /**
	//  * class function getActiveDevices
	//  * 
	//  * Returns a map of <uniqueId, BaseController> pairs or;
	//  * If provided a valid uniqueId, returns a single BaseController
	//  * @param uniqueId (optional)
	//  * @returns 
	//  */
	// public getActiveDevice(uniqueId?: string): Map<string, BaseController> | BaseController {
	// 	if (uniqueId) {
	// 		return this.activeDevices[uniqueId];
	// 	} else {
	// 		return this.activeDevices;
	// 	}
	// }

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

