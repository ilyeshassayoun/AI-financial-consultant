import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function checkDetails() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== DEEP DIVE: HORIZONTAL SCROLLABILITY & OVERFLOW ===');

  // Test 1: Page horizontal scrollability across viewports
  for (const w of [360, 480, 768, 769, 1024, 1440]) {
    await page.setViewportSize({ width: w, height: 800 });
    console.log(`\n--- Viewport Width: ${w}px ---`);

    for (const r of ['/welcome', '/profile', '/insurance', '/tax', '/invest', '/pension']) {
      await page.goto(`${BASE_URL}${r}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(50);

      const scrollResult = await page.evaluate(async () => {
        window.scrollBy(200, 0);
        const scrolledX = window.scrollX;

        // Check if document or body has horizontal scrollbar
        const docScrollable = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        const bodyScrollable = document.body ? (document.body.scrollWidth > document.body.clientWidth) : false;

        // Check clipping elements
        const clippedElements = [];
        for (const el of document.querySelectorAll('*')) {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth + 1) {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              // Find if this element is inside an overflow-x: auto or scroll container
              let parent = el.parentElement;
              let insideScrollContainer = false;
              while (parent && parent !== document.body) {
                const pStyle = window.getComputedStyle(parent);
                if (pStyle.overflowX === 'auto' || pStyle.overflowX === 'scroll') {
                  insideScrollContainer = true;
                  break;
                }
                parent = parent.parentElement;
              }

              if (!insideScrollContainer) {
                clippedElements.push({
                  tag: el.tagName.toLowerCase(),
                  className: typeof el.className === 'string' ? el.className.slice(0, 60) : '',
                  width: Math.round(rect.width),
                  right: Math.round(rect.right),
                  overflowAmount: Math.round(rect.right - window.innerWidth)
                });
              }
            }
          }
        }

        return {
          windowScrollXAfterAttempt: scrolledX,
          docScrollWidth: document.documentElement.scrollWidth,
          docClientWidth: document.documentElement.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
          bodyClientWidth: document.body.clientWidth,
          docScrollable,
          bodyScrollable,
          uncontainedClippedCount: clippedElements.length,
          topUncontainedClipped: clippedElements.slice(0, 3)
        };
      });

      console.log(`Route ${r.padEnd(10)}: window.scrollX=${scrollResult.windowScrollXAfterAttempt} | doc: ${scrollResult.docScrollWidth}/${scrollResult.docClientWidth} | body: ${scrollResult.bodyScrollWidth}/${scrollResult.bodyClientWidth} | uncontained clipped: ${scrollResult.uncontainedClippedCount}`);
      if (scrollResult.uncontainedClippedCount > 0) {
        console.log('   Uncontained clipped:', JSON.stringify(scrollResult.topUncontainedClipped));
      }
    }
  }

  await browser.close();
}

checkDetails().catch(console.error);
