import PageHeader from '../components/PageHeader';

interface StartPageProps {
  onStart: () => void;
}

export default function StartPage({ onStart }: StartPageProps) {
  return (
    <section className="screen start-screen">
      <div className="hero-art" aria-hidden="true">
        <span className="sun">★</span>
        <span className="rainbow">Children's Day</span>
        <span className="flower">✿</span>
      </div>
      <PageHeader
        eyebrow="어린이날 부스"
        title="포토부스"
        subtitle="사진을 찍고, 낙서하고, 귀여운 프레임으로 완성해요."
      />
      <button className="primary big" onClick={onStart}>
        시작하기
      </button>
    </section>
  );
}
