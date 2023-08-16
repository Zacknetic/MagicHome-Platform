import { COLOR_MASKS, IColorCCT, IColorRGB, ICompleteResponse, IDeviceCommand, IDeviceState } from "magichome-core";
import { IColorHSV, IColorTB } from "./types";

export function convertCCTValueToDualWhite(_cctValue) {
  const cctValue = _cctValue - 140;
  let multiplier = 0;
  const CCT = { warmWhite: 0, coldWhite: 0 };

  const threshold = 110;
  if (cctValue >= threshold) {
    CCT.warmWhite = 127;
    multiplier = 1 - (cctValue - threshold) / (360 - threshold);
    CCT.coldWhite = Math.round(127 * multiplier);
  } else {
    CCT.coldWhite = 127;
    multiplier = cctValue / threshold;
    CCT.warmWhite = Math.round(127 * multiplier);
  }
  return CCT;
}

export function CCTtoTB(CCT: IColorCCT): IColorTB {
  const { warmWhite, coldWhite } = CCT;
  let temperature = 0;
  let brightness = 0;

  // Calculate the total CCT value
  const totalCCT = warmWhite + coldWhite;

  // Calculate the temperature based on the total CCT value
  if (totalCCT <= 255) {
    temperature = 90 + Math.round((totalCCT / 255) * 90);
  } else if (totalCCT > 255 && totalCCT <= 510) {
    temperature = 180 + Math.round(((totalCCT - 255) / 255) * 90);
  }

  // Calculate the brightness based on the coldWhite value
  brightness = Math.round(Math.max((coldWhite / 255) * 100, (warmWhite / 255) * 100));

  // Return the temperature and brightness as a TB value
  return { temperature, brightness };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function HSVtoRGB(HSV: IColorHSV): IColorRGB {
  const { hue, saturation, value }: IColorHSV = HSV;
  let [H, S, V] = [hue, saturation, value];
  H = clamp(H, 0, 360);
  S = clamp(S, 0, 100);
  V = clamp(V, 0, 100);

  S /= 100.0;
  V /= 100.0;
  const C = V * S;
  const X = C * (1 - Math.abs(((H / 60) % 2) - 1));
  const m = V - C;

  let order;
  if (H < 60) order = [C, X, 0];
  else if (H < 120) order = [X, C, 0];
  else if (H < 180) order = [0, C, X];
  else if (H < 240) order = [0, X, C];
  else if (H < 300) order = [X, 0, C];
  else if (H <= 360) order = [C, 0, X];

  const [dR, dG, dB] = order;
  const [red, green, blue] = [Math.round((dR + m) * 255), Math.round((dG + m) * 255), Math.round((dB + m) * 255)];

  return { red, green, blue };
}

export function RGBtoHSV(RGB: IColorRGB): IColorHSV {
  const { red, green, blue }: IColorRGB = RGB;


  const [R, G, B] = [red, green, blue];
  const [dR, dG, dB] = [R / 255, G / 255, B / 255];

  const Dmax = Math.max(dR, dG, dB);
  const Dmin = Math.min(dR, dG, dB);
  const D = Dmax - Dmin;

  let H, S, V;
  if (D === 0) H = 0;
  else if (Dmax === dR) H = ((dG - dB) / D) % 6;
  else if (Dmax === dG) H = (dB - dR) / D + 2;
  else H = (dR - dG) / D + 4;
  H *= 60;
  if (H < 0) H += 360;
  V = Dmax;
  if (V === 0) S = 0;
  else S = D / V;

  S *= 100;
  V *= 100;

  return { hue: H, saturation: S, value: V };
}

export function TBtoCCT(TB: IColorTB): IColorCCT {
  let multiplier = 1;
  let warmWhite = 0,
    coldWhite = 0;
  let { temperature, brightness } = TB;
  temperature -= 140;

  if (temperature <= 90) {
    //if hue is <= 90, warmWhite value is full and we determine the coldWhite value based on Hue
    multiplier = temperature / 90;
    coldWhite = Math.round(255 * multiplier);
    warmWhite = 255;
  } else if (temperature > 270) {
    //if hue is >270, warmWhite value is full and we determine the coldWhite value based on Hue
    multiplier = 1 - (temperature - 270) / 90;
    coldWhite = Math.round(255 * multiplier);
    warmWhite = 255;
  } else if (temperature > 180 && temperature <= 270) {
    //if hue is > 180 and <= 270, coldWhite value is full and we determine the warmWhite value based on Hue
    multiplier = (temperature - 180) / 90;
    warmWhite = Math.round(255 * multiplier);
    coldWhite = 255;
  } else if (temperature > 90 && temperature <= 180) {
    //if hue is > 90 and <= 180, coldWhite value is full and we determine the warmWhite value based on Hue
    multiplier = 1 - (temperature - 90) / 90;
    warmWhite = Math.round(255 * multiplier);
    coldWhite = 255;
  }
  const CCT = { warmWhite: Math.round((warmWhite * brightness) / 100), coldWhite: Math.round((coldWhite * brightness) / 100) };
  return CCT;
} //TBtoCCT

// ColorConversionUtils.ts

// // RGB to HSV
// export function RGBStriptoHSV(rgb: { red: number; green: number; blue: number }, previousHue: number): { hue: number; saturation: number; value: number } {
//   // Conversion code here
// }

// // HSV to RGB
// export function HSVtoRGBStrip(hsv: { hue: number; saturation: number; value: number }): { red: number; green: number; blue: number } {
//   // Conversion code here
// }

// // RGBW to HSV (non-simultaneous)
// export function RGBWtoHSVNonSimultaneous(deviceCommand: IDeviceCommand, previousHue: number): { hue: number; saturation: number; value: number } {
//   // Conversion code here
// }

// // HSV to RGBW (non-simultaneous)
// export function HSVtoRGBWNonSimultaneous(hsv: { hue: number; saturation: number; value: number }): IDeviceCommand {
//   // Conversion code here
// }

// // RGBW to HSV (simultaneous)
// export function RGBWtoHSVSimultaneous(deviceCommand: IDeviceCommand, previousHue: number): { hue: number; saturation: number; value: number } {
//   // Conversion code here
// }

// // HSV to RGBW (simultaneous)
// export function HSVtoRGBWSimultaneous(hsv: { hue: number; saturation: number; value: number }): IDeviceCommand {
//   // Conversion code here
// }

// // RGBWC to HSV (non-simultaneous)
// export function RGBWCtoHSVNonSimultaneous(deviceCommand: IDeviceCommand, previousHue: number): IColorHSV {}

// // HSV to RGBWC (non-simultaneous)
// export function HSVtoRGBWCNonSimultaneous(hsv: { hue: number; saturation: number; value: number }): IDeviceCommand {
//   // Conversion code here
// }

// // RGBWC to HSV (simultaneous)
// export function RGBWCtoHSVSimultaneous(deviceState: IDeviceState, previousHue: number = null): IColorHSV {

//   const {
//     RGB: { red, green, blue },
//     CCT: { coldWhite, warmWhite },
//   } = deviceState;
//   let { hue, saturation, value } = RGBtoHSV({ red, green, blue });
//   if (previousHue !== null) {
//     hue = previousHue;
//   }

//   if (Math.max(coldWhite, warmWhite) > 0) {
//     const { brightness, temperature } = CCTtoTB({ coldWhite, warmWhite });
//   }
//   // Conversion code here
// }

// // HSV to RGBWC (simultaneous)
// export function HSVtoRGBWCSimultaneous(hsv: { hue: number; saturation: number; value: number }): IDeviceCommand {
//   // Conversion code here
// }
