import { IDeviceParameters } from './types';
declare const lightTypesMap: Map<number, IDeviceParameters>;
declare function getUniqueIdName(uniqueId: string, controllerLogicType: string | null): string;
export { lightTypesMap, getUniqueIdName };
