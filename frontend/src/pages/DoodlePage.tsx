import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PointerEvent } from 'react';
import ActionBar from '../components/ActionBar';
import PageHeader from '../components/PageHeader';
import { COLORS, PEN_WIDTH } from '../constants/app';
import type { BoothLayout, FrameOption } from '../types/photoBooth';
import { buildBasePreview, composeFinalImage } from '../utils/canvas';

const MEDIAPIPE_VERSION = '0.10.35';
const VISION_TASKS_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;
const HAND_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const PINCH_THRESHOLD = 0.055;
const HAND_SMOOTHING = 0.35;

type DoodleMode = 'direct' | 'hand';
type HandStatus = 'idle' | 'loading' | 'ready' | 'drawing' | 'error';

interface HandPoint {
  x: number;
  y: number;
}

interface HandLandmarkerModule {
  FilesetResolver: {
    forVisionTasks: (basePath: string) => Promise<unknown>;
  };
  HandLandmarker: {
    createFromOptions: (
      vision: unknown,
      options: Record<string, unknown>
    ) => Promise<{
      detectForVideo: (video: HTMLVideoElement, startTimeMs: number) => { landmarks?: Array<Array<{ x: number; y: number }>> };
    }>;
  };
}

interface DoodlePageProps {
  layout: BoothLayout;
  frame: FrameOption;
  photos: string[];
  footerText: string;
  onDone: (imageData: string) => void;
  onRetake: () => void;
  onHome: () => void;
}

export default function DoodlePage({ layout, frame, photos, footerText, onDone, onRetake, onHome }: DoodlePageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handVideoRef = useRef<HTMLVideoElement | null>(null);
  const handStreamRef = useRef<MediaStream | null>(null);
  const handLandmarkerRef = useRef<Awaited<ReturnType<HandLandmarkerModule['HandLandmarker']['createFromOptions']>> | null>(null);
  const handAnimationRef = useRef<number | null>(null);
  const handDrawingRef = useRef(false);
  const smoothedHandPointRef = useRef<HandPoint | null>(null);
  const handStatusRef = useRef<HandStatus>('idle');
  const colorRef = useRef(COLORS[2]);
  const drawingRef = useRef(false);
  const [basePreview, setBasePreview] = useState<string | null>(null);
  const [doodleMode, setDoodleMode] = useState<DoodleMode>('direct');
  const [handStatus, setHandStatus] = useState<HandStatus>('idle');
  const [handCursor, setHandCursor] = useState<HandPoint | null>(null);
  const [color, setColor] = useState(COLORS[2]);
  const [isComposing, setIsComposing] = useState(false);
  const frameStyle = {
    '--frame-ratio': `${layout.width / layout.height}`,
    aspectRatio: `${layout.width} / ${layout.height}`
  } as CSSProperties;
  const handStatusText =
    {
      idle: '',
      loading: '손 인식 준비 중',
      ready: '손 감지 중',
      drawing: '그리는 중',
      error: '손 인식을 시작할 수 없어요'
    }[handStatus] ?? '';

  const updateHandStatus = (nextStatus: HandStatus) => {
    if (handStatusRef.current === nextStatus) {
      return;
    }
    handStatusRef.current = nextStatus;
    setHandStatus(nextStatus);
  };

  useEffect(() => {
    void buildBasePreview(layout, photos).then(setBasePreview);
  }, [layout, photos]);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    canvas.width = layout.width;
    canvas.height = layout.height;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = PEN_WIDTH;
  }, [layout]);

  const stopHandMode = (resetState = true) => {
    if (handAnimationRef.current !== null) {
      window.cancelAnimationFrame(handAnimationRef.current);
      handAnimationRef.current = null;
    }
    handStreamRef.current?.getTracks().forEach((track) => track.stop());
    handStreamRef.current = null;
    handLandmarkerRef.current = null;
    handDrawingRef.current = false;
    smoothedHandPointRef.current = null;
    if (resetState) {
      setHandCursor(null);
    }
    if (handVideoRef.current) {
      handVideoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (doodleMode !== 'hand') {
      stopHandMode();
      updateHandStatus('idle');
      return;
    }

    let isCancelled = false;

    const trackHands = () => {
      const video = handVideoRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      const handLandmarker = handLandmarkerRef.current;

      if (!video || !canvas || !context || !handLandmarker || isCancelled) {
        return;
      }

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const result = handLandmarker.detectForVideo(video, performance.now());
        const landmarks = result.landmarks?.[0];
        const indexTip = landmarks?.[8];
        const thumbTip = landmarks?.[4];

        if (indexTip && thumbTip) {
          const rawPoint = {
            x: (1 - indexTip.x) * canvas.width,
            y: indexTip.y * canvas.height
          };
          const previousPoint = smoothedHandPointRef.current;
          const point = previousPoint
            ? {
                x: previousPoint.x + (rawPoint.x - previousPoint.x) * HAND_SMOOTHING,
                y: previousPoint.y + (rawPoint.y - previousPoint.y) * HAND_SMOOTHING
              }
            : rawPoint;
          const pinchDistance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
          const isPinching = pinchDistance < PINCH_THRESHOLD;

          smoothedHandPointRef.current = point;
          setHandCursor({ x: (point.x / canvas.width) * 100, y: (point.y / canvas.height) * 100 });

          if (isPinching) {
            context.strokeStyle = colorRef.current;
            context.lineWidth = PEN_WIDTH;
            if (!handDrawingRef.current) {
              context.beginPath();
              context.moveTo(point.x, point.y);
            } else {
              context.lineTo(point.x, point.y);
              context.stroke();
            }
            handDrawingRef.current = true;
            updateHandStatus('drawing');
          } else {
            handDrawingRef.current = false;
            updateHandStatus('ready');
          }
        } else {
          handDrawingRef.current = false;
          smoothedHandPointRef.current = null;
          setHandCursor(null);
          updateHandStatus('ready');
        }
      }

      handAnimationRef.current = window.requestAnimationFrame(trackHands);
    };

    const startHandMode = async () => {
      try {
        updateHandStatus('loading');
        const moduleUrl = `${VISION_TASKS_URL}/vision_bundle.mjs`;
        const { FilesetResolver, HandLandmarker } = (await import(/* @vite-ignore */ moduleUrl)) as HandLandmarkerModule;
        const vision = await FilesetResolver.forVisionTasks(`${VISION_TASKS_URL}/wasm`);
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: HAND_MODEL_URL,
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1
        });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 960 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        handLandmarkerRef.current = handLandmarker;
        handStreamRef.current = stream;

        if (handVideoRef.current) {
          handVideoRef.current.srcObject = stream;
          await handVideoRef.current.play();
        }

        if (!isCancelled) {
          updateHandStatus('ready');
          handAnimationRef.current = window.requestAnimationFrame(trackHands);
        }
      } catch (error) {
        console.error('Hand drawing mode failed:', error);
        stopHandMode();
        updateHandStatus('error');
      }
    };

    void startHandMode();

    return () => {
      isCancelled = true;
      stopHandMode(false);
    };
  }, [doodleMode]);

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (doodleMode !== 'direct') {
      return;
    }

    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      return;
    }

    const point = getPoint(event);
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (doodleMode !== 'direct') {
      return;
    }

    if (!drawingRef.current) {
      return;
    }

    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      return;
    }

    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const clearDoodle = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const finish = async () => {
    if (!canvasRef.current) {
      return;
    }

    setIsComposing(true);
    const doodleDataUrl = canvasRef.current.toDataURL('image/png');
    const imageData = await composeFinalImage({
      layout,
      photos,
      doodleDataUrl,
      frameSrc: frame.src,
      footerText
    });
    setIsComposing(false);
    onDone(imageData);
  };

  return (
    <section className="screen editor-screen">
      <PageHeader eyebrow="4단계" title="낙서하기" subtitle="사진 위에 마음껏 그려주세요." />
      <div className="editor-layout">
        <div className="photo-editor frame-preview" style={frameStyle}>
          {basePreview && <img className="preview-layer" src={basePreview} alt="" />}
          <canvas
            ref={canvasRef}
            className="doodle-layer"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
          />
          {doodleMode === 'hand' && handCursor && (
            <div
              className={`hand-cursor ${handStatus === 'drawing' ? 'drawing' : ''}`}
              style={{ left: `${handCursor.x}%`, top: `${handCursor.y}%` }}
            />
          )}
          <img className="frame-layer" src={frame.src} alt="" />
          <div className="footer-preview">{footerText}</div>
        </div>
        <div className="tool-panel">
          <div className="mode-toggle" aria-label="낙서 모드">
            <button className={doodleMode === 'direct' ? 'selected' : ''} onClick={() => setDoodleMode('direct')}>
              직접 그리기
            </button>
            <button className={doodleMode === 'hand' ? 'selected' : ''} onClick={() => setDoodleMode('hand')}>
              손으로 그리기
            </button>
          </div>
          {doodleMode === 'hand' && (
            <div className="hand-panel">
              <video ref={handVideoRef} className="hand-video" autoPlay muted playsInline />
              <div className={`hand-status ${handStatus}`}>{handStatusText}</div>
            </div>
          )}
          <div className="palette" aria-label="색상 팔레트">
            {COLORS.map((nextColor) => (
              <button
                key={nextColor}
                className={`swatch ${color === nextColor ? 'selected' : ''}`}
                style={{ backgroundColor: nextColor }}
                onClick={() => setColor(nextColor)}
                aria-label={`색상 ${nextColor}`}
              />
            ))}
          </div>
          <button className="secondary wide" onClick={clearDoodle}>
            전체 지우기
          </button>
        </div>
      </div>
      <ActionBar>
        <button className="secondary" onClick={onHome}>
          처음으로
        </button>
        <button className="secondary" onClick={onRetake}>
          다시 찍기
        </button>
        <button className="primary" onClick={finish} disabled={isComposing}>
          {isComposing ? '만드는 중' : '최종 미리보기'}
        </button>
      </ActionBar>
    </section>
  );
}
