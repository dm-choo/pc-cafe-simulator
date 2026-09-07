import { expect, type Page } from "@playwright/test";
/** Real player commands; no diagnostic state mutation. Starts/ends in play at the entrance. */
export async function installFirstShop(page: Page) {
  await page.keyboard.press("KeyN");
  await page.getByRole("button", { name: "카운터 세트 구매", exact: true }).click();
  await page.getByRole("button", { name: "기본 좌석 세트 구매", exact: true }).click();
  await page.getByRole("button", { name: "구매한 설비 설치하기 →", exact: true }).click();
  await page.getByRole("button", { name: "카운터 설치", exact: true }).click();
  await page.getByLabel("설치할 좌석 구역").selectOption("06");
  await page.getByRole("button", { name: "선택한 구역에 좌석 설치", exact: true }).click();
  await expect(page.getByLabel("좌석 현황")).toHaveText("0/1석");
  await page.getByRole("button", { name: "둘러보기로 돌아가기" }).click();
}
