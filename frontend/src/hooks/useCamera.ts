import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface UseCameraResult {
  videoRef: RefObject<HTMLVideoElement | null>;
  error: string | null;
  isReady: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsReady(true);
    } catch {
      setError('카메라 권한을 허용해 주세요. iPad Safari에서는 주소창의 aA 또는 설정에서 카메라 권한을 확인할 수 있습니다.');
      setIsReady(false);
    }
  }, [stopCamera]);

  return {
    videoRef,
    error,
    isReady,
    startCamera,
    stopCamera
  };
}
