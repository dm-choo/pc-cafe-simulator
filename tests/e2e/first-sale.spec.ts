import { test, expect } from "@playwright/test";
import type { GameState } from "../../src/sim/game";
test("FIRST-SALE: 카운터 개점 → 손님 착석 → 첫 결제 → 마감", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const read = () =>
    page.evaluate(() =>
      (
        window as unknown as {
          __cafe: { read: () => { game: GameState; mode: string } };
        }
      ).__cafe.read(),
    );
  await page.goto("./?debug=1");
  await page.getByRole("button", { name: "설정", exact: true }).click();
  await page.getByLabel("그래픽 품질").selectOption("low");
  await page.getByRole("button", { name: "완료", exact: true }).click();
  await page
    .getByRole("button", { name: "마우스 잠금 없이 시작", exact: true })
    .click();
  await page.mouse.move(650, 350);
  await page.mouse.down();
  await page.mouse.move(1390, 620, { steps: 10 });
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: /카운터.*살펴보기/ }),
  ).toBeVisible();
  await page.keyboard.press("KeyE");
  await page.getByRole("button", { name: "영업 시작", exact: true }).click();
  await page.keyboard.press("Digit4");
  await expect
    .poll(async () => (await read()).game.customers.length, { timeout: 20000 })
    .toBeGreaterThan(0);
  // Turn back toward the entrance-side seats; exercise real view controls.
  await page.mouse.move(1000, 600);
  await page.mouse.down();
  await page.mouse.move(260, 390, { steps: 10 });
  await page.mouse.up();
  await expect
    .poll(
      async () =>
        (await read()).game.customers.some((c) => c.phase === "using"),
      { timeout: 40000 },
    )
    .toBe(true);
  await page.keyboard.press("Digit1");
  await page.mouse.move(800, 400);
  await page.mouse.down();
  await page.mouse.move(425, 480, { steps: 10 });
  await page.mouse.up();
  await page.screenshot({ path: testInfo.outputPath("seated-eye-level.png") });
  await page.mouse.move(425, 480);
  await page.mouse.down();
  await page.mouse.move(800, 400, { steps: 10 });
  await page.mouse.up();
  await page.keyboard.press("Digit4");
  await page.keyboard.press("KeyB");
  const paused = await read();
  await page.screenshot({
    path: testInfo.outputPath("first-customer-seated.png"),
  });
  await page.waitForTimeout(250);
  expect((await read()).game.tick).toBe(paused.game.tick);
  await page.getByRole("button", { name: "둘러보기로 돌아가기" }).click();
  await expect
    .poll(async () => (await read()).game.served, { timeout: 60000 })
    .toBeGreaterThan(0);
  await expect(page.getByLabel("보유 현금")).not.toHaveText("0원");
  await page.keyboard.press("KeyB");
  await page.screenshot({ path: testInfo.outputPath("first-sale.png") });
  const result = await read();
  expect(result.game.cash).toBe(result.game.served * 1500);
  expect(new Set(result.game.receipts.map((r) => r.customerId)).size).toBe(
    result.game.receipts.length,
  );
  await testInfo.attach("first-sale-state", {
    body: JSON.stringify(result, null, 2),
    contentType: "application/json",
  });
  await page.getByRole("button", { name: "둘러보기로 돌아가기" }).click();
  await page.mouse.move(650, 350);
  await page.mouse.down();
  await page.mouse.move(1390, 560, { steps: 10 });
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: /카운터.*살펴보기/ }),
  ).toBeVisible();
  await page.keyboard.press("KeyE");
  await expect(page.getByLabel("최근 결제")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("counter-first-receipt.png"),
  });
  await page
    .getByRole("button", { name: "신규 입장 중지", exact: true })
    .click();
  expect((await read()).game.open).toBe(false);
  expect(errors).toEqual([]);
});
