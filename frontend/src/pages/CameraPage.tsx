import { useEffect, useRef, useState } from 'react';
import ActionBar from '../components/ActionBar';
import PageHeader from '../components/PageHeader';
import { COUNTDOWN_SECONDS } from '../constants/app';
import { useCamera } from '../hooks/useCamera';
import type { BoothLayout } from '../types/photoBooth';
import { captureMirroredVideoFrame, getPhotoPlacements } from '../utils/canvas';

interface CameraPageProps {
  layout: BoothLayout;
  onDone: (photos: string[]) => void;
  onHome: () => void;
}

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export default function CameraPage({ layout, onDone, onHome }: CameraPageProps) {
  const { videoRef, error, isReady, startCamera, stopCamera } = useCamera();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedCount, setCapturedCount] = useState(0);
  const [isShooting, setIsShooting] = useState(false);
  const isCancelledRef = useRef(false);
  const photoPlacement = getPhotoPlacements(layout)[0];
  const photoRatio = photoPlacement.width / photoPlacement.height;

  useEffect(() => {
    isCancelledRef.current = false;
    void startCamera();

    return () => {
      isCancelledRef.current = true;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const runCountdown = async () => {
    for (let value = COUNTDOWN_SECONDS; value >= 1; value -= 1) {
      if (isCancelledRef.current) {
        return;
      }
      setCountdown(value);
      await wait(1000);
    }
    setCountdown(null);
  };

  const startShooting = async () => {
    if (!videoRef.current || !isReady || isShooting) {
      return;
    }

    setIsShooting(true);
    setCapturedCount(0);
    const nextPhotos: string[] = [];

    for (let index = 0; index < layout.shotCount; index += 1) {
      await runCountdown();
      if (!videoRef.current || isCancelledRef.current) {
        return;
      }

      nextPhotos.push(captureMirroredVideoFrame(videoRef.current, photoRatio));
      setCapturedCount(nextPhotos.length);
      await wait(450);
    }

    stopCamera();
    onDone(nextPhotos);
  };

  return (
    <section className="screen camera-screen">
      <PageHeader
        eyebrow="3단계"
        title="촬영"
        subtitle={`${layout.name} · ${capturedCount}/${layout.shotCount}컷 완료`}
      />
      <div className="camera-stage" style={{ aspectRatio: `${photoPlacement.width} / ${photoPlacement.height}` }}>
        {error ? (
          <div className="camera-error">{error}</div>
        ) : (
          <video ref={videoRef} className="camera-video" autoPlay muted playsInline />
        )}
        {countdown !== null && <div className="countdown">{countdown}</div>}
      </div>
      <ActionBar>
        <button className="secondary" onClick={onHome} disabled={isShooting}>
          처음으로
        </button>
        <button className="primary" onClick={startShooting} disabled={!isReady || isShooting}>
          {isShooting ? '촬영 중' : '촬영 시작'}
        </button>
      </ActionBar>
    </section>
  );
}
