import { IDeviceAPI } from './types';
declare const lightTypesMap: Map<number, IDeviceAPI>;
declare function getUniqueIdName(uniqueId: string, controllerLogicType: string | null): string;
export { lightTypesMap, getUniqueIdName };
