import PageHeader from '../components/PageHeader';
import { FRAMES } from '../constants/frames';

interface StartPageProps {
  onStart: () => void;
}

export default function StartPage({ onStart }: StartPageProps) {
  const previewFrames = [...FRAMES, ...FRAMES];

  return (
    <section className="screen start-screen">
      <div className="hero-art" aria-hidden="true">
        <span className="cloud">구름</span>
        <span className="rainbow" />
        <span className="sun">☺</span>
        <span className="mascot bunny" />
        <span className="mascot kitten" />
        <span className="hero-title">
          <b>어린이날</b>
          <b>포토부스</b>
        </span>
        <span className="mascot puppy" />
        <span className="mascot bear" />
        <span className="flower flower-left">✿</span>
        <span className="flower flower-right">✿</span>
      </div>
      <div className="frame-marquee" aria-label="프레임 미리보기">
        <div className="frame-marquee-track">
          {previewFrames.map((frame, index) => (
            <div className="moving-frame" key={`${frame.id}-${index}`}>
              <img src={frame.src} alt="" />
            </div>
          ))}
        </div>
      </div>
      <PageHeader
        eyebrow="5월 5일 어린이날"
        title="어린이날 포토부스"
        subtitle="동물 친구들과 사진을 찍고, 손그림 프레임으로 오늘의 추억을 완성해요."
      />
      <button className="primary big" onClick={onStart}>
        시작하기
      </button>
    </section>
  );
}
