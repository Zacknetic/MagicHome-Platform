import * as types from './types';
import {scan} from 'magichome-core';
import {Transport} from 'magichome-core'
import { getUniqueIdName, lightTypesMap} from './LightMap';
import { IDeviceProps } from 'magichome-core/dist/types';

export class DeviceControllers {
    constructor (
        public readonly activeDevices : Map<string ,types.IDeviceProps> = new Map(),
        public readonly inactiveDeviceQueue : types.IFailedDeviceProps[] = [],
        private discoveredDevices : types.IDeviceDiscoveredProps[] = [],

    ) {
        this.createControllers();       
    }

    async createControllers() {
        this.discoveredDevices = await this.discoverDevices();

        for (const discoveredDevice of this.discoveredDevices) { 
            if(!this.activeDevices[discoveredDevice.uniqueId]) {
                await this.getState(discoveredDevice)
                .then( (initialState) => {
                    return this.assignController(initialState)
                }).then( (deviceQueryData) => {
                    return this.generateNewDevice(discoveredDevice, deviceQueryData)
                }).then( (newDevice) => {
                    this.activeDevices[discoveredDevice.uniqueId] = newDevice;
                }).catch( (error) => {
                    const deviceData: types.IFailedDeviceProps = Object.assign(discoveredDevice, {latestScanTimestamp : Date.now()});
                    this.inactiveDeviceQueue.push(deviceData);
                })
            } else {
                //test for inconsistencies
            }
        }
    }

    async discoverDevices() {
        let discoveredDevices: types.IDeviceDiscoveredProps[] = await scan(2000);

        for(let scans = 0; scans < 5; scans++){

            if(discoveredDevices.length > 0) break;
            //this.logs.debug('( Scan: %o ) Discovered zero devices... rescanning...', scans + 1);
            discoveredDevices = await scan(2000);
          }
        
        return discoveredDevices;
    }

    async getState(ipAddress, _timeout = 500):Promise<types.ILightState | null>{

        const transport = new Transport(ipAddress);
        return new Promise((resolve, reject) => async function () {
            if(typeof ipAddress !== 'string' ){
        //   //this.logs.error('Cannot determine controller because invalid IP address. Device:', discoveredDevice);
                reject(null);
            }
            try{
                let scans = 0, data: Buffer;
            
                while(data == null && scans < 5){
                    data = await transport.getState(_timeout);
                    scans++;
                }
                
                if(data){
                    const state = parseState(data);
                    resolve (state);
                } else {
                    reject (null);
                }
            
            } catch (error) {
            // this.logs.debug(error);
            }

        });
    }

    async assignController(initialState: types.ILightState):Promise<types.IDeviceQueriedProps | null> {
        return new Promise((resolve, reject) => async function () {
        // this.logs.debug('Attempting to assign controller to new device: UniqueId: %o \nIpAddress %o \nModel: %o\nHardware Version: %o \nDevice Type: %o\n',
     
        // //set the lightVersion so that we can give the device a useful name and later how which protocol to use
        if(lightTypesMap.has(initialState.controllerHardwareVersion)){
        //   this.logs.debug('Device %o - Hardware Version: %o with Firmware Version: %o matches known device type records', 
        //     discoveredDevice.uniqueId,
        //     initialState.controllerHardwareVersion.toString(16),
        //     initialState.controllerFirmwareVersion.toString(16));
            const lightParameters: types.ILightParameters = lightTypesMap.get(initialState.controllerHardwareVersion);
            const deviceQueryData:types.IDeviceQueriedProps =  {lightParameters: lightParameters, lightState: initialState}
            resolve (deviceQueryData);
        } else {
        //   this.logs.warn('Unknown device version number: %o... unable to create accessory.' , controllerHardwareVersion.toString(16));
        //   this.logs.warn('Please create an issue at https://github.com/Zacknetic/HomebridgeMagicHome-DynamicPlatform/issues and upload your homebridge.log');
          reject (null);
        }
    
        // this.logs.debug('Controller Logic Type assigned to %o', lightParameters.controllerLogicType);
        
      });
    }

    async generateNewDevice(discoveredDevice: types.IDeviceDiscoveredProps, deviceQueryData:types.IDeviceQueriedProps):Promise<types.IDeviceProps | null>{
        return new Promise((resolve, reject) => async function () {
            const newProps = {
                UUID: discoveredDevice.uniqueId,
                cachedIPAddress: discoveredDevice.ipAddress,
                displayName: deviceQueryData.lightParameters.description,
                restartsSinceSeen: 0,
                lastKnownState: deviceQueryData.lightState
            }
            
            const newDevice: IDeviceProps = Object.assign(newProps, discoveredDevice, deviceQueryData);
            
          });
    }
}

function parseState(data: Buffer){
    let state: types.ILightState = {
        isOn: data.readUInt8(2) === 0x23,
        RGB: {
            red: data.readUInt8(6),
            green: data.readUInt8(7),
            blue: data.readUInt8(8),
          },
          whiteValues: {
            warmWhite: data.readUInt8(9),
            coldWhite: data.readUInt8(11),
          },
          controllerHardwareVersion: data.readUInt8(1),
          controllerFirmwareVersion: data.readUInt8(10),
          rawData: data,
    }
    return state;
}