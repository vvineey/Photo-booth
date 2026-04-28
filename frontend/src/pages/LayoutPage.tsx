import ActionBar from '../components/ActionBar';
import PageHeader from '../components/PageHeader';
import type { BoothLayout, LayoutId } from '../types/photoBooth';

interface LayoutPageProps {
  layouts: BoothLayout[];
  selectedLayoutId: LayoutId;
  onSelect: (layoutId: LayoutId) => void;
  onNext: () => void;
  onHome: () => void;
}

export default function LayoutPage({ layouts, selectedLayoutId, onSelect, onNext, onHome }: LayoutPageProps) {
  return (
    <section className="screen">
      <PageHeader eyebrow="1단계" title="레이아웃 선택" subtitle="출력할 사진 모양을 골라주세요." />
      <div className="option-grid">
        {layouts.map((layout) => (
          <button
            key={layout.id}
            className={`choice-card ${selectedLayoutId === layout.id ? 'selected' : ''}`}
            onClick={() => onSelect(layout.id)}
          >
            <span className={`layout-preview ${layout.id}`}>
              {Array.from({ length: layout.shotCount }).map((_, index) => (
                <span key={index} />
              ))}
            </span>
            <strong>{layout.name}</strong>
            <small>{layout.ratioLabel}</small>
          </button>
        ))}
      </div>
      <ActionBar>
        <button className="secondary" onClick={onHome}>
          처음으로
        </button>
        <button className="primary" onClick={onNext}>
          다음
        </button>
      </ActionBar>
    </section>
  );
}
