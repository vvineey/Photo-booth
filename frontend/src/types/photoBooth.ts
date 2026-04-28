export type LayoutId = 'single' | 'quad';

export type Step = 'start' | 'layout' | 'frame' | 'camera' | 'doodle' | 'preview';

export type FrameId = string;

export interface FrameOption {
  id: FrameId;
  name: string;
  description: string;
  src: string;
}

export interface BoothLayout {
  id: LayoutId;
  name: string;
  ratioLabel: string;
  width: number;
  height: number;
  shotCount: number;
}

export interface PhotoPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ComposeOptions {
  layout: BoothLayout;
  photos: string[];
  doodleDataUrl?: string;
  frameSrc: string;
  footerText: string;
}

export interface UploadedPhotoResponse {
  url: string;
  filename: string;
}
