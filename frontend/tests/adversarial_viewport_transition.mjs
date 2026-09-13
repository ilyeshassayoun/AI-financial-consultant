import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 640 },
  { name: 'mobile-480', width: 480, height: 800 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 }
];

const ROUTES = ['/welcome', '/profile', '/insurance', '/tax', '/invest', '/pension'];

async function run() {
  console.log('=== STARTING EMPIRICAL ADVERSARIAL VERIFICATION ===');
  console.log(`Target: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Handle dialogs / console errors
  page.on('pageerror', err => console.error('  [BROWSER ERROR]:', err.message));

  const results = {
    overflow: [],
    ledgerTable: [],
    sliders: [],
    transitions: []
  };

  // --- PART 1: OVERFLOW ACROSS ALL 6 ROUTES & VIEWPORTS ---
  console.log('--- TEST 1: HORIZONTAL OVERFLOW VERIFICATION ---');
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const route of ROUTES) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(100); // Allow animations to settle

      const overflowData = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollWidthDoc = doc.scrollWidth;
        const clientWidthDoc = doc.clientWidth;
        const scrollWidthBody = body ? body.scrollWidth : 0;
        const clientWidthBody = body ? body.clientWidth : 0;
        const windowWidth = window.innerWidth;

        const docOverflow = scrollWidthDoc > clientWidthDoc;
        const bodyOverflow = scrollWidthBody > clientWidthBody;

        // Check for child elements overflowing viewport
        const overflowingElements = [];
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          // allow 1px margin for subpixel rendering
          if (rect.right > windowWidth + 1.5 && rect.width > 0 && rect.height > 0) {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
              overflowingElements.push({
                tag: el.tagName.toLowerCase(),
                className: typeof el.className === 'string' ? el.className.slice(0, 50) : '',
                id: el.id || '',
                right: Math.round(rect.right),
                width: Math.round(rect.width),
                overflowAmount: Math.round(rect.right - windowWidth)
              });
            }
          }
        }

        return {
          windowWidth,
          doc: { scrollWidth: scrollWidthDoc, clientWidth: clientWidthDoc, overflow: docOverflow },
          body: { scrollWidth: scrollWidthBody, clientWidth: clientWidthBody, overflow: bodyOverflow },
          overflowingElementsCount: overflowingElements.length,
          topOverflowing: overflowingElements.slice(0, 5)
        };
      });

      const passed = !overflowData.doc.overflow && !overflowData.body.overflow && overflowData.overflowingElementsCount === 0;
      results.overflow.push({
        viewport: vp.name,
        width: vp.width,
        route,
        passed,
        ...overflowData
      });

      console.log(`[${passed ? 'PASS' : 'FAIL'}] Viewport: ${vp.width}px | Route: ${route.padEnd(10)} | doc: ${overflowData.doc.scrollWidth}/${overflowData.doc.clientWidth} | body: ${overflowData.body.scrollWidth}/${overflowData.body.clientWidth} | overflowing elements: ${overflowData.overflowingElementsCount}`);
      if (!passed && overflowData.topOverflowing.length > 0) {
        console.log('    Offending elements:', JSON.stringify(overflowData.topOverflowing));
      }
    }
  }

  // Check Profile Substeps overflow at 360px specifically
  console.log('\n--- TEST 1B: PROFILE SUBSTEPS OVERFLOW AT 360px ---');
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
  const subStepButtons = page.locator('.actuarial-stepper-container button, div[style*="overflow-x: auto"] button');
  const count = await subStepButtons.count();
  console.log(`Found ${count} substep buttons in Profile`);
  for (let i = 0; i < count; i++) {
    await subStepButtons.nth(i).click();
    await page.waitForTimeout(100);
    const subOverflow = await page.evaluate((stepIdx) => {
      const doc = document.documentElement;
      const windowWidth = window.innerWidth;
      const docOverflow = doc.scrollWidth > doc.clientWidth;
      const overflowingElements = [];
      for (const el of document.querySelectorAll('*')) {
        const rect = el.getBoundingClientRect();
        if (rect.right > windowWidth + 1.5 && rect.width > 0 && rect.height > 0) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
            overflowingElements.push({
              tag: el.tagName.toLowerCase(),
              className: typeof el.className === 'string' ? el.className.slice(0, 50) : '',
              right: Math.round(rect.right),
              overflowAmount: Math.round(rect.right - windowWidth)
            });
          }
        }
      }
      return { stepIdx, docOverflow, scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, overflowingCount: overflowingElements.length, top: overflowingElements.slice(0, 3) };
    }, i);
    console.log(`  Substep ${i}: scrollWidth=${subOverflow.scrollWidth}, clientWidth=${subOverflow.clientWidth}, overflowCount=${subOverflow.overflowingCount}`);
  }

  // --- PART 2: ACTUARIAL BALANCE SHEET LEDGER TABLE INSPECTION ---
  console.log('\n--- TEST 2: ACTUARIAL BALANCE SHEET LEDGER TABLE INSPECTION ---');
  const ledgerViewports = [
    { name: 'mobile-360', width: 360, height: 740 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'tablet-769', width: 769, height: 1024 },
    { name: 'tablet-1024', width: 1024, height: 768 },
    { name: 'desktop-1440', width: 1440, height: 900 }
  ];

  for (const vp of ledgerViewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });

    // Navigate to substep 5 (Financial Health Audit)
    const stepButtons = page.locator('div[style*="overflow-x: auto"] button');
    const bCount = await stepButtons.count();
    if (bCount >= 6) {
      await stepButtons.nth(5).click(); // 6th button is substep 5
    } else {
      // Try to click continue until substep 5
      for (let s = 0; s < 5; s++) {
        const contBtn = page.getByRole('button', { name: /Continue/i });
        if (await contBtn.isVisible()) await contBtn.click();
        await page.waitForTimeout(50);
      }
    }
    await page.waitForTimeout(150);

    const ledgerDetails = await page.evaluate((vpWidth) => {
      const container = document.querySelector('.actuarial-ledger-container');
      const header = document.querySelector('.actuarial-ledger-header');
      const rows = Array.from(document.querySelectorAll('.actuarial-ledger-row'));

      if (!container) return { error: 'actuarial-ledger-container not found in DOM' };

      const cRect = container.getBoundingClientRect();
      let headerInfo = null;
      if (header) {
        const hStyle = window.getComputedStyle(header);
        const hRect = header.getBoundingClientRect();
        headerInfo = {
          display: hStyle.display,
          visible: hRect.width > 0 && hRect.height > 0 && hStyle.display !== 'none',
          gridTemplateColumns: hStyle.gridTemplateColumns,
          width: Math.round(hRect.width)
        };
      }

      const rowsInfo = rows.map((r, idx) => {
        const rStyle = window.getComputedStyle(r);
        const rRect = r.getBoundingClientRect();
        return {
          index: idx,
          display: rStyle.display,
          flexDirection: rStyle.flexDirection,
          gridTemplateColumns: rStyle.gridTemplateColumns,
          width: Math.round(rRect.width),
          height: Math.round(rRect.height),
          overflowsViewport: rRect.right > vpWidth + 1
        };
      });

      return {
        container: {
          scrollWidth: container.scrollWidth,
          clientWidth: container.clientWidth,
          hasInternalOverflow: container.scrollWidth > container.clientWidth,
          boundingWidth: Math.round(cRect.width)
        },
        header: headerInfo,
        rowsCount: rows.length,
        rows: rowsInfo
      };
    }, vp.width);

    results.ledgerTable.push({ viewport: vp.name, width: vp.width, details: ledgerDetails });
    console.log(`Viewport ${vp.width}px:`);
    if (ledgerDetails.error) {
      console.log(`  ERROR: ${ledgerDetails.error}`);
    } else {
      console.log(`  Container: clientWidth=${ledgerDetails.container.clientWidth}px, scrollWidth=${ledgerDetails.container.scrollWidth}px, internalOverflow=${ledgerDetails.container.hasInternalOverflow}`);
      console.log(`  Header visible: ${ledgerDetails.header ? ledgerDetails.header.visible : 'N/A'} (display: ${ledgerDetails.header?.display})`);
      if (ledgerDetails.rows.length > 0) {
        const firstRow = ledgerDetails.rows[0];
        console.log(`  Row 0 layout: display=${firstRow.display}, flexDirection=${firstRow.flexDirection}, gridCols=${firstRow.gridTemplateColumns ? firstRow.gridTemplateColumns.slice(0, 40) + '...' : 'none'}`);
        console.log(`  Row 0 size: width=${firstRow.width}px, height=${firstRow.height}px, overflowsViewport=${firstRow.overflowsViewport}`);
      }
    }
  }

  // --- PART 3: RANGE SLIDER TOUCH BEHAVIOR & TARGET SIZES ---
  console.log('\n--- TEST 3: RANGE SLIDER TOUCH BEHAVIOR & TOUCH TARGET SIZES ---');
  // Check sliders on /profile (substep 1), /tax, /insurance, /pension
  const sliderPages = [
    {
      route: '/profile',
      setup: async () => {
        const stepButtons = page.locator('div[style*="overflow-x: auto"] button');
        if (await stepButtons.count() >= 2) {
          await stepButtons.nth(1).click(); // substep 1 timeline
          await page.waitForTimeout(100);
        }
      }
    },
    { route: '/tax', setup: async () => {} },
    { route: '/insurance', setup: async () => {} },
    { route: '/pension', setup: async () => {} }
  ];

  await page.setViewportSize({ width: 360, height: 800 });
  for (const sp of sliderPages) {
    await page.goto(`${BASE_URL}${sp.route}`, { waitUntil: 'networkidle' });
    await sp.setup();

    const sliderData = await page.evaluate((routeName) => {
      const sliders = Array.from(document.querySelectorAll('input[type="range"]'));
      return sliders.map((sl, idx) => {
        const style = window.getComputedStyle(sl);
        const rect = sl.getBoundingClientRect();
        const minHeight = style.minHeight;
        const height = style.height;
        const touchAction = style.touchAction;
        const parent = sl.parentElement;
        const parentStyle = parent ? window.getComputedStyle(parent) : null;
        const parentRect = parent ? parent.getBoundingClientRect() : null;

        return {
          route: routeName,
          index: idx,
          name: sl.getAttribute('name') || sl.getAttribute('aria-label') || sl.getAttribute('id') || `slider-${idx}`,
          touchAction,
          hasTouchActionPanY: touchAction.includes('pan-y'),
          computedHeight: height,
          computedMinHeight: minHeight,
          boundingWidth: Math.round(rect.width),
          boundingHeight: Math.round(rect.height),
          meets44pxHeight: rect.height >= 44,
          meets44pxWidth: rect.width >= 44,
          parentTag: parent ? parent.tagName.toLowerCase() : null,
          parentHeight: parentRect ? Math.round(parentRect.height) : null,
          parentTouchAction: parentStyle ? parentStyle.touchAction : null
        };
      });
    }, sp.route);

    console.log(`Route ${sp.route}: Found ${sliderData.length} range sliders`);
    for (const sd of sliderData) {
      results.sliders.push(sd);
      console.log(`  [Slider ${sd.index}] name: "${sd.name}"`);
      console.log(`    touch-action: "${sd.touchAction}" (pan-y: ${sd.hasTouchActionPanY})`);
      console.log(`    computed min-height: "${sd.computedMinHeight}", height: "${sd.computedHeight}"`);
      console.log(`    bounding box: ${sd.boundingWidth}px x ${sd.boundingHeight}px`);
      console.log(`    meets >=44px height criteria: ${sd.meets44pxHeight ? 'YES' : 'NO (' + sd.boundingHeight + 'px)'}`);
    }
  }

  // --- PART 4: PAGE TRANSITION LATENCY MEASUREMENT ---
  console.log('\n--- TEST 4: PAGE TRANSITION LATENCY MEASUREMENT ---');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle' });

  // Navigate between wizard steps and measure duration
  // Perform multiple round-trip transitions
  const transitionRuns = [];
  const testTransitions = [
    { from: 'welcome', to: '/profile' },
    { from: 'profile', to: '/insurance' },
    { from: 'insurance', to: '/tax' },
    { from: 'tax', to: '/invest' },
    { from: 'invest', to: '/pension' },
    { from: 'pension', to: '/profile' },
    { from: 'profile', to: '/tax' },
    { from: 'tax', to: '/pension' },
    { from: 'pension', to: '/welcome' }
  ];

  for (const t of testTransitions) {
    const startNav = performance.now();
    await page.goto(`${BASE_URL}${t.to}`, { waitUntil: 'domcontentloaded' });

    // Measure time until the container has rendered
    const transitionTime = await page.evaluate(async () => {
      const t0 = performance.now();
      // Wait for next animation frame
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => requestAnimationFrame(r));
      return performance.now() - t0;
    });
    const totalTime = performance.now() - startNav;

    // Check transition element animation properties in DOM
    const animProps = await page.evaluate(() => {
      const motionDivs = Array.from(document.querySelectorAll('div')).filter(d => d.style.transform || d.style.opacity);
      return {
        motionDivsCount: motionDivs.length,
        firstMotionStyle: motionDivs[0] ? motionDivs[0].getAttribute('style') : null
      };
    });

    transitionRuns.push({
      from: t.from,
      to: t.to,
      totalTimeMs: Math.round(totalTime * 10) / 10,
      rafTimeMs: Math.round(transitionTime * 10) / 10,
      animProps
    });

    console.log(`Transition ${t.from} -> ${t.to}: totalTime=${totalTime.toFixed(1)}ms, rafTime=${transitionTime.toFixed(1)}ms`);
  }

  // Next, let's test in-page click transitions via TopNav buttons!
  console.log('\n--- TEST 4B: IN-PAGE TOPNAV CLICK TRANSITION LATENCY ---');
  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
  const topNavButtons = page.locator('.desktop-nav button, nav button');
  const navBtnCount = await topNavButtons.count();
  console.log(`Found ${navBtnCount} topnav buttons for in-app tab switching`);

  for (let i = 0; i < Math.min(navBtnCount, 6); i++) {
    const btn = topNavButtons.nth(i);
    const text = (await btn.innerText()).trim();

    const clickDuration = await page.evaluate(async (btnIndex) => {
      const buttons = Array.from(document.querySelectorAll('.desktop-nav button, nav button'));
      const targetBtn = buttons[btnIndex];
      if (!targetBtn) return null;

      const t0 = performance.now();
      targetBtn.click();

      // Wait for DOM mutation or rAF
      await new Promise(resolve => {
        const observer = new MutationObserver(() => {
          observer.disconnect();
          resolve();
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
        // fallback timeout
        setTimeout(resolve, 300);
      });

      const t1 = performance.now();
      return Math.round((t1 - t0) * 10) / 10;
    }, i);

    console.log(`  TopNav Click tab [${text}]: latency = ${clickDuration}ms`);
    results.transitions.push({ tab: text, clickDurationMs: clickDuration });
  }

  await browser.close();
  console.log('\n=== EMPIRICAL VERIFICATION COMPLETE ===');
}

run().catch(err => {
  console.error('FAILED EXECUTION:', err);
  process.exit(1);
});
