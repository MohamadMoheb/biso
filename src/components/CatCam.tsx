import type { CatSnap } from '../catcam/storage';

export type CatCamProps = {
  enabled: boolean;
  paused: boolean;
  mode: CatSnap['mode'];
  onSnap?: (snap: CatSnap) => void;
};

/**
 * Web stub — expo-camera's web barcode path breaks Metro
 * (`barcode-detector` resolution). Cat Cam is device-only.
 */
export function CatCam(_props: CatCamProps) {
  return null;
}
