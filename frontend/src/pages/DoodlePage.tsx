import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import ActionBar from '../components/ActionBar';
import PageHeader from '../components/PageHeader';
import { COLORS, PEN_WIDTH } from '../constants/app';
import type { BoothLayout, FrameOption } from '../types/photoBooth';
import { buildBasePreview, composeFinalImage } from '../utils/canvas';

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
  const drawingRef = useRef(false);
  const [basePreview, setBasePreview] = useState<string | null>(null);
  const [color, setColor] = useState(COLORS[2]);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    void buildBasePreview(layout, photos).then(setBasePreview);
  }, [layout, photos]);

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
        <div className="photo-editor" style={{ aspectRatio: `${layout.width} / ${layout.height}` }}>
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
          <img className="frame-layer" src={frame.src} alt="" />
          <div className="footer-preview">{footerText}</div>
        </div>
        <div className="tool-panel">
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
