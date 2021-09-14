/**
 * Simple console logging class
 * Params: logLevel: number
 *      Level on a scale from 1-5. 5 being the most verbose, 1 being the least.
 */
export declare class Logs {
    private readonly logLevel;
    constructor(logLevel?: number);
    trace(message: any, ...parameters: any[]): void;
    debug(message: any, ...parameters: any[]): void;
    info(message: any, ...parameters: any[]): void;
    warn(message: any, ...parameters: any[]): void;
    error(message: any, ...parameters: any[]): void;
}
export declare function getLogs(): Logs;
