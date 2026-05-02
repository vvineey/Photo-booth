import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isShooting, setIsShooting] = useState(false);
  const isCancelledRef = useRef(false);
  const photoPlacement = getPhotoPlacements(layout)[0];
  const photoRatio = photoPlacement.width / photoPlacement.height;
  const activeShotIndex = isShooting ? Math.min(capturedCount, layout.shotCount - 1) : null;
  const cameraFrameStyle = {
    '--camera-ratio': `${photoRatio}`,
    aspectRatio: `${photoPlacement.width} / ${photoPlacement.height}`
  } as CSSProperties;

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
    setCapturedPhotos([]);
    const nextPhotos: string[] = [];

    for (let index = 0; index < layout.shotCount; index += 1) {
      await runCountdown();
      if (!videoRef.current || isCancelledRef.current) {
        return;
      }

      nextPhotos.push(captureMirroredVideoFrame(videoRef.current, photoRatio));
      setCapturedPhotos([...nextPhotos]);
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
      <div className="camera-layout">
        <div className="camera-stage" style={cameraFrameStyle}>
          {error ? (
            <div className="camera-error">
              <p>{error}</p>
              <button onClick={startCamera} type="button">
                다시 시도
              </button>
            </div>
          ) : (
            <video ref={videoRef} className="camera-video" autoPlay muted playsInline />
          )}
        </div>
        <aside className="camera-side-panel">
          <div className="countdown-card" aria-live="polite">
            <span className="countdown-label">카운트다운</span>
            <strong>{countdown ?? '-'}</strong>
          </div>
          <div className="shot-progress">
            <strong>
              {Math.min(capturedCount + (isShooting && capturedCount < layout.shotCount ? 1 : 0), layout.shotCount)}/
              {layout.shotCount}
            </strong>
            <span>현재 촬영 위치</span>
          </div>
          <div className={`shot-preview-grid ${layout.id}`}>
            {Array.from({ length: layout.shotCount }, (_, index) => (
              <div
                key={index}
                className={`shot-preview-slot ${activeShotIndex === index ? 'active' : ''} ${
                  capturedPhotos[index] ? 'filled' : ''
                }`}
                style={{ aspectRatio: `${photoPlacement.width} / ${photoPlacement.height}` }}
              >
                {capturedPhotos[index] ? (
                  <img src={capturedPhotos[index]} alt={`${index + 1}번째 촬영 미리보기`} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
            ))}
          </div>
        </aside>
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
