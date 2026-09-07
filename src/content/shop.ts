// Development balance assumptions, NOT verified 2026-01-01 retail prices.
export const STARTING_CASH = 4_000_000;
export const CATALOG = {
  counter: { name: "카운터 세트", price: 400_000, description: "계산대 · 관리용 PC · 보조 선반" },
  seat: { name: "기본 좌석 세트", price: 1_200_000, description: "책상 · 의자 · PC · 모니터 · 키보드 · 마우스" },
} as const;
export type ShopItem = keyof typeof CATALOG;
