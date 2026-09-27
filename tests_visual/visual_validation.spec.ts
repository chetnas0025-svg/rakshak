import { test } from '@playwright/test';
import path from 'path';

test('capture tactical views', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const artifactDir = path.resolve('C:/Users/Prashant V/.gemini/antigravity-ide/brain/66e2cfa9-1597-44c0-8491-c62f3358cca4');

  // 1. Select HP-MND-02 to inspect ward details with circular SVG dial & CWC curve
  const wardBtn = page.locator('text=HP-MND-02: Thunag');
  if (await wardBtn.isVisible()) {
    await wardBtn.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({
    path: path.join(artifactDir, 'dashboard_ward_inspected.png'),
    fullPage: true
  });

  // 2. Open AI Triage Modal to inspect multi-agent orchestration waterfall
  const aiTriageBtn = page.locator('button:has-text("AI Triage")');
  if (await aiTriageBtn.isVisible()) {
    await aiTriageBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(artifactDir, 'modal_ai_triage.png'),
      fullPage: false
    });
    // Close modal via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 3. Switch to High Contrast Mode via Alt+C (WCAG 2.1 AAA Sunlight Mode)
  await page.keyboard.press('Alt+c');
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(artifactDir, 'dashboard_high_contrast.png'),
    fullPage: true
  });
});
