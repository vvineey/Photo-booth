import type { BoothLayout } from '../types/photoBooth';

export const LAYOUTS: BoothLayout[] = [
  {
    id: 'single',
    name: '1컷 레이아웃',
    ratioLabel: '3.5 x 5 inch / 7:10',
    width: 1400,
    height: 2000,
    shotCount: 1
  },
  {
    id: 'quad',
    name: '4컷 레이아웃',
    ratioLabel: '4 x 6 inch / 2:3',
    width: 1600,
    height: 2400,
    shotCount: 4
  }
];

export const getLayoutById = (layoutId: BoothLayout['id']): BoothLayout =>
  LAYOUTS.find((layout) => layout.id === layoutId) ?? LAYOUTS[0];
