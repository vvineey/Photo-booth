# Children's Day Photo Booth

어린이날 부스에서 노트북 또는 iPad 카메라로 사진을 찍고, 낙서를 그린 뒤, 귀여운 프레임을 덮어 PNG로 저장하는 로컬 네트워크용 웹 포토부스입니다.

## 설치

```bash
cd photo-booth
npm run install:all
```

## 실행

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

프런트엔드만 실행:

```bash
npm run dev:frontend
```

백엔드만 실행:

```bash
npm run dev:backend
```

## 같은 와이파이에서 접속하기

1. 노트북과 iPad 또는 휴대폰을 같은 Wi-Fi에 연결합니다.
2. 백엔드 실행 로그 또는 `http://localhost:4000/health`에서 `localIp`를 확인합니다.
3. 다른 기기에서 `http://로컬IP:5173`으로 접속합니다.
   - 예: `http://192.168.0.24:5173`

iPad Safari에서 카메라를 쓰려면 `localhost`가 아닌 로컬 IP 접속 시 브라우저 보안 정책에 따라 카메라가 제한될 수 있습니다. 가능하면 촬영 기기 자체에서 앱을 열고, QR 다운로드는 다른 기기에서 스캔하는 흐름을 권장합니다.

## QR 다운로드 원리

1. 프런트엔드가 Canvas로 최종 PNG 이미지를 생성합니다.
2. `POST /api/photos`로 PNG data URL을 백엔드에 보냅니다.
3. 백엔드는 `backend/uploads` 폴더에 날짜 기반 파일명으로 저장합니다.
4. 백엔드는 `http://로컬IP:4000/download/파일명.png` URL을 반환합니다.
5. 프런트엔드는 이 URL로 QR 코드를 표시합니다.
6. 같은 Wi-Fi의 기기가 QR을 스캔하면 백엔드에서 이미지를 열 수 있습니다.

## HOST_IP 설정

백엔드는 기본적으로 로컬 네트워크 IPv4 주소를 자동 탐지합니다. QR 코드가 잘못된 IP를 가리키면 직접 지정할 수 있습니다.

```bash
HOST_IP=192.168.0.24 npm run dev:backend
```

또는 루트에서 동시에 실행할 때:

```bash
HOST_IP=192.168.0.24 npm run dev
```

## 새 프레임 추가

1. `frontend/public/frames`에 PNG 또는 SVG 파일을 추가합니다.
2. `frontend/src/constants/frames.ts`의 `FRAMES` 배열에 항목을 추가합니다.

```ts
{
  id: 'new-frame',
  name: '새 프레임',
  description: '설명',
  src: '/frames/new-frame.png'
}
```

프레임은 최종 합성 때 사진과 낙서 위에 덮입니다. 사진을 가리지 않도록 가장자리와 하단 여백 위주로 디자인하는 것이 좋습니다.

## 문제 해결

### 카메라 권한 문제

- 브라우저 주소창 왼쪽 권한 아이콘에서 카메라 허용을 확인합니다.
- 이미 거부했다면 사이트 설정에서 권한을 초기화한 뒤 새로고침합니다.
- 다른 앱이 카메라를 사용 중이면 종료합니다.

### iPad Safari 카메라 문제

- 최신 iPadOS Safari를 사용합니다.
- 카메라 권한이 꺼져 있으면 설정 앱에서 Safari 카메라 권한을 확인합니다.
- Safari는 보안 출처 정책이 엄격하므로 촬영은 iPad 자체에서 열린 페이지 또는 노트북 브라우저에서 진행하는 것이 안정적입니다.

### QR이 휴대폰에서 안 열리는 문제

- 휴대폰이 같은 Wi-Fi에 연결되어 있는지 확인합니다.
- 백엔드가 실행 중인지 `http://로컬IP:4000/health`로 확인합니다.
- 방화벽이 4000 포트를 막고 있으면 허용합니다.
- QR URL의 IP가 현재 노트북 IP와 다르면 `HOST_IP`를 직접 지정합니다.

### localhost와 로컬 IP 차이

- `localhost`는 현재 기기 자신을 뜻합니다.
- 휴대폰에서 `localhost:4000`을 열면 노트북이 아니라 휴대폰 자신을 찾습니다.
- 그래서 QR URL은 `localhost` 대신 `192.168.x.x` 같은 노트북의 로컬 IP를 사용해야 합니다.
