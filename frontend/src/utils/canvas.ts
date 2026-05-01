import type { BoothLayout, ComposeOptions, PhotoPlacement } from '../types/photoBooth';

export function getPhotoPlacements(layout: BoothLayout): PhotoPlacement[] {
  if (layout.id === 'single') {
    const margin = Math.round(layout.width * 0.09);
    return [
      {
        x: margin,
        y: Math.round(layout.height * 0.08),
        width: layout.width - margin * 2,
        height: Math.round(layout.height * 0.72)
      }
    ];
  }

  const margin = Math.round(layout.width * 0.08);
  const gap = Math.round(layout.width * 0.045);
  const photoWidth = Math.round((layout.width - margin * 2 - gap) / 2);
  const photoHeight = Math.round((layout.height * 0.78 - gap) / 2);
  const top = Math.round(layout.height * 0.06);

  return [
    { x: margin, y: top, width: photoWidth, height: photoHeight },
    { x: margin + photoWidth + gap, y: top, width: photoWidth, height: photoHeight },
    { x: margin, y: top + photoHeight + gap, width: photoWidth, height: photoHeight },
    { x: margin + photoWidth + gap, y: top + photoHeight + gap, width: photoWidth, height: photoHeight }
  ];
}

export function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  target: PhotoPlacement
): void {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = target.width / target.height;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }

  context.drawImage(image, sx, sy, sw, sh, target.x, target.y, target.width, target.height);
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

export async function drawBasePhoto(context: CanvasRenderingContext2D, layout: BoothLayout, photos: string[]): Promise<void> {
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, layout.width, layout.height);

  const placements = getPhotoPlacements(layout);
  const photoImages = await Promise.all(photos.map((photo) => loadImage(photo)));

  placements.forEach((placement, index) => {
    context.fillStyle = '#f4f7fb';
    context.fillRect(placement.x, placement.y, placement.width, placement.height);

    const image = photoImages[index];
    if (!image) {
      return;
    }

    drawCoverImage(context, image, image.naturalWidth, image.naturalHeight, placement);
  });
}

export async function composeFinalImage(options: ComposeOptions): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = options.layout.width;
  canvas.height = options.layout.height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas is not available.');
  }

  await drawBasePhoto(context, options.layout, options.photos);

  if (options.doodleDataUrl) {
    const doodle = await loadImage(options.doodleDataUrl);
    context.drawImage(doodle, 0, 0, options.layout.width, options.layout.height);
  }

  const frame = await loadImage(options.frameSrc);
  context.drawImage(frame, 0, 0, options.layout.width, options.layout.height);

  context.fillStyle = '#27324a';
  context.font = `700 ${Math.round(options.layout.width * 0.045)}px "Arial", sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(options.footerText, options.layout.width / 2, options.layout.height * 0.9);

  return canvas.toDataURL('image/png');
}

export async function buildBasePreview(layout: BoothLayout, photos: string[]): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas is not available.');
  }

  await drawBasePhoto(context, layout, photos);
  return canvas.toDataURL('image/png');
}

export function captureMirroredVideoFrame(video: HTMLVideoElement, targetRatio = video.videoWidth / video.videoHeight): string {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  const sourceRatio = sourceWidth / sourceHeight;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas is not available.');
  }

  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/png');
}
