import {  ColorCCT, ColorRGB  } from "magichome-core";
import { ColorHSV, ColorTB } from "../models/types";

export function convertCCTValueToDualWhite(_cctValue: number) {
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

export function TBtoCCT(tb: ColorTB): ColorCCT {
  const { temperature, brightness } = tb;

  // Normalize temperature from 140–500 → 0–1
  const tNorm = (temperature - 140) / (500 - 140);

  let warmWhite = 0;
  let coldWhite = 0;

  if (tNorm <= 0.5) {
    // Cold white is full, warm white ramps up
    coldWhite = 255;
    warmWhite = Math.round(255 * (tNorm / 0.5));
  } else {
    // Warm white is full, cold white ramps down
    warmWhite = 255;
    coldWhite = Math.round(255 * ((1 - tNorm) / 0.5));
  }

  return {
    warmWhite: Math.round((warmWhite * brightness) / 100),
    coldWhite: Math.round((coldWhite * brightness) / 100),
  };
}

export function CCTtoTB(cct: ColorCCT): ColorTB {
  const { warmWhite, coldWhite } = cct;

  if (warmWhite === 0 && coldWhite === 0) {
    return { temperature: 140, brightness: 0 };
  }

  const brightness = Math.max(warmWhite, coldWhite) / 255 * 100;

  const warmFull = warmWhite / (brightness / 100);
  const coldFull = coldWhite / (brightness / 100);

  let tNorm = 0;

  if (warmFull >= 255) {
    tNorm = 1 - (coldFull / 255) * 0.5;
  } else if (coldFull >= 255) {
    tNorm = (warmFull / 255) * 0.5;
  } else {
    // Fallback (balanced): estimate by warm vs total
    tNorm = warmFull / (warmFull + coldFull);
  }

  const temperature = 140 + tNorm * (500 - 140);

  return {
    temperature: Math.round(temperature),
    brightness: Math.round(brightness),
  };
}


export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function HSVtoRGB(HSV: ColorHSV): ColorRGB {
  const { hue, saturation, value }: ColorHSV = HSV;
  let [H, S, V] = [hue, saturation, value];
  H = clamp(H, 0, 360);
  S = clamp(S, 0, 100);
  V = clamp(V, 0, 100);

  S /= 100.0;
  V /= 100.0;
  const C = V * S;
  const X = C * (1 - Math.abs(((H / 60) % 2) - 1));
  const m = V - C;
  let order: number[] = []; // Initialize order as an empty array
  if (H < 60) order = [C, X, 0];
  else if (H < 120) order = [X, C, 0];
  else if (H < 180) order = [0, C, X];
  else if (H < 240) order = [0, X, C];
  else if (H < 300) order = [X, 0, C];
  else if (H <= 360) order = [C, 0, X];


  const [dR, dG, dB] = order as [number, number, number];
  const [red, green, blue] = [Math.round((dR + m) * 255), Math.round((dG + m) * 255), Math.round((dB + m) * 255)];

  return { red, green, blue };
}

export function RGBtoHSV(RGB: ColorRGB): ColorHSV {
  const { red, green, blue }: ColorRGB = RGB;


  const [R, G, B] = [red, green, blue];
  const [dR, dG, dB] = [R / 255, G / 255, B / 255];

  const dMax = Math.max(dR, dG, dB);
  const dMin = Math.min(dR, dG, dB);
  const D = dMax - dMin;

  let H, S, V;
  if (D === 0) H = 0;
  else if (dMax === dR) H = ((dG - dB) / D) % 6;
  else if (dMax === dG) H = (dB - dR) / D + 2;
  else H = (dR - dG) / D + 4;
  H *= 60;
  if (H < 0) H += 360;
  V = dMax;
  if (V === 0) S = 0;
  else S = D / V;

  S *= 100;
  V *= 100;

  return { hue: H, saturation: S, value: V };
}



// ColorConversionUtils.ts

// // RGB to HSV
// export function RGBStripToHSV(rgb: { red: number; green: number; blue: number }, previousHue: number): { hue: number; saturation: number; value: number } {
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
