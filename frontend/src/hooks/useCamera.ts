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

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('이 브라우저에서는 카메라 API를 사용할 수 없습니다. localhost 주소인지 확인해 주세요.');
        setIsReady(false);
        return;
      }

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
    } catch (error) {
      console.error('Camera start failed:', error);
      const errorName = error instanceof DOMException ? error.name : '';

      if (errorName === 'NotAllowedError') {
        setError('카메라 권한이 차단되어 있습니다. 주소창 왼쪽 아이콘에서 카메라를 허용한 뒤 다시 시도해 주세요.');
      } else if (errorName === 'NotFoundError') {
        setError('사용 가능한 카메라를 찾을 수 없습니다. 카메라 연결 상태를 확인해 주세요.');
      } else if (errorName === 'NotReadableError') {
        setError('카메라를 다른 앱이나 탭에서 사용 중입니다. 다른 카메라 앱을 종료한 뒤 다시 시도해 주세요.');
      } else {
        setError('카메라를 시작할 수 없습니다. 브라우저 권한을 확인한 뒤 다시 시도해 주세요.');
      }
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
