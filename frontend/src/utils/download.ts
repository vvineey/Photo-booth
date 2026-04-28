export function createPhotoFilename(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `childrens-day-photo-${stamp}.png`;
}

export function downloadDataUrl(dataUrl: string, filename = createPhotoFilename()): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
