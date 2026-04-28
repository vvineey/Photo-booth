import type { UploadedPhotoResponse } from '../types/photoBooth';

export function getApiBaseUrl(): string {
  const host = window.location.hostname || 'localhost';
  return `http://${host}:4000`;
}

export async function uploadPhoto(imageData: string): Promise<UploadedPhotoResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/photos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ imageData })
  });

  if (!response.ok) {
    throw new Error('사진 업로드에 실패했습니다.');
  }

  return response.json() as Promise<UploadedPhotoResponse>;
}
