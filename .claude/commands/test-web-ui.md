---
description: Autonomous web UI testing workflow that views running applications, performs visual and functional testing, debugs issues, and generates automated test suites. Integrates with browser DevTools for real-time debugging.
argumentHint: "[url] [--fix-issues] [--generate-tests]"
---

# Test Web UI Workflow

Autonomous web UI testing that views, tests, debugs, and fixes frontend applications using browser automation and visual testing.

## Overview

This workflow provides end-to-end UI testing with autonomous issue detection and fixing:
1. Launch application and navigate UI
2. Visual testing (screenshots, layout, responsive)
3. Functional testing (forms, interactions, user flows)
4. Accessibility testing (WCAG 2.1 AA/AAA)
5. Performance testing (Core Web Vitals)
6. Debug detected issues
7. Generate automated test suites

## Execution Instructions

### Phase 1: Application Launch & Discovery (10%)

**Use `fullstack-developer` or `frontend-developer` to prepare:**

```bash
# Step 1: Start application locally
cd /path/to/app

# For React/Next.js
npm run dev  # Usually http://localhost:3000

# For Vue
npm run serve  # Usually http://localhost:8080

# For Angular
ng serve  # Usually http://localhost:4200

# For vanilla/static
python -m http.server 8000  # http://localhost:8000

# Wait for application to be ready
while ! curl -s http://localhost:3000 > /dev/null; do
    sleep 1
done
echo "Application ready!"

# Step 2: Discover application structure
# Use visual-testing agent to crawl and map application
```

**Application Discovery:**
```javascript
// Auto-discover pages and routes
const playwright = require('playwright');

async function discoverApplication(baseUrl) {
    const browser = await playwright.chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    const discovered = {
        pages: [],
        forms: [],
        buttons: [],
        links: [],
        images: [],
        apis: []
    };

    await page.goto(baseUrl);

    // Discover all links
    const links = await page.$$eval('a[href]', anchors =>
        anchors.map(a => ({
            text: a.textContent,
            href: a.href,
            visible: a.offsetParent !== null
        }))
    );

    discovered.links = links.filter(l => l.visible);

    // Discover all forms
    const forms = await page.$$eval('form', forms =>
        forms.map((form, idx) => ({
            id: form.id || `form-${idx}`,
            action: form.action,
            method: form.method,
            fields: Array.from(form.elements).map(el => ({
                name: el.name,
                type: el.type,
                required: el.required,
                placeholder: el.placeholder
            }))
        }))
    );

    discovered.forms = forms;

    // Discover API calls (intercept network)
    const apis = [];
    page.on('request', request => {
        if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') {
            apis.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers()
            });
        }
    });

    discovered.apis = apis;

    console.log('Application Discovery:', JSON.stringify(discovered, null, 2));

    return discovered;
}
```

**CHECKPOINT**: Application running and structure mapped ✓

### Phase 2: Visual & Layout Testing (20%)

**Use `visual-testing` agent:**

```javascript
// Visual regression testing with Playwright
const { test, expect } = require('@playwright/test');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');
const fs = require('fs');

test.describe('Visual Tests', () => {
    test('Homepage visual regression', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');

        // Take screenshot
        const screenshot = await page.screenshot({
            fullPage: true,
            path: 'screenshots/homepage-current.png'
        });

        // Compare with baseline (if exists)
        if (fs.existsSync('screenshots/homepage-baseline.png')) {
            const baseline = PNG.sync.read(fs.readFileSync('screenshots/homepage-baseline.png'));
            const current = PNG.sync.read(screenshot);
            const { width, height } = baseline;
            const diff = new PNG({ width, height });

            const numDiffPixels = pixelmatch(
                baseline.data,
                current.data,
                diff.data,
                width,
                height,
                { threshold: 0.1 }
            );

            // Save diff image
            fs.writeFileSync('screenshots/homepage-diff.png', PNG.sync.write(diff));

            const diffPercentage = (numDiffPixels / (width * height)) * 100;

            if (diffPercentage > 0.5) {
                console.log(`⚠️  Visual regression detected: ${diffPercentage.toFixed(2)}% difference`);
            } else {
                console.log(`✓ Visual regression passed: ${diffPercentage.toFixed(2)}% difference`);
            }
        } else {
            // Save as baseline
            fs.copyFileSync('screenshots/homepage-current.png', 'screenshots/homepage-baseline.png');
            console.log('✓ Baseline screenshot saved');
        }
    });

    test('Responsive design - Mobile', async ({ page }) => {
        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
        await page.goto('http://localhost:3000');

        // Check for mobile menu
        const mobileMenu = page.locator('[data-testid="mobile-menu"]');
        await expect(mobileMenu).toBeVisible();

        // Check text doesn't overflow
        const textOverflow = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const overflowing = [];

            elements.forEach(el => {
                if (el.scrollWidth > el.clientWidth) {
                    overflowing.push({
                        element: el.tagName,
                        class: el.className,
                        text: el.textContent.substring(0, 50)
                    });
                }
            });

            return overflowing;
        });

        if (textOverflow.length > 0) {
            console.log('⚠️  Text overflow detected on mobile:', textOverflow);
        }

        await page.screenshot({ path: 'screenshots/mobile.png' });
    });

    test('Responsive design - Tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 }); // iPad
        await page.goto('http://localhost:3000');
        await page.screenshot({ path: 'screenshots/tablet.png' });
    });

    test('Responsive design - Desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('http://localhost:3000');
        await page.screenshot({ path: 'screenshots/desktop.png' });
    });

    test('Dark mode (if applicable)', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Toggle dark mode
        const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
        if (await darkModeToggle.count() > 0) {
            await darkModeToggle.click();
            await page.waitForTimeout(500); // Animation

            await page.screenshot({ path: 'screenshots/dark-mode.png' });

            // Check contrast ratios
            const contrastIssues = await page.evaluate(() => {
                const issues = [];
                const elements = document.querySelectorAll('*');

                elements.forEach(el => {
                    const styles = window.getComputedStyle(el);
                    const bgColor = styles.backgroundColor;
                    const textColor = styles.color;

                    // Calculate contrast ratio (simplified)
                    // Real implementation would use actual contrast calculation
                    // This is just a placeholder
                });

                return issues;
            });
        }
    });
});
```

**Layout Testing:**
```javascript
test('Layout integrity', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check for layout shifts (CLS)
    const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
            let clsValue = 0;
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
            });
            observer.observe({ type: 'layout-shift', buffered: true });

            setTimeout(() => {
                observer.disconnect();
                resolve(clsValue);
            }, 5000);
        });
    });

    console.log(`Cumulative Layout Shift: ${cls}`);
    expect(cls).toBeLessThan(0.1); // Good CLS score

    // Check for overlapping elements
    const overlaps = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const overlapping = [];

        for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) {
                const rect1 = elements[i].getBoundingClientRect();
                const rect2 = elements[j].getBoundingClientRect();

                if (!(rect1.right < rect2.left ||
                      rect1.left > rect2.right ||
                      rect1.bottom < rect2.top ||
                      rect1.top > rect2.bottom)) {
                    // Elements overlap
                    if (rect1.width > 0 && rect1.height > 0 &&
                        rect2.width > 0 && rect2.height > 0) {
                        overlapping.push({
                            element1: elements[i].tagName,
                            element2: elements[j].tagName
                        });
                    }
                }
            }
        }

        return overlapping;
    });

    if (overlaps.length > 0) {
        console.log('⚠️  Overlapping elements detected:', overlaps.slice(0, 5));
    }
});
```

**CHECKPOINT**: Visual and layout tests complete ✓

### Phase 3: Functional Testing (25%)

**Use `visual-testing` agent for interactions:**

```javascript
test.describe('Functional Tests', () => {
    test('Login flow', async ({ page }) => {
        await page.goto('http://localhost:3000/login');

        // Fill form
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'SecurePassword123!');

        // Click login
        await page.click('button[type="submit"]');

        // Wait for navigation
        await page.waitForURL('**/dashboard');

        // Verify logged in
        const userMenu = page.locator('[data-testid="user-menu"]');
        await expect(userMenu).toBeVisible();

        console.log('✓ Login flow successful');
    });

    test('Form validation', async ({ page }) => {
        await page.goto('http://localhost:3000/signup');

        // Submit empty form
        await page.click('button[type="submit"]');

        // Check for error messages
        const emailError = page.locator('[data-testid="email-error"]');
        await expect(emailError).toBeVisible();
        await expect(emailError).toContainText('required');

        // Fill with invalid email
        await page.fill('input[name="email"]', 'invalid-email');
        await page.click('button[type="submit"]');

        await expect(emailError).toContainText('valid email');

        console.log('✓ Form validation working');
    });

    test('Search functionality', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Type in search
        const searchInput = page.locator('input[type="search"]');
        await searchInput.fill('test query');

        // Submit
        await page.keyboard.press('Enter');

        // Wait for results
        await page.waitForSelector('[data-testid="search-results"]');

        const results = await page.locator('[data-testid="search-result"]').count();
        expect(results).toBeGreaterThan(0);

        console.log(`✓ Search returned ${results} results`);
    });

    test('Pagination', async ({ page }) => {
        await page.goto('http://localhost:3000/products');

        // Click page 2
        await page.click('[data-testid="page-2"]');

        // Wait for URL to update
        await page.waitForURL('**/products?page=2');

        // Verify different content
        const productIds = await page.$$eval('[data-testid="product-id"]', els =>
            els.map(el => el.textContent)
        );

        expect(productIds.length).toBeGreaterThan(0);
        console.log('✓ Pagination working');
    });

    test('Modal interactions', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Open modal
        await page.click('[data-testid="open-modal"]');

        // Modal should be visible
        const modal = page.locator('[data-testid="modal"]');
        await expect(modal).toBeVisible();

        // Close with X button
        await page.click('[data-testid="close-modal"]');
        await expect(modal).not.toBeVisible();

        // Open again
        await page.click('[data-testid="open-modal"]');

        // Close with Escape key
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();

        // Open again
        await page.click('[data-testid="open-modal"]');

        // Close by clicking outside
        await page.click('body', { position: { x: 10, y: 10 } });
        await expect(modal).not.toBeVisible();

        console.log('✓ Modal interactions working');
    });

    test('Drag and drop', async ({ page }) => {
        await page.goto('http://localhost:3000/board');

        // Drag item to new position
        const source = page.locator('[data-testid="draggable-item-1"]');
        const target = page.locator('[data-testid="drop-zone-2"]');

        await source.dragTo(target);

        // Verify item moved
        const itemInNewZone = page.locator('[data-testid="drop-zone-2"] [data-testid="draggable-item-1"]');
        await expect(itemInNewZone).toBeVisible();

        console.log('✓ Drag and drop working');
    });
});
```

**CHECKPOINT**: Functional tests complete ✓

### Phase 4: Accessibility Testing (20%)

**Use `accessibility-tester` agent:**

```javascript
const { injectAxe, checkA11y, getViolations } = require('axe-playwright');

test.describe('Accessibility Tests (WCAG 2.1 AA)', () => {
    test('Homepage accessibility', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await injectAxe(page);

        const violations = await getViolations(page);

        if (violations.length > 0) {
            console.log(`⚠️  Found ${violations.length} accessibility violations:`);

            violations.forEach((violation, idx) => {
                console.log(`\n${idx + 1}. ${violation.id}: ${violation.description}`);
                console.log(`   Impact: ${violation.impact}`);
                console.log(`   Help: ${violation.helpUrl}`);
                console.log(`   Affected elements: ${violation.nodes.length}`);

                violation.nodes.slice(0, 3).forEach(node => {
                    console.log(`   - ${node.html}`);
                    console.log(`     Fix: ${node.failureSummary}`);
                });
            });
        } else {
            console.log('✓ No accessibility violations found');
        }

        // Assert no critical violations
        const criticalViolations = violations.filter(v => v.impact === 'critical');
        expect(criticalViolations).toHaveLength(0);
    });

    test('Keyboard navigation', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Tab through interactive elements
        const focusableSelectors = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = await page.$$eval(focusableSelectors, els => els.length);

        console.log(`Found ${focusableElements} focusable elements`);

        // Tab through all
        for (let i = 0; i < focusableElements; i++) {
            await page.keyboard.press('Tab');

            // Get currently focused element
            const focusedElement = await page.evaluate(() => {
                const el = document.activeElement;
                return {
                    tag: el.tagName,
                    text: el.textContent?.substring(0, 30),
                    hasVisibleFocus: window.getComputedStyle(el, ':focus').outlineWidth !== '0px'
                };
            });

            if (!focusedElement.hasVisibleFocus) {
                console.log(`⚠️  Element has no visible focus indicator: ${focusedElement.tag}`);
            }
        }

        console.log('✓ Keyboard navigation complete');
    });

    test('Screen reader compatibility', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Check for proper ARIA labels
        const missingLabels = await page.$$eval('button, input, select, textarea', elements => {
            return elements.filter(el => {
                const hasLabel = el.labels && el.labels.length > 0;
                const hasAriaLabel = el.hasAttribute('aria-label');
                const hasAriaLabelledby = el.hasAttribute('aria-labelledby');

                return !hasLabel && !hasAriaLabel && !hasAriaLabelledby;
            }).map(el => ({
                tag: el.tagName,
                type: el.type,
                text: el.textContent?.substring(0, 30)
            }));
        });

        if (missingLabels.length > 0) {
            console.log('⚠️  Elements missing labels:', missingLabels);
        }

        // Check for alt text on images
        const missingAlt = await page.$$eval('img', imgs =>
            imgs.filter(img => !img.alt).map(img => ({
                src: img.src.substring(0, 50)
            }))
        );

        if (missingAlt.length > 0) {
            console.log('⚠️  Images missing alt text:', missingAlt);
        }
    });

    test('Color contrast', async ({ page }) => {
        await page.goto('http://localhost:3000');

        const contrastIssues = await page.evaluate(() => {
            function getLuminance(rgb) {
                const [r, g, b] = rgb.match(/\d+/g).map(Number);
                const [rs, gs, bs] = [r, g, b].map(c => {
                    c = c / 255;
                    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
                });
                return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
            }

            function getContrast(rgb1, rgb2) {
                const lum1 = getLuminance(rgb1);
                const lum2 = getLuminance(rgb2);
                const brightest = Math.max(lum1, lum2);
                const darkest = Math.min(lum1, lum2);
                return (brightest + 0.05) / (darkest + 0.05);
            }

            const issues = [];
            const elements = document.querySelectorAll('*');

            elements.forEach(el => {
                const styles = window.getComputedStyle(el);
                const color = styles.color;
                const bgColor = styles.backgroundColor;

                if (color && bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
                    const contrast = getContrast(color, bgColor);

                    // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
                    const fontSize = parseFloat(styles.fontSize);
                    const threshold = fontSize >= 24 || (fontSize >= 19 && styles.fontWeight === 'bold') ? 3 : 4.5;

                    if (contrast < threshold) {
                        issues.push({
                            element: el.tagName,
                            text: el.textContent?.substring(0, 30),
                            contrast: contrast.toFixed(2),
                            required: threshold,
                            color,
                            bgColor
                        });
                    }
                }
            });

            return issues;
        });

        if (contrastIssues.length > 0) {
            console.log('⚠️  Color contrast issues:', contrastIssues.slice(0, 5));
        }
    });
});
```

**CHECKPOINT**: Accessibility tests complete ✓

### Phase 5: Performance Testing (15%)

```javascript
test('Core Web Vitals', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
            const vitals = {};

            // Largest Contentful Paint (LCP)
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                vitals.lcp = entries[entries.length - 1].renderTime;
            }).observe({ type: 'largest-contentful-paint', buffered: true });

            // First Input Delay (FID)
            new PerformanceObserver((list) => {
                vitals.fid = list.getEntries()[0].processingStart - list.getEntries()[0].startTime;
            }).observe({ type: 'first-input', buffered: true });

            // Cumulative Layout Shift (CLS)
            let cls = 0;
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        cls += entry.value;
                    }
                }
                vitals.cls = cls;
            }).observe({ type: 'layout-shift', buffered: true });

            // First Contentful Paint (FCP)
            const paintEntries = performance.getEntriesByType('paint');
            vitals.fcp = paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime;

            // Time to Interactive (TTI)
            vitals.tti = performance.timing.domInteractive - performance.timing.navigationStart;

            setTimeout(() => resolve(vitals), 5000);
        });
    });

    console.log('Core Web Vitals:');
    console.log(`  LCP: ${metrics.lcp}ms (target: <2500ms) ${metrics.lcp < 2500 ? '✓' : '⚠️'}`);
    console.log(`  FID: ${metrics.fid}ms (target: <100ms) ${metrics.fid < 100 ? '✓' : '⚠️'}`);
    console.log(`  CLS: ${metrics.cls} (target: <0.1) ${metrics.cls < 0.1 ? '✓' : '⚠️'}`);
    console.log(`  FCP: ${metrics.fcp}ms (target: <1800ms) ${metrics.fcp < 1800 ? '✓' : '⚠️'}`);
    console.log(`  TTI: ${metrics.tti}ms (target: <3800ms) ${metrics.tti < 3800 ? '✓' : '⚠️'}`);

    // Assert performance targets
    expect(metrics.lcp).toBeLessThan(2500);
    expect(metrics.cls).toBeLessThan(0.1);
});
```

**CHECKPOINT**: Performance tests complete ✓

### Phase 6: Browser DevTools Integration & Debugging (20%)

**Use `ui-debugger` agent with Chrome DevTools Protocol:**

```javascript
test('Debug layout issues', async ({ page }) => {
    // Enable CDP
    const client = await page.context().newCDPSession(page);

    // Enable coverage
    await client.send('Profiler.enable');
    await client.send('CSS.enable');
    await client.send('CSS.startRuleUsageTracking');

    await page.goto('http://localhost:3000');

    // Get unused CSS
    const { ruleUsage } = await client.send('CSS.stopRuleUsageTracking');
    const unusedCSS = ruleUsage.filter(rule => !rule.used);

    console.log(`Unused CSS rules: ${unusedCSS.length}`);

    // Get JavaScript coverage
    await client.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
    await page.waitForTimeout(5000);
    const { result } = await client.send('Profiler.takePreciseCoverage');

    let totalBytes = 0;
    let usedBytes = 0;

    result.forEach(entry => {
        totalBytes += entry.functions.reduce((acc, fn) => acc + (fn.ranges[0]?.endOffset - fn.ranges[0]?.startOffset || 0), 0);
        usedBytes += entry.functions.reduce((acc, fn) => {
            return acc + fn.ranges.reduce((sum, range) => sum + (range.count > 0 ? range.endOffset - range.startOffset : 0), 0);
        }, 0);
    });

    const coverage = (usedBytes / totalBytes * 100).toFixed(2);
    console.log(`JavaScript coverage: ${coverage}%`);

    if (coverage < 50) {
        console.log('⚠️  High amount of unused JavaScript. Consider code splitting.');
    }
});

test('Console errors detection', async ({ page }) => {
    const consoleErrors = [];
    const networkErrors = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    page.on('pageerror', error => {
        consoleErrors.push(error.message);
    });

    page.on('requestfailed', request => {
        networkErrors.push({
            url: request.url(),
            failure: request.failure().errorText
        });
    });

    await page.goto('http://localhost:3000');

    // Navigate through app
    await page.click('a[href="/about"]');
    await page.waitForTimeout(1000);

    if (consoleErrors.length > 0) {
        console.log('⚠️  Console errors detected:', consoleErrors);
    }

    if (networkErrors.length > 0) {
        console.log('⚠️  Network errors detected:', networkErrors);
    }

    expect(consoleErrors).toHaveLength(0);
    expect(networkErrors).toHaveLength(0);
});
```

**Auto-Fix Common Issues:**
```javascript
async function autoFixIssues(page, issues) {
    for (const issue of issues) {
        if (issue.type === 'missing-alt-text') {
            // Generate alt text using image recognition or file name
            const altText = generateAltText(issue.src);

            // Update the code
            await updateFile(issue.file, issue.line, `alt="${altText}"`);
        }

        if (issue.type === 'missing-aria-label') {
            // Generate appropriate ARIA label
            const ariaLabel = generateAriaLabel(issue.element);

            await updateFile(issue.file, issue.line, `aria-label="${ariaLabel}"`);
        }

        if (issue.type === 'low-contrast') {
            // Suggest color with better contrast
            const newColor = adjustContrast(issue.color, issue.bgColor);

            console.log(`Suggested fix: Change ${issue.color} to ${newColor}`);
        }
    }
}
```

**CHECKPOINT**: Debugging complete, issues identified ✓

### Phase 7: Automated Test Generation (10%)

```javascript
// Generate test suite from recorded user interactions
async function generateTests(page) {
    const interactions = [];

    // Record all interactions
    await page.exposeFunction('recordInteraction', (interaction) => {
        interactions.push(interaction);
    });

    await page.evaluate(() => {
        document.addEventListener('click', (e) => {
            window.recordInteraction({
                type: 'click',
                selector: e.target.getAttribute('data-testid') || e.target.className,
                text: e.target.textContent.substring(0, 30)
            });
        });

        document.addEventListener('input', (e) => {
            window.recordInteraction({
                type: 'input',
                selector: e.target.name || e.target.id,
                value: e.target.value
            });
        });
    });

    // User performs actions...
    await page.waitForTimeout(60000); // Record for 1 minute

    // Generate test code
    const testCode = `
import { test, expect } from '@playwright/test';

test('Generated user flow', async ({ page }) => {
    await page.goto('http://localhost:3000');

    ${interactions.map(i => {
        if (i.type === 'click') {
            return `await page.click('[data-testid="${i.selector}"]');`;
        } else if (i.type === 'input') {
            return `await page.fill('input[name="${i.selector}"]', '${i.value}');`;
        }
    }).join('\n    ')}

    await page.screenshot({ path: 'test-results/user-flow.png' });
});
`;

    // Save to file
    fs.writeFileSync('tests/generated/user-flow.spec.js', testCode);
    console.log('✓ Test suite generated');
}
```

**CHECKPOINT**: Test suite generated ✓

## Success Criteria

Web UI testing complete when:
- ✅ Application running and accessible
- ✅ Visual regression tests passing (< 0.5% difference)
- ✅ Responsive design works on mobile/tablet/desktop
- ✅ All functional flows work correctly
- ✅ Zero critical accessibility violations
- ✅ Core Web Vitals meet targets (LCP < 2.5s, CLS < 0.1)
- ✅ No console errors
- ✅ No broken links or failed requests
- ✅ Automated test suite generated

## Example Usage

### Example 1: Test Production Application

```bash
/test-web-ui "https://myapp.com" --fix-issues --generate-tests
```

**Autonomous execution:**
1. visual-testing agent navigates to application
2. Takes screenshots and performs visual regression tests
3. Tests all user flows (login, signup, checkout, etc.)
4. accessibility-tester runs WCAG 2.1 AA audit
5. Identifies 15 issues (3 contrast, 5 missing alt text, 7 missing ARIA labels)
6. ui-debugger analyzes issues and suggests fixes
7. Auto-applies fixes for simple issues (alt text, ARIA labels)
8. Generates pull request with fixes
9. Creates comprehensive test suite (47 tests generated)

**Time: 15-30 minutes**

### Example 2: Test During Development

```bash
/test-web-ui "http://localhost:3000"
```

**Autonomous execution:**
1. Detects React dev server running
2. Performs smoke tests on all routes
3. Captures screenshots for visual review
4. Runs accessibility checks
5. Reports issues to console in real-time
6. Developer fixes issues
7. Re-runs tests automatically on file change

**Time: 5-10 minutes (continuous)**

Autonomous, comprehensive web UI testing that detects, debugs, and fixes frontend issues automatically.
