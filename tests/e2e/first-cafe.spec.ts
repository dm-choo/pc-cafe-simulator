import { test, expect, type Page } from "@playwright/test";
const read = (page: Page) =>
  page.evaluate(() =>
    (
      window as unknown as {
        __cafe: {
          read: () => {
            tick: number;
            position: { x: number; z: number };
            mode: string;
            yaw: number;
          };
        };
      }
    ).__cafe.read(),
  );
async function boot(page: Page) {
  await page.goto("./?debug=1");
  await expect(
    page.getByRole("button", { name: "마우스 잠금 없이 시작", exact: true }),
  ).toBeVisible();
}
async function start(page: Page) {
  await page
    .getByRole("button", { name: "마우스 잠금 없이 시작", exact: true })
    .click();
  await expect.poll(async () => (await read(page)).mode).toBe("play");
}
async function dragLook(page: Page, dx: number, dy: number) {
  await page.mouse.move(650, 350);
  await page.mouse.down();
  await page.mouse.move(650 + dx, 350 + dy, { steps: 15 });
  await page.mouse.up();
}

test("BASIC-12: 이동, 벽 충돌, 카운터, 배치, 설정, 새로고침", async ({
  page,
}, testInfo) => {
  const errors: string[] = [],
    failures: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });
  await boot(page);
  await page.screenshot({ path: testInfo.outputPath("01-entry.png") });
  // Software WebGL is for interaction checks, not target-GPU performance.
  // Capture the standard-quality view first, then exercise the low quality option.
  await page.getByRole("button", { name: "설정", exact: true }).click();
  await page.getByLabel("그래픽 품질").selectOption("low");
  await page.getByRole("button", { name: "완료", exact: true }).click();
  await start(page);
  await page.keyboard.down("KeyW");
  await expect
    .poll(async () => (await read(page)).position.z, { timeout: 12000 })
    .toBeLessThan(2.8);
  await page.keyboard.up("KeyW");
  await page.screenshot({ path: testInfo.outputPath("02-aisle.png") });
  await page.keyboard.down("KeyW");
  await expect
    .poll(async () => (await read(page)).position.z, { timeout: 30000 })
    .toBeLessThan(-6.4);
  await page.waitForTimeout(350);
  await page.keyboard.up("KeyW");
  expect((await read(page)).position.z).toBeGreaterThan(-6.7);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "개발 장면 초기화" }).click();
  await page.getByRole("button", { name: "마우스 잠금 없이 계속" }).click();
  await page.keyboard.down("KeyD");
  await expect
    .poll(async () => (await read(page)).position.x)
    .toBeGreaterThan(0.5);
  await page.keyboard.up("KeyD");
  await dragLook(page, 740, 400);
  await expect(
    page.getByRole("button", { name: /카운터.*살펴보기/ }),
  ).toBeVisible();
  await page.keyboard.press("KeyE");
  await expect(page.getByRole("dialog", { name: "카운터" })).toBeVisible();
  const counter = await read(page);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(250);
  await page.keyboard.up("KeyW");
  expect((await read(page)).position).toEqual(counter.position);
  expect((await read(page)).tick).toBe(counter.tick);
  await page.screenshot({ path: testInfo.outputPath("03-counter.png") });
  await page.getByRole("button", { name: "점검 계속하기" }).click();
  await page.keyboard.press("KeyB");
  await expect(page.getByRole("region", { name: "배치 모드" })).toBeVisible();
  const tick = (await read(page)).tick;
  await page.getByLabel("살펴볼 좌석").selectOption("01");
  await page.mouse.move(720, 450);
  await expect(page.getByRole("status")).toContainText("통로");
  await page.screenshot({ path: testInfo.outputPath("04-layout.png") });
  expect((await read(page)).tick).toBe(tick);
  await page.getByRole("button", { name: "둘러보기로 돌아가기" }).click();
  await expect.poll(async () => (await read(page)).tick).toBeGreaterThan(tick);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "설정", exact: true }).click();
  await page.getByLabel("그래픽 품질").selectOption("low");
  await page.getByRole("button", { name: "완료", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "매장 들어가기" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
  await testInfo.attach("runtime", {
    body: JSON.stringify(await read(page), null, 2),
    contentType: "application/json",
  });
});
test("포인터 잠금 해제와 탭 숨김은 안전하게 일시정지한다", async ({ page }) => {
  await boot(page);
  await page.getByRole("button", { name: "매장 들어가기" }).click();
  await expect
    .poll(() => page.evaluate(() => !!document.pointerLockElement))
    .toBe(true);
  await page.evaluate(() => document.exitPointerLock());
  await expect(
    page.getByRole("dialog", { name: "잠시 쉬어가기" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "마우스 잠금 없이 계속" }).click();
  // Chromium headless does not hide background tabs consistently. Exercise the actual visibility listener with a controlled document signal.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const tick = (await read(page)).tick;
  await page.waitForTimeout(300);
  expect((await read(page)).tick).toBe(tick);
  await page.evaluate(() => {
    delete (document as unknown as { hidden?: boolean }).hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("dialog", { name: "잠시 쉬어가기" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "마우스 잠금 없이 계속" }).click();
  await expect.poll(async () => (await read(page)).tick).toBeGreaterThan(tick);
});
test("작은 화면에서도 시작 및 설정이 가려지지 않는다", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page);
  await expect(
    page.getByText("현재 버전은 키보드와 마우스가 있는 PC에서 플레이하세요."),
  ).toBeVisible();
  await page.getByRole("button", { name: "설정", exact: true }).click();
  await expect(page.getByLabel("그래픽 품질")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("05-narrow-settings.png"),
  });
});
