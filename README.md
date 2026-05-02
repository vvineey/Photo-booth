# Children's Day Photo Booth

어린이날 행사장에서 바로 쓸 수 있는 웹 포토부스입니다. 브라우저 카메라로 사진을 찍고, 프레임을 고른 뒤, 낙서와 지우개로 꾸민 최종 이미지를 PNG로 저장합니다. 완성된 이미지는 QR 코드로 같은 네트워크의 다른 기기에서도 열 수 있습니다.

## 주요 기능

- 1컷, 4컷 레이아웃 선택
- 어린이날 분위기의 SVG 프레임 선택
- 브라우저 카메라 촬영 및 카운트다운
- 직접 그리기와 손 인식 그리기 모드
- 펜 색상 선택, 부분 지우개, 전체 지우기
- 최종 PNG 다운로드
- 백엔드 업로드 후 QR 다운로드 URL 생성
- 로컬 네트워크 IP 또는 외부 터널 URL 기반 공유

## 기술 스택

- Frontend: React 19, TypeScript, Vite
- Backend: Express 5, TypeScript
- QR: `qrcode.react`
- 동시 실행: `concurrently`
- 손 인식: MediaPipe Tasks Vision CDN

## 프로젝트 구조

```text
photo-booth/
├── backend/
│   └── src/
│       ├── server.ts
│       └── utils/
├── frontend/
│   ├── public/
│   │   ├── assets/fonts/
│   │   └── frames/
│   └── src/
│       ├── constants/
│       ├── pages/
│       ├── utils/
│       └── App.tsx
├── uploads/
├── package.json
└── README.md
```

## 설치

루트, 프론트엔드, 백엔드 의존성을 한 번에 설치합니다.

```bash
npm run install:all
```

## 실행

프론트엔드와 백엔드를 동시에 실행합니다.

```bash
npm run dev
```

기본 주소는 다음과 같습니다.

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

각 서버만 따로 실행할 수도 있습니다.

```bash
npm run dev:frontend
npm run dev:backend
```

## 빌드

```bash
npm run build
```

프론트엔드는 `frontend/dist`, 백엔드는 `backend/dist`에 빌드 결과가 생성됩니다.

## 사용 흐름

1. 시작 화면에서 촬영을 시작합니다.
2. `1컷 레이아웃` 또는 `4컷 레이아웃`을 선택합니다.
3. 원하는 프레임을 선택합니다.
4. 카메라 화면에서 사진을 촬영합니다.
5. 낙서 화면에서 펜, 색상, 지우개를 사용해 사진을 꾸밉니다.
6. 최종 미리보기에서 PNG를 다운로드하거나 QR 코드로 다른 기기에서 엽니다.

## QR 다운로드 구조

1. 프론트엔드가 Canvas로 사진, 낙서, 프레임, 하단 문구를 합성합니다.
2. 합성된 PNG data URL을 `POST /api/photos`로 백엔드에 전송합니다.
3. 백엔드는 이미지를 `uploads/` 폴더에 저장합니다.
4. 백엔드는 `/download/:filename` 형식의 다운로드 URL을 반환합니다.
5. 프론트엔드는 해당 URL을 QR 코드로 표시합니다.

업로드 파일명은 `childrens-day-photo-날짜.png` 형식으로 생성됩니다.

## 같은 Wi-Fi에서 접속하기

휴대폰이나 iPad에서 QR 이미지를 열려면 백엔드를 실행 중인 컴퓨터와 같은 Wi-Fi에 연결되어 있어야 합니다.

1. 컴퓨터와 다른 기기를 같은 Wi-Fi에 연결합니다.
2. `http://localhost:4000/health`에서 `localIp` 값을 확인합니다.
3. 다른 기기에서 `http://로컬IP:5173`으로 접속합니다.

예시:

```text
http://192.168.0.24:5173
```

주의할 점:

- 다른 기기에서 `localhost`는 컴퓨터가 아니라 그 기기 자신을 뜻합니다.
- QR URL이 열리지 않으면 `localIp`, Wi-Fi, 방화벽, 백엔드 실행 상태를 확인합니다.
- 모바일 브라우저는 보안 정책 때문에 로컬 IP 접속 시 카메라 권한이 제한될 수 있습니다. 촬영은 앱을 실행한 기기에서 진행하고, QR은 공유용으로 쓰는 흐름이 가장 안정적입니다.

## 환경변수

### `PORT`

백엔드 포트를 바꿉니다. 기본값은 `4000`입니다.

```bash
PORT=5000 npm run dev:backend
```

### `HOST_IP`

백엔드가 자동 감지한 로컬 IP가 맞지 않을 때 직접 지정합니다.

```bash
HOST_IP=192.168.0.24 npm run dev:backend
```

루트에서 동시에 실행할 때도 사용할 수 있습니다.

```bash
HOST_IP=192.168.0.24 npm run dev
```

### `PUBLIC_BASE_URL`

Cloudflare Tunnel 같은 외부 공개 URL을 QR 다운로드 주소로 사용합니다. 같은 Wi-Fi가 아닌 기기에서도 QR을 열어야 할 때 사용합니다.

```bash
PUBLIC_BASE_URL=https://example.trycloudflare.com npm run dev:backend
```

설정하면 QR URL은 다음처럼 생성됩니다.

```text
https://example.trycloudflare.com/download/파일명.png
```

설정하지 않으면 다음처럼 로컬 네트워크 주소를 사용합니다.

```text
http://로컬IP:4000/download/파일명.png
```

## 외부 터널로 QR 열기

같은 Wi-Fi가 아닌 휴대폰에서 QR 다운로드를 열어야 한다면 백엔드 포트에 터널을 연결합니다.

1. 백엔드를 실행합니다.

```bash
npm run dev:backend
```

2. 다른 터미널에서 터널을 엽니다.

```bash
cloudflared tunnel --url http://localhost:4000
```

3. 발급된 `https://...trycloudflare.com` 주소를 `PUBLIC_BASE_URL`로 넣어 백엔드를 다시 실행합니다.

```bash
PUBLIC_BASE_URL=https://example.trycloudflare.com npm run dev:backend
```

## 새 프레임 추가

1. `frontend/public/frames`에 PNG 또는 SVG 파일을 추가합니다.
2. `frontend/src/constants/frames.ts`의 `FRAMES` 배열에 항목을 추가합니다.

```ts
{
  id: 'new-frame',
  name: '새 프레임',
  description: '프레임 설명',
  src: '/frames/new-frame.svg'
}
```

프레임은 최종 합성에서 사진과 낙서 위에 덮입니다. 사진 영역을 가리지 않도록 가장자리와 하단 장식 중심으로 만드는 것이 좋습니다.

## 레이아웃 설정

레이아웃은 `frontend/src/constants/layouts.ts`에서 관리합니다.

기본 레이아웃:

- `single`: 1400 x 2000, 1컷
- `quad`: 1600 x 2400, 4컷

새 레이아웃을 추가하려면 `LAYOUTS` 배열에 `id`, `name`, `ratioLabel`, `width`, `height`, `shotCount`를 추가합니다.

## 문제 해결

### 카메라가 켜지지 않을 때

- 브라우저 주소창의 카메라 권한을 허용합니다.
- 이미 거부한 경우 사이트 설정에서 권한을 초기화한 뒤 새로고침합니다.
- 다른 앱이 카메라를 사용 중이면 종료합니다.
- iPad Safari에서는 설정 앱에서 Safari 카메라 권한을 확인합니다.

### 손으로 그리기가 동작하지 않을 때

- 인터넷 연결을 확인합니다. 손 인식 모드는 MediaPipe 모델과 WASM 파일을 CDN에서 불러옵니다.
- 브라우저 카메라 권한을 허용합니다.
- 조명이 너무 어둡거나 손이 화면에서 벗어나면 인식이 불안정할 수 있습니다.

### QR 코드가 휴대폰에서 열리지 않을 때

- 휴대폰과 컴퓨터가 같은 Wi-Fi에 있는지 확인합니다.
- 백엔드가 실행 중인지 `http://localhost:4000/health`로 확인합니다.
- QR URL의 IP가 현재 컴퓨터 IP와 다르면 `HOST_IP`를 지정합니다.
- 방화벽에서 백엔드 포트, 기본 `4000`, 접근을 허용합니다.
- 같은 Wi-Fi가 아니라면 `PUBLIC_BASE_URL`과 터널을 사용합니다.

### 포트가 이미 사용 중일 때

- 프론트엔드는 Vite가 자동으로 다음 포트를 사용할 수 있습니다.
- 백엔드는 `PORT` 환경변수로 포트를 변경합니다.

```bash
PORT=5000 npm run dev:backend
```

## API

### `GET /health`

백엔드 상태, 로컬 IP, 포트, 공개 URL 설정을 반환합니다.

### `POST /api/photos`

PNG data URL을 받아 `uploads/`에 저장하고 다운로드 URL을 반환합니다.

요청 예시:

```json
{
  "imageData": "data:image/png;base64,..."
}
```

응답 예시:

```json
{
  "filename": "childrens-day-photo-2026-05-02T01-23-45-000Z.png",
  "url": "http://192.168.0.24:4000/download/childrens-day-photo-2026-05-02T01-23-45-000Z.png"
}
```

### `GET /download/:filename`

저장된 PNG 파일을 브라우저에서 열 수 있게 반환합니다.
