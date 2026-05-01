import { useMemo, useState } from 'react';
import { FOOTER_TEXT } from './constants/app';
import { FRAMES, getFrameById } from './constants/frames';
import { getLayoutById, LAYOUTS } from './constants/layouts';
import CameraPage from './pages/CameraPage';
import DoodlePage from './pages/DoodlePage';
import FramePage from './pages/FramePage';
import LayoutPage from './pages/LayoutPage';
import PreviewPage from './pages/PreviewPage';
import StartPage from './pages/StartPage';
import type { FrameId, LayoutId, Step } from './types/photoBooth';

export default function App() {
  const [step, setStep] = useState<Step>('start');
  const [layoutId, setLayoutId] = useState<LayoutId>('single');
  const [frameId, setFrameId] = useState<FrameId>('kitsch');
  const [photos, setPhotos] = useState<string[]>([]);
  const [finalImage, setFinalImage] = useState<string | null>(null);

  const layout = useMemo(() => getLayoutById(layoutId), [layoutId]);
  const frame = useMemo(() => getFrameById(frameId), [frameId]);

  const resetAll = () => {
    setStep('start');
    setLayoutId('single');
    setFrameId('kitsch');
    setPhotos([]);
    setFinalImage(null);
  };

  const retake = () => {
    setPhotos([]);
    setFinalImage(null);
    setStep('camera');
  };

  return (
    <main className="app-shell">
      {step === 'start' && <StartPage onStart={() => setStep('layout')} />}
      {step === 'layout' && (
        <LayoutPage
          layouts={LAYOUTS}
          selectedLayoutId={layoutId}
          onSelect={setLayoutId}
          onNext={() => setStep('frame')}
          onHome={resetAll}
        />
      )}
      {step === 'frame' && (
        <FramePage
          frames={FRAMES}
          selectedFrameId={frameId}
          onSelect={setFrameId}
          onBack={() => setStep('layout')}
          onNext={() => setStep('camera')}
          onHome={resetAll}
        />
      )}
      {step === 'camera' && (
        <CameraPage
          layout={layout}
          onDone={(capturedPhotos) => {
            setPhotos(capturedPhotos);
            setStep('doodle');
          }}
          onHome={resetAll}
        />
      )}
      {step === 'doodle' && (
        <DoodlePage
          layout={layout}
          frame={frame}
          photos={photos}
          footerText={FOOTER_TEXT}
          onRetake={retake}
          onHome={resetAll}
          onDone={(imageData) => {
            setFinalImage(imageData);
            setStep('preview');
          }}
        />
      )}
      {step === 'preview' && finalImage && (
        <PreviewPage imageData={finalImage} layout={layout} onRetake={retake} onHome={resetAll} />
      )}
    </main>
  );
}
