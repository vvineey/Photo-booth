import ActionBar from '../components/ActionBar';
import PageHeader from '../components/PageHeader';
import type { FrameId, FrameOption } from '../types/photoBooth';

interface FramePageProps {
  frames: FrameOption[];
  selectedFrameId: FrameId;
  onSelect: (frameId: FrameId) => void;
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
}

export default function FramePage({ frames, selectedFrameId, onSelect, onBack, onNext, onHome }: FramePageProps) {
  return (
    <section className="screen">
      <PageHeader eyebrow="2단계" title="프레임 선택" subtitle="사진 위에 덮을 장식을 골라주세요." />
      <div className="frame-grid">
        {frames.map((frame) => (
          <button
            key={frame.id}
            className={`frame-card ${selectedFrameId === frame.id ? 'selected' : ''}`}
            onClick={() => onSelect(frame.id)}
          >
            <span className="frame-thumb">
              <img src={frame.src} alt="" />
            </span>
            <strong>{frame.name}</strong>
            <small>{frame.description}</small>
          </button>
        ))}
      </div>
      <ActionBar>
        <button className="secondary" onClick={onHome}>
          처음으로
        </button>
        <button className="secondary" onClick={onBack}>
          이전
        </button>
        <button className="primary" onClick={onNext}>
          촬영하기
        </button>
      </ActionBar>
    </section>
  );
}
