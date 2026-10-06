"""Regression checks for BrainWays rename + relative paths + a11y."""
import os
import json
from playwright.sync_api import sync_playwright
from PIL import Image

OUT = r"C:\Users\Timothy Piton\w\code\neurofun"
URL = "http://localhost:5173"
errs = []


def content_pct(path):
    im = Image.open(path).convert("RGB"); px = im.load(); w, h = im.size
    bg = (12, 16, 24)
    c = 0
    for y in range(0, h, 3):
        for x in range(0, w, 3):
            r, g, b = px[x, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > 30:
                c += 1
    return round(100 * c / (((w // 3) + 1) * ((h // 3) + 1)), 1)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"])
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    reqs = []
    page.on("request", lambda r: reqs.append(r.url))
    page.on("requestfailed", lambda r: errs.append(("requestfailed", r.url + " :: " + str(r.failure))))
    page.on("console", lambda m: errs.append((m.type, m.text)) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errs.append(("pageerror", str(e))))

    page.goto(URL, wait_until="domcontentloaded", timeout=60000)
    try:
        page.wait_for_load_state("networkidle", timeout=30000)
    except Exception:
        pass
    page.wait_for_timeout(10000)

    print("== (1) BRAND / TITLE ==", flush=True)
    print("  document.title:", json.dumps(page.title()), flush=True)
    brand = page.evaluate("""() => {
        const el = [...document.querySelectorAll('header *, nav *, a, span, div')]
            .map(e => (e.innerText||'').trim())
            .find(t => /atlas/i.test(t) && t.length < 60);
        return el || '';
    }""")
    print("  brand text:", json.dumps(brand), flush=True)
    print("  body contains 'BrainWays':", "BrainWays" in page.inner_text("body"), flush=True)
    print("  body contains 'Neurofun':", "Neurofun" in page.inner_text("body"), flush=True)

    print("\n== (2)(3) BRAIN RENDER (Explore) ==", flush=True)
    page.locator("canvas").screenshot(path=os.path.join(OUT, "fb23_explore_canvas.png"))
    pct = content_pct(os.path.join(OUT, "fb23_explore_canvas.png"))
    print(f"  canvas content % = {pct}", flush=True)
    page.screenshot(path=os.path.join(OUT, "fb23_explore_full.png"))

    print("\n== (4) CANVAS A11Y ==", flush=True)
    a11y = page.evaluate("""() => {
        const c = document.querySelector('canvas');
        return {ariaLabel: c && c.getAttribute('aria-label'), role: c && c.getAttribute('role')};
    }""")
    print("  canvas a11y:", json.dumps(a11y), flush=True)

    print("\n== (5) FOCUS-VISIBLE / STYLES ==", flush=True)
    styles = page.evaluate("""() => {
        const sheets = [...document.styleSheets];
        let fv = 0;
        for (const s of sheets) {
            try { for (const r of s.cssRules) if (r.selectorText && /focus-visible/.test(r.selectorText)) fv++; }
            catch (e) {}
        }
        return {focusVisibleRules: fv,
                bodyBg: getComputedStyle(document.body).backgroundColor,
                headerHeight: document.querySelector('header')?.getBoundingClientRect().height || null};
    }""")
    print("  styles:", json.dumps(styles), flush=True)

    print("\n== (6) ICON / MANIFEST ==", flush=True)
    man_url = page.evaluate("""() => {
        const l = document.querySelector('link[rel="manifest"]');
        return l ? l.getAttribute('href') : null;
    }""")
    print("  manifest link href:", json.dumps(man_url), flush=True)

    print("\n  requests to models/draco/icons:", flush=True)
    for u in reqs:
        if any(k in u for k in ["brain.glb", "draco", "icon-", "manifest"]):
            print("   ", u, flush=True)

    print("\n== console/failures ==", flush=True)
    print(f"  {len(errs)}", flush=True)
    for t, m in errs:
        print(f"  [{t}] {m[:200]}", flush=True)
    browser.close()
