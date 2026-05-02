import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import ActionBar from '../components/ActionBar';
import PageHeader from '../components/PageHeader';
import type { BoothLayout, UploadedPhotoResponse } from '../types/photoBooth';
import { uploadPhoto } from '../utils/api';
import { downloadDataUrl } from '../utils/download';

interface PreviewPageProps {
  imageData: string;
  layout: BoothLayout;
  onRetake: () => void;
  onHome: () => void;
}

export default function PreviewPage({ imageData, layout, onRetake, onHome }: PreviewPageProps) {
  const [uploadedPhoto, setUploadedPhoto] = useState<UploadedPhotoResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const frameStyle = {
    '--frame-ratio': `${layout.width / layout.height}`,
    aspectRatio: `${layout.width} / ${layout.height}`
  } as CSSProperties;

  const saveQrPhoto = useCallback(() => {
    setUploadedPhoto(null);
    setUploadError(null);

    void uploadPhoto(imageData)
      .then(setUploadedPhoto)
      .catch(() => setUploadError('QR용 이미지 저장에 실패했습니다. 백엔드가 실행 중인지 확인해 주세요.'));
  }, [imageData]);

  useEffect(() => {
    saveQrPhoto();
  }, [saveQrPhoto]);

  return (
    <section className="screen preview-screen">
      <PageHeader eyebrow="5단계" title="완성!" subtitle="이미지를 저장하거나 QR 코드로 다른 기기에서 열어보세요." />
      <div className="result-layout">
        <img className="result-image frame-preview" src={imageData} alt="완성된 포토부스 이미지" style={frameStyle} />
        <aside className="qr-panel">
          <h2>QR 다운로드</h2>
          {uploadedPhoto ? (
            <div className="qr-code">
              <QRCodeCanvas value={uploadedPhoto.url} size={220} includeMargin />
            </div>
          ) : (
            <div className="qr-placeholder">
              <span>{uploadError ?? 'QR 코드를 준비하고 있어요.'}</span>
              {uploadError && (
                <button type="button" onClick={saveQrPhoto}>
                  다시 시도
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
      <ActionBar>
        <button className="secondary" onClick={onHome}>
          처음으로
        </button>
        <button className="secondary" onClick={onRetake}>
          다시 찍기
        </button>
        <button className="primary" onClick={() => downloadDataUrl(imageData)}>
          다운로드
        </button>
      </ActionBar>
    </section>
  );
}
