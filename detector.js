// Vibe Code Detector v2.0 — Capped Category Scoring Architecture
// Based on Detection Reference Specification v1.0

(function () {
  "use strict";

  const signals = [];
  const negativeSignals = [];

  // Flags for stack multiplier
  let flagReactNext = false;
  let flagTailwindShadcn = false;
  let flagVercel = false;

  // Category caps (max contribution to final score)
  const CATEGORY_CAPS = {
    techstack: 25,
    source: 20,
    content: 15,
    design: 15,
    security: 10,
    infra: 10,
    runtime: 5,
  };

  function addSignal(category, name, description, weight) {
    signals.push({ category, name, description, weight });
  }

  function addNegative(name, description, points) {
    negativeSignals.push({ name, description, points });
  }

  // Helper: get all inline script text
  function getInlineScriptText() {
    const scripts = document.querySelectorAll("script:not([src])");
    let text = "";
    scripts.forEach((s) => (text += s.textContent));
    return text;
  }

  // Helper: get all external script srcs
  function getScriptSrcs() {
    return [...document.querySelectorAll("script[src]")].map(
      (s) => s.getAttribute("src") || ""
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 1: TECH STACK FINGERPRINTING (cap: 25)
  // ═══════════════════════════════════════════════════════════════════════

  function checkFrameworks() {
    const html = document.documentElement.innerHTML;
    const scriptSrcs = getScriptSrcs();
    const allSrcs = scriptSrcs.join(" ");

    // React / Next.js (+2)
    const hasNext =
      !!document.getElementById("__next") ||
      !!document.getElementById("__NEXT_DATA__") ||
      scriptSrcs.some((s) => s.includes("/_next/"));
    const hasReact =
      !!document.querySelector("[data-reactroot]") ||
      !!document.querySelector("[data-react-helmet]") ||
      hasNext;

    if (hasReact) {
      flagReactNext = true;
      addSignal(
        "techstack",
        hasNext ? "Next.js detected" : "React detected",
        hasNext
          ? "Next.js framework — the #1 AI tool default"
          : "React framework detected",
        2
      );
    }

    // Vite build (+2)
    if (
      scriptSrcs.some((s) => s.includes("/@vite/client")) ||
      document.querySelector('script[type="module"][src*=".tsx"]') ||
      document.querySelector('script[type="module"][src*=".jsx"]')
    ) {
      addSignal("techstack", "Vite build", "Vite bundler signature detected", 2);
    }

    // Astro (+2)
    if (
      document.querySelector("astro-island") ||
      document.querySelector("[data-astro-cid]")
    ) {
      addSignal("techstack", "Astro detected", "Astro framework markers found", 2);
    }

    // Svelte/SvelteKit (+1)
    if (
      document.querySelector('[class*="svelte-"]') ||
      html.includes("__sveltekit")
    ) {
      addSignal("techstack", "Svelte detected", "SvelteKit framework markers", 1);
    }

    // Vue/Nuxt (+1)
    if (
      document.getElementById("__nuxt") ||
      document.querySelector("[data-v-]") ||
      html.includes("__VUE__") ||
      html.includes("__NUXT__")
    ) {
      addSignal("techstack", "Vue/Nuxt detected", "Vue.js framework markers", 1);
    }
  }

  function checkCSSLibraries() {
    const root = getComputedStyle(document.documentElement);
    const allElements = document.querySelectorAll("body *");
    const html = document.documentElement.innerHTML;

    // shadcn/ui detection (+5) — check CSS variables
    const shadcnVars = [
      "--background", "--foreground", "--primary", "--secondary",
      "--muted", "--accent", "--destructive", "--border",
      "--input", "--ring", "--radius",
    ];
    const presentVars = shadcnVars.filter(
      (v) => root.getPropertyValue(v).trim() !== ""
    );
    if (presentVars.length >= 6) {
      flagTailwindShadcn = true;
      addSignal(
        "techstack",
        "shadcn/ui components",
        `${presentVars.length}/11 shadcn CSS variables detected — strongest AI stack signal`,
        5
      );
    }

    // Radix UI primitives (+3)
    const radixAttrs = document.querySelectorAll(
      "[data-radix-collection-item], [data-radix-popper-content-wrapper], [data-state], [data-orientation]"
    );
    if (radixAttrs.length >= 3) {
      addSignal(
        "techstack",
        "Radix UI primitives",
        `${radixAttrs.length} Radix UI data attributes found`,
        3
      );
    }

    // Tailwind CSS detection (+3)
    let tailwindCount = 0;
    const twPattern =
      /^(?:flex|grid|block|inline|hidden|relative|absolute|fixed|sticky|w-|h-|p-|m-|px-|py-|mx-|my-|pt-|pb-|pl-|pr-|mt-|mb-|ml-|mr-|text-|font-|bg-|border-|rounded-|shadow-|hover:|focus:|dark:|sm:|md:|lg:|xl:|2xl:|min-|max-|gap-|space-|items-|justify-|self-|col-|row-|overflow-|z-|opacity-|transition-|duration-|ease-|animate-|cursor-|ring-|from-|to-|via-)/;

    // Sample first 500 elements for performance
    const sampleEls = [...allElements].slice(0, 500);
    sampleEls.forEach((el) => {
      el.classList.forEach((cls) => {
        if (twPattern.test(cls)) tailwindCount++;
      });
    });

    // Also check for Tailwind CSS custom properties
    const hasTwVars = root.getPropertyValue("--tw-ring-color").trim() !== "" ||
      root.getPropertyValue("--tw-shadow").trim() !== "";

    if (tailwindCount > 100 || hasTwVars) {
      if (!flagTailwindShadcn) flagTailwindShadcn = true;
      addSignal(
        "techstack",
        "Tailwind CSS",
        `${tailwindCount}+ Tailwind utility classes detected`,
        3
      );
    }

    // Multiple CSS frameworks (+3)
    const cssFrameworks = [];
    if (tailwindCount > 50 || hasTwVars) cssFrameworks.push("Tailwind");
    if (html.includes("bootstrap") || document.querySelector('[class*="btn-primary"]'))
      cssFrameworks.push("Bootstrap");
    if (document.querySelector('[class*="chakra-"]')) cssFrameworks.push("Chakra");
    if (document.querySelector('[class*="ant-"]')) cssFrameworks.push("Ant Design");
    if (document.querySelector('[class*="mantine-"]')) cssFrameworks.push("Mantine");

    if (cssFrameworks.length >= 2) {
      addSignal(
        "techstack",
        "Multiple CSS frameworks",
        `${cssFrameworks.join(" + ")} loaded simultaneously`,
        3
      );
    }
  }

  function checkBaaS() {
    const scriptSrcs = getScriptSrcs();
    const allSrcs = scriptSrcs.join(" ");
    const inlineJS = getInlineScriptText();
    const html = document.documentElement.innerHTML;

    // Supabase (+4)
    if (
      allSrcs.includes("supabase") ||
      inlineJS.includes("supabase") ||
      html.includes("supabase.co")
    ) {
      addSignal(
        "techstack",
        "Supabase backend",
        "Supabase BaaS detected — default AI backend choice",
        4
      );
    }

    // Firebase (+3)
    if (
      allSrcs.includes("firebase") ||
      inlineJS.includes("firebaseConfig") ||
      html.includes("firebaseio.com") ||
      html.includes("firebaseapp.com")
    ) {
      addSignal(
        "techstack",
        "Firebase backend",
        "Firebase BaaS detected",
        3
      );
    }

    // Clerk auth (+3)
    if (
      scriptSrcs.some((s) => s.includes("clerk")) ||
      html.includes("__clerk") ||
      document.querySelector('[id*="clerk"]')
    ) {
      addSignal(
        "techstack",
        "Clerk authentication",
        "Clerk auth service — common AI-generated auth choice",
        3
      );
    }

    // Vercel AI SDK (+4)
    if (
      inlineJS.includes("@ai-sdk") ||
      inlineJS.includes("useChat") ||
      inlineJS.includes("useCompletion") ||
      inlineJS.includes("StreamingTextResponse") ||
      allSrcs.includes("ai-sdk")
    ) {
      addSignal(
        "techstack",
        "Vercel AI SDK",
        "AI SDK imports detected — site uses AI features",
        4
      );
    }

    // OpenAI / Anthropic API (+3)
    if (inlineJS.includes("api.openai.com") || html.includes("api.openai.com")) {
      addSignal("techstack", "OpenAI API calls", "Client-side OpenAI API integration", 3);
    }
    if (inlineJS.includes("api.anthropic.com") || html.includes("api.anthropic.com")) {
      addSignal("techstack", "Anthropic API calls", "Client-side Anthropic API integration", 3);
    }
  }

  function checkAIBuilderMeta() {
    // Generator meta tag (+5 in spec, scored under techstack)
    const generators = document.querySelectorAll('meta[name="generator"]');
    generators.forEach((meta) => {
      const content = (meta.getAttribute("content") || "").toLowerCase();
      const builders = [
        "v0", "bolt", "lovable", "replit", "cursor", "windsurf",
        "gptengineer", "create.xyz", "framer",
      ];
      for (const builder of builders) {
        if (content.includes(builder)) {
          addSignal(
            "techstack",
            "Built with " + builder,
            "Generator meta tag: " + meta.getAttribute("content"),
            5
          );
          break;
        }
      }
    });

    // Builder-specific data attributes
    const html = document.documentElement.outerHTML;
    const artifacts = [
      { pattern: /data-lovable/i, name: "Lovable" },
      { pattern: /gptengineer/i, name: "GPT Engineer" },
      { pattern: /data-v0/i, name: "v0.dev" },
      { pattern: /__framer/i, name: "Framer" },
    ];
    for (const { pattern, name } of artifacts) {
      if (pattern.test(html)) {
        addSignal("techstack", `${name} artifacts`, `${name} builder markers in source`, 5);
        break;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 2: SOURCE CODE ANALYSIS (cap: 20)
  // ═══════════════════════════════════════════════════════════════════════

  function checkSourceCode() {
    const inlineJS = getInlineScriptText();
    const html = document.documentElement.innerHTML;

    // Exposed API keys (+5)
    const keyPatterns = [
      /sk-[a-zA-Z0-9]{20,}/,                    // OpenAI
      /hf_[a-zA-Z0-9]{20,}/,                    // Hugging Face
      /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*[:=]\s*["'][^"']+/,
      /eyJhbGciOi[a-zA-Z0-9+/=]{50,}/,          // JWT tokens (Supabase anon keys)
      /pk_live_[a-zA-Z0-9]{20,}/,               // Stripe publishable
      /AKIA[A-Z0-9]{16}/,                        // AWS access key
    ];
    for (const pattern of keyPatterns) {
      if (pattern.test(inlineJS) || pattern.test(html)) {
        addSignal(
          "security",
          "Exposed API keys",
          "API keys/tokens found in client-side source code",
          5
        );
        break;
      }
    }

    // Console.log in production (+3)
    const consoleLogs = inlineJS.match(/console\.(log|warn|error|debug)\(/g);
    if (consoleLogs && consoleLogs.length > 5) {
      addSignal(
        "source",
        "Console statements",
        `${consoleLogs.length} console statements in production code`,
        3
      );
    }

    // TODO/FIXME/HACK comments (+3)
    const todoPatterns = [
      /\/\/\s*TODO/gi, /\/\/\s*FIXME/gi, /\/\/\s*HACK/gi, /\/\/\s*XXX/gi,
      /\/\/\s*@ts-ignore/gi, /\/\/\s*@ts-nocheck/gi, /\/\*\s*eslint-disable/gi,
    ];
    let todoCount = 0;
    todoPatterns.forEach((p) => {
      const m = inlineJS.match(p);
      if (m) todoCount += m.length;
    });
    if (todoCount >= 2) {
      addSignal(
        "source",
        "TODO/FIXME in production",
        `${todoCount} placeholder comments left in production code`,
        3
      );
    }

    // AI-style verbose comments (+2)
    const aiComments = [
      /\/\/\s*This (?:function|component|code) (?:handles|manages|is responsible for)/gi,
      /\/\*\*?\s*\n?\s*\*?\s*This (?:function|component|hook) (?:handles|manages|takes care of)/gi,
    ];
    let aiCommentCount = 0;
    aiComments.forEach((p) => {
      const m = inlineJS.match(p);
      if (m) aiCommentCount += m.length;
    });
    if (aiCommentCount >= 3) {
      addSignal(
        "source",
        "AI-style comments",
        `${aiCommentCount} overly verbose AI-generated comments`,
        2
      );
    }

    // data-testid remnants (+2)
    const testIds = document.querySelectorAll("[data-testid]");
    if (testIds.length >= 5) {
      addSignal(
        "source",
        "data-testid remnants",
        `${testIds.length} test ID attributes left in production`,
        2
      );
    }

    // Conflicting Tailwind utilities (+3)
    const conflicts = [
      ["hidden", "flex"], ["hidden", "block"], ["hidden", "grid"],
      ["text-left", "text-center"], ["text-left", "text-right"],
      ["text-center", "text-right"],
      ["static", "absolute"], ["static", "fixed"],
      ["visible", "invisible"],
    ];
    let conflictCount = 0;
    const sampleEls = [...document.querySelectorAll("body *")].slice(0, 300);
    sampleEls.forEach((el) => {
      const classes = [...el.classList];
      for (const [a, b] of conflicts) {
        if (classes.includes(a) && classes.includes(b)) {
          conflictCount++;
          break;
        }
      }
    });
    if (conflictCount >= 2) {
      addSignal(
        "source",
        "Conflicting Tailwind classes",
        `${conflictCount} elements with contradictory utility classes`,
        3
      );
    }

    // Z-index chaos (+2)
    const zValues = new Set();
    sampleEls.forEach((el) => {
      el.classList.forEach((cls) => {
        if (/^z-\[?\d+\]?$/.test(cls) || /^z-(10|20|30|40|50)$/.test(cls)) {
          zValues.add(cls);
        }
      });
    });
    if (zValues.size >= 5) {
      addSignal(
        "source",
        "Z-index chaos",
        `${zValues.size} different z-index values scattered throughout`,
        2
      );
    }

    // Tailwind class overload (+2)
    let maxClassCount = 0;
    sampleEls.forEach((el) => {
      if (el.classList.length > maxClassCount) maxClassCount = el.classList.length;
    });
    if (maxClassCount > 20) {
      addSignal(
        "source",
        "Class overload",
        `Element with ${maxClassCount} classes — utility class soup`,
        2
      );
    }

    // Inline styles mixed with Tailwind (+2)
    let inlineStyleCount = 0;
    sampleEls.forEach((el) => {
      if (el.getAttribute("style")) inlineStyleCount++;
    });
    if (inlineStyleCount > 20) {
      addSignal(
        "source",
        "Mixed styling approaches",
        `${inlineStyleCount} inline styles mixed with utility classes`,
        2
      );
    }

    // Missing lang attribute (+1)
    if (!document.documentElement.getAttribute("lang")) {
      addSignal("source", "Missing lang attribute", "No lang attribute on <html>", 1);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 3: CONTENT & COPY ANALYSIS (cap: 15)
  // ═══════════════════════════════════════════════════════════════════════

  function checkContent() {
    const bodyText = document.body?.innerText || "";
    const bodyLower = bodyText.toLowerCase();
    const title = document.title;
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content");

    // Lorem ipsum (+5)
    if (/lorem ipsum|dolor sit amet/i.test(bodyText)) {
      addSignal("content", "Lorem ipsum", "Placeholder text in production", 5);
    }

    // Acme/Example references (+4)
    const placeholderRefs = [
      /\bacme\b/i, /\bexample corp\b/i, /\byour company\b/i,
      /\[your name\]/i, /\[product name\]/i, /\[company name\]/i,
      /\bjohn doe\b/i, /\bjane doe\b/i, /example@example\.com/i,
    ];
    for (const p of placeholderRefs) {
      if (p.test(bodyText)) {
        addSignal("content", "Placeholder references", "Template placeholder text still visible", 4);
        break;
      }
    }

    // AI filler phrases — Tier 1 (high confidence, +2 each, max 4 pts)
    const tier1Phrases = [
      /whether you're a/i, /say goodbye to/i, /it's that simple/i,
      /from concept to creation/i, /designed with you in mind/i,
      /in today's fast-paced world/i, /look no further/i,
      /your one-stop solution/i, /join thousands of/i,
    ];
    let tier1Hits = 0;
    const tier1Found = [];
    tier1Phrases.forEach((p) => {
      const m = bodyText.match(p);
      if (m) { tier1Hits++; if (tier1Found.length < 2) tier1Found.push(m[0]); }
    });
    if (tier1Hits > 0) {
      addSignal(
        "content",
        "AI filler phrases (high confidence)",
        "Found: " + tier1Found.join(", ") + (tier1Hits > 2 ? " + " + (tier1Hits - 2) + " more" : ""),
        Math.min(tier1Hits * 2, 4)
      );
    }

    // AI filler phrases — Tier 2 (common/ambiguous, +1 each, max 3 pts)
    const tier2Phrases = [
      /streamline your workflow/i, /leverage the power/i,
      /supercharge your/i, /elevate your/i, /game[\s-]?changing/i,
      /cutting[\s-]?edge/i, /unlock the full potential/i,
      /revolutionize your/i, /harness the power/i,
      /empower your team/i, /at the forefront/i,
      /seamlessly integrate/i, /take .+ to the next level/i,
    ];
    let tier2Hits = 0;
    const tier2Found = [];
    tier2Phrases.forEach((p) => {
      const m = bodyText.match(p);
      if (m) { tier2Hits++; if (tier2Found.length < 2) tier2Found.push(m[0]); }
    });
    if (tier2Hits > 0) {
      addSignal(
        "content",
        "AI filler phrases",
        "Found: " + tier2Found.join(", ") + (tier2Hits > 2 ? " + " + (tier2Hits - 2) + " more" : ""),
        Math.min(tier2Hits, 3)
      );
    }

    // Default page titles (+3)
    const defaultTitles = [
      "Create Next App", "Vite + React", "Vite + Vue", "Vite App",
      "React App", "My App", "Home", "Index",
    ];
    if (defaultTitles.includes(title) || title === "") {
      const displayTitle = title || "(empty)";
      addSignal("content", "Default page title", "Title: " + JSON.stringify(displayTitle), 3);
    }

    // Template meta descriptions (+3)
    if (!metaDesc || metaDesc === "") {
      addSignal("content", "Missing meta description", "No meta description set", 2);
    } else {
      const genericStarts = [
        "a web application", "built with", "powered by", "welcome to",
        "this is a", "a simple", "an app", "my app", "my project",
        "a modern", "a platform", "the best",
      ];
      const lower = metaDesc.toLowerCase();
      for (const g of genericStarts) {
        if (lower.startsWith(g)) {
          addSignal("content", "Generic meta description", "Starts with: " + g + "...", 3);
          break;
        }
      }
    }

    // Cookie-cutter landing page sections (+3)
    const sections = ["Features", "How it works", "Pricing", "Testimonials", "FAQ", "Get Started", "Contact"];
    const headings = [...document.querySelectorAll("h1, h2, h3")].map((h) => h.textContent.trim().toLowerCase());
    let matched = 0;
    sections.forEach((s) => { if (headings.includes(s.toLowerCase())) matched++; });
    if (matched >= 5) {
      addSignal("content", "Cookie-cutter landing page", `${matched}/${sections.length} standard AI sections`, 3);
    } else if (matched >= 4) {
      addSignal("content", "Template page structure", `${matched}/${sections.length} typical AI sections`, 1);
    }

    // Copyright errors
    if (/all rights? reversed/i.test(bodyText)) {
      addSignal("content", 'Copyright typo "reversed"', "Classic AI copy error", 3);
    }

    // "Built with" badges (+2)
    const builtWith = bodyText.match(
      /(?:built|made|created|powered|crafted)\s+(?:with|by|using)\s+(?:love|React|Next\.js|Vercel|AI|Claude|GPT|ChatGPT|Cursor|v0|bolt|lovable|replit)/gi
    );
    if (builtWith) {
      addSignal("content", "Built-with badge", builtWith[0], 2);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 4: DESIGN PATTERN ANALYSIS (cap: 15)
  // ═══════════════════════════════════════════════════════════════════════

  function checkDesignPatterns() {
    const html = document.documentElement.innerHTML;
    const root = getComputedStyle(document.documentElement);
    const scriptSrcs = getScriptSrcs();

    // Lucide icons (+4)
    const hasLucide =
      document.querySelector('[class*="lucide-"]') ||
      html.includes("lucide-react") ||
      scriptSrcs.some((s) => s.includes("lucide"));
    if (hasLucide) {
      addSignal("design", "Lucide icons", "Lucide icon library — default for shadcn/ui and AI output", 4);
    }

    // shadcn default theme detection (+4)
    // Check if CSS variables match the default shadcn theme (unmodified)
    const bg = root.getPropertyValue("--background").trim();
    const fg = root.getPropertyValue("--foreground").trim();
    // Default shadcn light: --background: 0 0% 100%, --foreground: 240 10% 3.9%
    // or similar HSL patterns
    if (bg && fg) {
      const isDefault =
        (bg.includes("0 0% 100%") || bg.includes("0, 0%, 100%")) ||
        (bg.includes("240 10%") && fg.includes("0 0% 100%"));
      if (isDefault) {
        addSignal("design", "Default shadcn theme", "Using unmodified shadcn/ui default color theme", 4);
      }
    }

    // Purple gradient hero (+2)
    const heroEls = document.querySelectorAll(
      '[class*="hero"], [class*="Hero"], section:first-of-type'
    );
    heroEls.forEach((el) => {
      const bgImg = getComputedStyle(el).backgroundImage;
      if (bgImg && bgImg.includes("gradient")) {
        addSignal("design", "Gradient hero section", "AI-generated gradient hero pattern", 2);
        return;
      }
    });

    // 3-column card grid (+3)
    const grids = document.querySelectorAll(
      '[class*="grid-cols-3"], [class*="grid cols-3"]'
    );
    // Also check flex containers with exactly 3 children that look like feature cards
    const flexContainers = document.querySelectorAll('[class*="flex"]');
    let cardGridFound = false;
    flexContainers.forEach((container) => {
      if (cardGridFound) return;
      const children = container.children;
      if (children.length === 3) {
        // Check if all children have similar structure (heading + text)
        let similar = 0;
        [...children].forEach((child) => {
          if (child.querySelector("h3, h4") && child.querySelector("p")) similar++;
        });
        if (similar === 3) cardGridFound = true;
      }
    });
    if (grids.length > 0 || cardGridFound) {
      addSignal("design", "3-column card grid", "Feature section with 3 identical cards — top AI pattern", 3);
    }

    // Dark mode toggle (+2)
    const hasDarkToggle =
      scriptSrcs.some((s) => s.includes("next-themes")) ||
      html.includes("next-themes") ||
      document.querySelector('[class*="theme-toggle"], [class*="dark-mode"], [aria-label*="theme"], [aria-label*="dark"]');
    if (hasDarkToggle) {
      addSignal("design", "Dark mode toggle", "Theme toggle present — AI tools almost always include this", 2);
    }

    // Inconsistent border-radius (+2)
    const radiusValues = new Set();
    const boxEls = document.querySelectorAll(
      "button, input, [class*='card'], [class*='Card'], [class*='badge'], [class*='dialog']"
    );
    boxEls.forEach((el) => {
      const br = getComputedStyle(el).borderRadius;
      if (br && br !== "0px") radiusValues.add(br);
    });
    if (radiusValues.size >= 5) {
      addSignal("design", "Inconsistent border-radius", `${radiusValues.size} different radius values`, 2);
    }

    // Generic AI fonts (+1)
    const fonts = new Set();
    document.querySelectorAll("h1, h2, p, a, button").forEach((el) => {
      const ff = getComputedStyle(el).fontFamily.split(",")[0].trim().replace(/['"]/g, "");
      if (ff) fonts.add(ff);
    });
    const aiFonts = ["Inter", "Poppins", "Montserrat", "Roboto", "DM Sans", "Plus Jakarta Sans", "Space Grotesk"];
    const usedAiFonts = aiFonts.filter((f) => [...fonts].some((cf) => cf.toLowerCase() === f.toLowerCase()));
    if (usedAiFonts.length >= 1 && fonts.size <= 2) {
      addSignal("design", "Default AI font", `Using ${usedAiFonts.join(", ")}`, 1);
    }

    // Glassmorphism header (+2)
    const header = document.querySelector("header, nav, [class*='navbar'], [class*='Navbar']");
    if (header) {
      const hs = getComputedStyle(header);
      if (hs.backdropFilter && hs.backdropFilter !== "none" && /rgba\(.+,\s*0\.[0-8]\)/.test(hs.backgroundColor)) {
        addSignal("design", "Glassmorphism header", "Semi-transparent blur header — AI design default", 2);
      }
    }

    // 3-tier pricing (+2)
    const pricing = document.querySelector('[class*="pricing"], [class*="Pricing"], [id*="pricing"]');
    if (pricing) {
      const tiers = pricing.querySelectorAll('[class*="card"], [class*="Card"], [class*="tier"], [class*="plan"]');
      if (tiers.length === 3 && /most\s*popular|recommended|best\s*value/i.test(pricing.innerText)) {
        addSignal("design", "3-tier pricing template", '3 pricing cards with "Most Popular" badge', 2);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 5: SECURITY & QUALITY (cap: 10)
  // ═══════════════════════════════════════════════════════════════════════

  function checkSecurity() {
    // Exposed API keys are detected in checkSourceCode() and scored under "security"

    // Missing alt text (+3)
    const images = document.querySelectorAll("img");
    let missingAlt = 0;
    images.forEach((img) => {
      const alt = img.getAttribute("alt");
      if (!alt || alt === "" || alt === "image" || alt === "photo" || alt === "icon") missingAlt++;
    });
    if (images.length > 0 && missingAlt / images.length > 0.5) {
      addSignal("security", "Missing alt text", `${missingAlt}/${images.length} images lacking proper alt text`, 3);
    }

    // Inaccessible buttons (+2)
    let emptyBtns = 0;
    document.querySelectorAll("button").forEach((btn) => {
      if (!btn.textContent.trim() && !btn.getAttribute("aria-label") && !btn.getAttribute("title")) emptyBtns++;
    });
    if (emptyBtns > 2) {
      addSignal("security", "Inaccessible buttons", `${emptyBtns} buttons without labels`, 2);
    }

    // Missing form labels (+2)
    const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=submit]), textarea, select");
    let unlabeled = 0;
    inputs.forEach((input) => {
      const id = input.getAttribute("id");
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAria = input.getAttribute("aria-label") || input.getAttribute("aria-labelledby");
      const wrappedInLabel = input.closest("label");
      if (!hasLabel && !hasAria && !wrappedInLabel) unlabeled++;
    });
    if (unlabeled >= 3) {
      addSignal("security", "Missing form labels", `${unlabeled} inputs without labels`, 2);
    }

    // React error overlay / unhandled errors (+3)
    const html = document.documentElement.innerHTML;
    if (html.includes("react-error-overlay") || html.includes("Unhandled Runtime Error")) {
      addSignal("security", "Error overlay in production", "Development error tools visible to users", 3);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 6: INFRASTRUCTURE & DEPLOYMENT (cap: 10)
  // ═══════════════════════════════════════════════════════════════════════

  function checkInfra() {
    const hostname = window.location.hostname;
    const html = document.documentElement.innerHTML;
    const scriptSrcs = getScriptSrcs();

    // Free-tier subdomain (+4)
    const freeTierDomains = [
      { pattern: /\.vercel\.app$/, name: "Vercel", setFlag: true },
      { pattern: /\.netlify\.app$/, name: "Netlify" },
      { pattern: /\.replit\.app$|\.repl\.co$/, name: "Replit" },
      { pattern: /\.up\.railway\.app$/, name: "Railway" },
      { pattern: /\.fly\.dev$/, name: "Fly.io" },
      { pattern: /\.pages\.dev$/, name: "Cloudflare Pages" },
      { pattern: /\.onrender\.com$/, name: "Render" },
      { pattern: /\.lovable\.app$/, name: "Lovable" },
      { pattern: /\.gptengineer\.run$/, name: "GPT Engineer" },
      { pattern: /\.v0\.dev$/, name: "v0.dev" },
      { pattern: /\.stackblitz\.io$/, name: "StackBlitz" },
      { pattern: /\.github\.io$/, name: "GitHub Pages" },
      { pattern: /\.web\.app$/, name: "Firebase Hosting" },
    ];

    let onFreeTier = false;
    for (const { pattern, name, setFlag } of freeTierDomains) {
      if (pattern.test(hostname)) {
        onFreeTier = true;
        if (setFlag || name === "Vercel") flagVercel = true;
        addSignal("infra", `Free-tier: ${name}`, `Using ${name} subdomain — no custom domain`, 4);
        break;
      }
    }

    // Vercel with custom domain (+1 — low signal but still noted)
    if (!onFreeTier) {
      if (html.includes("__NEXT_DATA__") || html.includes("_vercel/")) {
        flagVercel = true;
        addSignal("infra", "Vercel hosting (custom domain)", "Vercel-hosted with custom domain", 1);
      }
    }

    // Vercel Analytics / Speed Insights (+2)
    if (
      scriptSrcs.some((s) => s.includes("vercel-analytics") || s.includes("vitals.vercel-insights") || s.includes("@vercel/speed-insights") || s.includes("@vercel/analytics")) ||
      html.includes("vercel-analytics") || html.includes("_vercel/speed-insights")
    ) {
      addSignal("infra", "Vercel Analytics", "Auto-included Vercel analytics — rarely removed by vibe coders", 2);
    }

    // Missing OG image (+1)
    if (!document.querySelector('meta[property="og:image"]')) {
      addSignal("infra", "No OG image", "No social sharing image configured", 1);
    }

    // Missing OG tags (+1)
    if (!document.querySelector('meta[property="og:title"]') && !document.querySelector('meta[property="og:description"]')) {
      addSignal("infra", "No Open Graph tags", "No social sharing metadata", 1);
    }

    // No favicon (+2)
    if (!document.querySelector('link[rel*="icon"]')) {
      addSignal("infra", "No favicon", "No custom favicon set", 2);
    }

    // Default framework favicon (+2)
    const favicon = document.querySelector('link[rel*="icon"]');
    if (favicon) {
      const href = favicon.getAttribute("href") || "";
      if (href.includes("vercel.svg") || href.includes("favicon.ico") && html.includes("__NEXT_DATA__")) {
        addSignal("infra", "Default framework favicon", "Using framework default favicon", 2);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 7: RUNTIME & BEHAVIORAL (cap: 5)
  // ═══════════════════════════════════════════════════════════════════════

  function checkRuntime() {
    // No lazy loading (+2)
    const images = document.querySelectorAll("img");
    let eagerCount = 0;
    images.forEach((img) => {
      if (!img.getAttribute("loading") && !img.closest("picture")) eagerCount++;
    });
    if (images.length >= 5 && eagerCount / images.length > 0.8) {
      addSignal("runtime", "No lazy loading", `${eagerCount}/${images.length} images loaded eagerly`, 2);
    }

    // Large unoptimized images (+2)
    let unoptimized = 0;
    images.forEach((img) => {
      if (!img.getAttribute("srcset") && !img.closest("picture") && img.naturalWidth > 100) {
        unoptimized++;
      }
    });
    if (unoptimized >= 3) {
      addSignal("runtime", "Unoptimized images", `${unoptimized} images without srcset or picture element`, 2);
    }

    // Dead links (+1)
    const deadLinks = document.querySelectorAll('a[href="#"], a[href=""], a[href="javascript:void(0)"]');
    if (deadLinks.length > 5) {
      addSignal("runtime", "Dead links", `${deadLinks.length} non-functional links`, 1);
    }

    // Broken social links (+2)
    const socialPattern = /(?:twitter|x|facebook|instagram|linkedin|youtube|tiktok|github|discord)\.com/i;
    let brokenSocial = 0;
    document.querySelectorAll("a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (socialPattern.test(href) || socialPattern.test(link.className)) {
        if (/^https?:\/\/(?:www\.)?(?:twitter|x|facebook|instagram|linkedin|youtube|tiktok|github|discord)\.com\/?$/i.test(href) || href === "#") {
          brokenSocial++;
        }
      }
    });
    if (brokenSocial >= 2) {
      addSignal("runtime", "Broken social links", `${brokenSocial} social links pointing to root domains`, 2);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NEGATIVE SIGNALS (Score Reducers)
  // ═══════════════════════════════════════════════════════════════════════

  function checkNegativeSignals() {
    const hostname = window.location.hostname;
    const html = document.documentElement.innerHTML;
    const root = getComputedStyle(document.documentElement);
    const scriptSrcs = getScriptSrcs();

    // Custom domain (-2)
    const isFreeTier = /\.(vercel|netlify|replit|railway|fly|pages|onrender|lovable|gptengineer|v0|stackblitz|github|web)\.(?:app|dev|co|io|com|run)$/i.test(hostname);
    if (!isFreeTier && hostname.includes(".")) {
      addNegative("Custom domain", "Professional custom domain configured", 2);
    }

    // Custom design system (-5) — non-default shadcn theme
    const bg = root.getPropertyValue("--background").trim();
    const primary = root.getPropertyValue("--primary").trim();
    if (bg && primary) {
      // If shadcn vars exist but DON'T match defaults, it's been customized
      const isDefaultBg = bg.includes("0 0% 100%") || bg.includes("0, 0%, 100%") || bg.includes("222.2 84%");
      if (!isDefaultBg && bg !== "") {
        addNegative("Custom design system", "Customized theme tokens — not default AI output", 5);
      }
    }

    // Proper SEO (-3)
    const hasCanonical = !!document.querySelector('link[rel="canonical"]');
    const hasStructuredData = !!document.querySelector('script[type="application/ld+json"]');
    const hasRobotsMeta = !!document.querySelector('meta[name="robots"]');
    if (hasCanonical && hasStructuredData && hasRobotsMeta) {
      addNegative("Advanced SEO setup", "Canonical URL + structured data + robots meta", 3);
    }

    // Internationalization (-3)
    const hasI18n = !!document.querySelector('link[hreflang]') ||
      html.includes("i18next") || html.includes("next-intl") || html.includes("react-i18next");
    if (hasI18n) {
      addNegative("Internationalization", "Multi-language support detected", 3);
    }

    // Error reporting service (-3)
    const errorServices = ["sentry", "datadog", "logrocket", "bugsnag", "newrelic", "rollbar"];
    const allScripts = scriptSrcs.join(" ").toLowerCase() + " " + html.toLowerCase();
    for (const svc of errorServices) {
      if (allScripts.includes(svc)) {
        addNegative("Error reporting", `${svc} error monitoring detected`, 3);
        break;
      }
    }

    // Minified bundles (-5)
    // Heuristic: check if external script content appears minified
    const externalScripts = document.querySelectorAll("script[src]");
    if (externalScripts.length > 0) {
      // Check if any script src contains chunk hashes (sign of proper build)
      const hasChunks = scriptSrcs.some((s) => /\.[a-f0-9]{8,}\.js/.test(s) || /chunk-[a-f0-9]+/.test(s));
      if (hasChunks) {
        addNegative("Minified bundles", "Production build with hashed chunks", 5);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COMPOSITE SCORING ALGORITHM
  // ═══════════════════════════════════════════════════════════════════════

  function computeScore() {
    // Step 1: Aggregate by category with caps
    let rawScore = 0;
    const categoryScores = {};

    for (const [cat, cap] of Object.entries(CATEGORY_CAPS)) {
      const catSignals = signals.filter((s) => s.category === cat);
      const catSum = catSignals.reduce((sum, s) => sum + s.weight, 0);
      const capped = Math.min(catSum, cap);
      categoryScores[cat] = { raw: catSum, capped, cap };
      rawScore += capped;
    }

    // Step 2: Stack multiplier (React/Next + Tailwind/shadcn + Vercel = 1.15x)
    let multiplierApplied = false;
    if (flagReactNext && flagTailwindShadcn && flagVercel) {
      rawScore = Math.min(100, Math.round(rawScore * 1.15));
      multiplierApplied = true;
    }

    // Step 3: Negative signals
    let totalReduction = 0;
    for (const reducer of negativeSignals) {
      totalReduction += reducer.points;
    }
    const finalScore = Math.max(0, Math.min(100, rawScore - totalReduction));

    return {
      vibeScore: finalScore,
      rawScore,
      totalReduction,
      multiplierApplied,
      categoryScores,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RUN ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  function runAnalysis() {
    const checks = [
      checkFrameworks, checkCSSLibraries, checkBaaS, checkAIBuilderMeta,
      checkSourceCode, checkContent, checkDesignPatterns, checkSecurity,
      checkInfra, checkRuntime, checkNegativeSignals,
    ];

    // Run each check independently — one failing won't block the rest
    for (const check of checks) {
      try {
        check();
      } catch (e) {
        // Silently continue — don't let one check kill the scan
      }
    }

    // Compute composite score
    const scoring = computeScore();

    // Collect internal links for deep scan
    const internalLinks = collectInternalLinks();

    const result = {
      url: window.location.href,
      hostname: window.location.hostname,
      signals,
      negativeSignals,
      vibeScore: scoring.vibeScore,
      rawScore: scoring.rawScore,
      totalReduction: scoring.totalReduction,
      multiplierApplied: scoring.multiplierApplied,
      categoryScores: scoring.categoryScores,
      totalSignals: signals.length,
      timestamp: Date.now(),
      internalLinks,
    };

    chrome.runtime.sendMessage({ type: "VIBE_RESULT", data: result });
    return result;
  }

  // ── Internal Link Collection (for Deep Scan) ─────────────

  function collectInternalLinks() {
    const hostname = window.location.hostname;
    const currentPath = window.location.pathname;
    const seen = new Set();
    seen.add(currentPath);

    const links = [];
    const anchors = document.querySelectorAll("a[href]");

    for (const a of anchors) {
      try {
        const url = new URL(a.href, window.location.origin);
        // Same hostname, not an anchor-only link, not current page
        if (
          url.hostname === hostname &&
          url.pathname !== currentPath &&
          !seen.has(url.pathname) &&
          !url.hash.length &&
          url.protocol.startsWith("http")
        ) {
          seen.add(url.pathname);
          links.push(url.href);
          if (links.length >= 20) break;
        }
      } catch (e) {
        // Skip malformed URLs
      }
    }

    return links;
  }

  setTimeout(runAnalysis, 500);
})();
