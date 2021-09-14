import * as types from './types';
import { scan, Transport } from 'magichome-core';
import { parseDeviceState, deviceNeedsPowerComand} from './utils/miscUtils'
import { lightTypesMap } from './LightMap';
import { BaseController } from './DeviceControllers/BaseController';

export class ControllerGenerator {

    constructor (
        public activeDevices : Map<string ,types.IDeviceProps> = new Map(),
        public inactiveDeviceQueue : types.IFailedDeviceProps[] = [],
    ) {
      
    }
 
    async createControllers() {
        return new Promise<Map<string ,types.IDeviceProps> | null>(async (resolve, reject) => {

        const discoveredDevices: types.IDeviceDiscoveredProps[] = await this.discoverDevices();
        Promise.all(
            discoveredDevices.map(async (discoveredDevice) => {
                await this.createController(discoveredDevice);
            
            })
          ).finally(() => {
            resolve( this.activeDevices)
          })

        })
    }

    async discoverDevices():Promise<types.IDeviceDiscoveredProps[] | null> {
        return new Promise(async (resolve, reject) => {

            let discoveredDevices: types.IDeviceDiscoveredProps[] = await scan(2000);
            for(let scans = 0; scans < 5; scans++){

                if(discoveredDevices.length > 0) break;
                discoveredDevices = await scan(2000);
            }
            
            if(discoveredDevices.length > 0){
                resolve (discoveredDevices);
            } else {
                reject ('No devices')
            }
        });
    }

    async createController(discoveredDevice: types.IDeviceDiscoveredProps){
        if(!this.activeDevices[discoveredDevice.uniqueId]) {
        return new Promise( (resolve) => {
            resolve(this.getState(discoveredDevice.ipAddress));
            }).then( (initialState: types.IDeviceState) => { 
                return new Promise( (resolve) => {
                    resolve(this.assignController(initialState));
                })
            }).then( (deviceQueryData: types.IDeviceQueriedProps) => { 
                return new Promise( (resolve) => {
                    resolve(this.generateNewDevice(discoveredDevice, deviceQueryData))
                });
            }).then( (newDevice: types.IDeviceProps) => { 
                this.activeDevices[discoveredDevice.uniqueId] = newDevice;
            }).catch(error => {
                console.log(error);
            });
        } else {
            console.log('controller exists')
                //controller already exists, ensure ip and object are up to date
        }

    } 

    async getState(ipAddress, _timeout = 500):Promise<types.IDeviceState | null>{
        return new Promise(async (resolve, reject) => {
            const transport = new Transport(ipAddress);
            if(typeof ipAddress !== 'string' ){
                reject(`Cannot determine controller because invalid IP address. Device:' ${ipAddress}`);
            }
            try{
                let scans = 0, data: Buffer;
            
                while(data == null && scans < 5){
                    data = await transport.getState(_timeout);
                    scans++;
                }
                if(data){
                    const state = await parseDeviceState(data);
                    resolve (state);
                } else {
                    reject ('[DeviceControllers](GetState) unable to retrieve data.');
                }
            } catch (error) {
                reject(`[DeviceControllers](GetState) failed:', ${error}`);
            }
        });
    }

    async assignController(initialState: types.IDeviceState):Promise<types.IDeviceQueriedProps | null> {
        return new Promise((resolve, reject) => {
        if(lightTypesMap.has(initialState.controllerHardwareVersion)){
            const deviceParameters: types.IDeviceParameters = lightTypesMap.get(initialState.controllerHardwareVersion);
            const deviceQueryData:types.IDeviceQueriedProps =  {deviceParameters: deviceParameters, initialDeviceState: initialState}
            

            resolve (deviceQueryData);
        } else {
          reject (null);
        }        
      });
    }

    async generateNewDevice(discoveredDevice: types.IDeviceDiscoveredProps, deviceQueryData:types.IDeviceQueriedProps):Promise<types.IDeviceProps | null>{
        return new Promise((resolve, reject) => {

            const newProps = {
                UUID: discoveredDevice.uniqueId,
                cachedIPAddress: discoveredDevice.ipAddress,
                displayName: deviceQueryData.deviceParameters.description,
                restartsSinceSeen: 0,
                lastKnownState: deviceQueryData.initialDeviceState
            }
            deviceQueryData.deviceParameters.needsPowerCommand = deviceNeedsPowerComand(discoveredDevice, deviceQueryData)
            
            const newDevice: types.IDeviceProps = Object.assign(newProps, deviceQueryData, discoveredDevice);
            const deviceController = new BaseController( newDevice );
            newDevice.activeController = deviceController; //chicken or the egg... which came first?
            resolve (newDevice);
          });
    }
}