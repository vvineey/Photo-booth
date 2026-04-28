import type { FrameOption } from '../types/photoBooth';

export const FRAMES: FrameOption[] = [
  {
    id: 'white',
    name: '깨끗한 흰색',
    description: '사진을 또렷하게 보여주는 기본 프레임',
    src: '/frames/white.svg'
  },
  {
    id: 'kitsch',
    name: '키치 스티커',
    description: '하트, 별, 무지개, 곰돌이가 있는 어린이날 무드',
    src: '/frames/kitsch-sticker.svg'
  },
  {
    id: 'rainbow',
    name: '무지개 팡팡',
    description: '알록달록한 리본과 구름 장식',
    src: '/frames/rainbow-pop.svg'
  },
  {
    id: 'garden',
    name: '꽃밭 피크닉',
    description: '꽃과 잎사귀가 가장자리를 감싸는 샘플 프레임',
    src: '/frames/garden-picnic.svg'
  },
  {
    id: 'sparkle',
    name: '반짝 파티',
    description: '파스텔 별빛과 색종이가 있는 샘플 프레임',
    src: '/frames/sparkle-party.svg'
  }
];

export const getFrameById = (frameId: FrameOption['id']): FrameOption =>
  FRAMES.find((frame) => frame.id === frameId) ?? FRAMES[0];
