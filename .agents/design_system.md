# Rakshak UI Pro Max Design System Specification (Stitch MCP Compatible)

> **Document Type:** Stitch MCP Design Markdown (`upload_design_md` / `create_design_system`)  
> **System Name:** Rakshak Tactical Command Operations HUD  
> **Target Standard:** UI Pro Max • Bespoke Non-Template Command Center  
> **Domain:** Hyper-Local Flash Flood Early Warning & Mountain Hydrology (SIH26192)  
> **Compliance:** WCAG 2.1 Level AA / AAA • 100% Vector SVG Iconography  

---

## 1. Typography Hierarchy & Font Specifications

Rakshak rejects default browser typefaces and generic template frameworks, enforcing a strict 3-tier typographic architecture optimized for emergency disaster operations:

### Font Families & Roles
| Role | Primary Typeface | Fallback Stacks | Google Fonts Link | Personality & Intent |
| :--- | :--- | :--- | :--- | :--- |
| **Tactical Display / Masthead** | `Space Grotesk` | `-apple-system`, `sans-serif` | [Space Grotesk 500/600/700](https://fonts.google.com/specimen/Space+Grotesk) | Authoritative, geometric, high-tech, angular precision for ward headers and alert titles. |
| **Interface / Body / Controls** | `Outfit` | `system-ui`, `sans-serif` | [Outfit 400/500/600](https://fonts.google.com/specimen/Outfit) | Warm, humanist, hyper-crisp readability at compact scales, ideal for dense operational UI. |
| **Telemetry / Tabular Data** | `JetBrains Mono` / `Fira Code` | `ui-monospace`, `monospace` | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | Fixed-width tabular numerals (`tabular-nums`), zero-confusion glyphs (`0` vs `O`, `1` vs `l`), millisecond timers. |

### Type Scale & Leading
| Token | Font Size | Line Height | Tracking | Weight | Applied Classes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-2xl` | `2.25rem (36px)` | `1.15` | `-0.03em` | `700` | `font-display font-bold text-2xl tracking-tight` |
| `display-xl` | `1.50rem (24px)` | `1.20` | `-0.02em` | `700` | `font-display font-bold text-xl tracking-tight` |
| `heading-lg` | `1.125rem (18px)` | `1.30` | `-0.01em` | `600` | `font-display font-semibold text-lg` |
| `heading-md` | `0.875rem (14px)` | `1.35` | `0.00em` | `600` | `font-display font-medium text-sm` |
| `body-base` | `0.875rem (14px)` | `1.50` | `0.00em` | `400 / 500` | `font-sans text-sm leading-relaxed` |
| `body-sm` | `0.750rem (12px)` | `1.45` | `0.01em` | `400 / 500` | `font-sans text-xs` |
| `telemetry-base` | `0.875rem (14px)` | `1.40` | `0.00em` | `700` | `font-mono text-sm tabular-nums` |
| `telemetry-sm` | `0.750rem (12px)` | `1.35` | `0.02em` | `500` | `font-mono text-xs tabular-nums` |
| `caption-xs` | `0.625rem (10px)` | `1.20` | `0.08em` | `700` | `font-mono text-[10px] uppercase tracking-wider` |

---

## 2. Color Palette & Semantic Tokens

### Tactical Dark Surfaces (OLED Command Mode)
```css
--color-bg-base:     #090d16; /* Deepest subterranean chassis */
--color-bg-elevated: #161f2e; /* Primary panel chassis */
--color-bg-sunken:   #121722; /* Wells, data tables, telemetry charts */
--color-bg-overlay:  #1e293b; /* Modals and floating control popups */
--color-border:      #2d3744; /* Tactical subtle panel border */
--color-border-glow: #38bdf8; /* Cyber-cyan active conduit */
```

### High-Contrast Sunlight Mode (`Alt + C` Toggle)
```css
--sunlight-bg:       #000000; /* Pure black, 0 reflection in direct glare */
--sunlight-surface:  #0a0a0a; /* High contrast panel */
--sunlight-border:   #ffffff; /* 2px solid stark white */
--sunlight-text:     #ffffff; /* 100% white, WCAG AAA 21:1 contrast */
```

### Emergency Alert Severity Scales (Life-Safety Standards)
| Level | Hex | Muted Fill | Border Glow | CWC / NDMA Directive |
| :--- | :--- | :--- | :--- | :--- |
| **NORMAL** | `#10b981` | `rgba(16, 185, 129, 0.15)` | `0 0 10px rgba(16, 185, 129, 0.3)` | Stage nominal (< 40.0). Routine monitoring. |
| **ADVISORY** | `#f59e0b` | `rgba(245, 158, 11, 0.15)` | `0 0 10px rgba(245, 158, 11, 0.3)` | Antecedent saturation (40–60). EOC notified. |
| **WATCH** | `#ea580c` | `rgba(234, 88, 12, 0.20)` | `0 0 14px rgba(234, 88, 12, 0.4)` | Surge propagation (60–80). Pre-evacuation readiness. |
| **WARNING** | `#ef4444` | `rgba(239, 68, 68, 0.25)` | `0 0 18px rgba(239, 68, 68, 0.6)` | Imminent breach (> 80.0). CAP alert broadcast. |

---

## 3. Bespoke Elements (Eliminating Template Aesthetics)

### A. Dual-Axis Military HUD Corner Brackets (`.hud-bracket`)
- **Concept:** Every key telemetry panel (Map, KPI Bar, Ward Intel, Elevation Cross-Section, Hydrograph) is encased with tactical 2D corner brackets.
- **CSS Specification:**
  ```css
  .hud-bracket { position: relative; }
  .hud-bracket::before {
    content: ''; position: absolute; top: -1px; left: -1px;
    width: 8px; height: 8px;
    border-top: 2px solid #38bdf8; border-left: 2px solid #38bdf8;
    pointer-events: none; z-index: 10;
  }
  .hud-bracket::after {
    content: ''; position: absolute; bottom: -1px; right: -1px;
    width: 8px; height: 8px;
    border-bottom: 2px solid #38bdf8; border-right: 2px solid #38bdf8;
    pointer-events: none; z-index: 10;
  }
  ```

### B. Tactical Micro-Dot Grid Matrix (`.bg-tactical-grid`)
- **Concept:** Subtle radar coordinate matrix background evoking tactical military avionics.
- **CSS Specification:**
  ```css
  .bg-tactical-grid {
    background-image: radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.08) 1px, transparent 0);
    background-size: 24px 24px;
  }
  ```

### C. Circular Hydrodynamic Risk Dial (SVG Gauge)
- **Component:** [WardDetailPanel.tsx](file:///c:/Users/Prashant%20V/hillyregion1/frontend/src/components/WardDetailPanel.tsx)
- **Implementation:** Vector `<circle>` with dynamic `strokeDasharray={201}` and `strokeDashoffset` mapped to calculated risk index (0–100).
- **Aesthetic:** High-contrast background track with alert-colored glowing arc and centered tabular percentage.

### D. Physical GSI/CWC Rainfall-Duration Threshold Curve
- **Formula:** $I = 14.82 \cdot D^{-0.39}$
- **Visual:** Logarithmic threshold line plotting intensity against storm duration, with an animated pulsating coordinate operating point indicating immediate slope breach vs stable soil state.

### E. Live Dual Military Chronometer
- **Component:** [Header.tsx](file:///c:/Users/Prashant%20V/hillyregion1/frontend/src/components/Header.tsx)
- **Display:** Synchronized UTC (Zulu) and IST (Bravo) times with `tabular-nums` ensuring zero layout shifting.

### F. Multi-Agent Orchestration Performance Waterfall
- **Pipeline:** IngestionSentinel &rarr; HydrologyReasoner &rarr; DispatchCommander
- **Profiling:** Real-time millisecond latency breakdown, confidence ratings, and token allocation metrics.

---

## 4. Pre-Delivery Quality Checklist (`ui-ux-pro-max` & `ui-visual-validator`)

- [x] **Zero Emoji Icons:** 100% replaced with Lucide SVGs (`Map`, `Activity`, `Zap`, `CheckCircle2`, `Volume2`, etc.).
- [x] **Stable Hover States:** Transitions apply to `background-color`, `border-color`, `box-shadow` without layout-shifting transforms.
- [x] **Cursor Pointer:** All interactive cards, station markers, buttons, and switches have explicit `cursor-pointer`.
- [x] **Focus Rings:** Visible `focus-visible:ring-2 focus-visible:ring-cyan-400` on all tabbable controls for keyboard navigation.
- [x] **Touch Target Compliance:** Minimum `44x44px` on mobile tabs and primary action triggers (WCAG 2.5.5).
- [x] **Tabular Numerals:** All sensors, risk scores, and chronometers enforce `tabular-nums` to eliminate jitter.
- [x] **Dual Accessibility Modes:** High-Contrast Mode (`Alt + C`) and Multi-Tier Font Scaling (`Alt + T`).

---

## 5. Commusoft SaaS Design System Profile (Fleet & Field Ops)

> Modeled directly after Bagus Fikri's Commusoft Fleet Operations design language for modern enterprise field dispatch.

### Core Token Palette
```css
/* Commusoft Theme Tokens */
--commusoft-teal:         #064244; /* Signature Deep Forest Teal Masthead */
--commusoft-teal-light:   #0a5254; /* Active navigation pill & hover */
--commusoft-teal-hover:   #0e6264; /* Active button hover */
--commusoft-teal-dark:    #032b2c; /* Contrast borders and active states */
--commusoft-orange:       #ea580c; /* High-visibility brand emblem & emergency CTA */
--commusoft-amber:        #f59e0b; /* Advisory warning highlights */
--commusoft-mint:         #10b981; /* Hydrograph rainfall series & nominal states */
--commusoft-bg:           #f4f6f8; /* Crisp modern SaaS canvas */
--commusoft-surface:      #ffffff; /* White card chassis */
--commusoft-border:       #e2e8f0; /* Soft slate border */
--commusoft-text:         #0f172a; /* Slate 900 high contrast text */
```

### Signature Commusoft Components
1. **Masthead**: Deep Forest Teal (`#064244`) full-width bar with orange emblem ("F"), live IST chronometer pill, and rounded pill navigation tabs.
2. **Operations Advisory Banner**: Top peach callout (`bg-[#fff7ed] border-[#fed7aa] text-[#9a3412]`) with bold headline and orange CTA button.
3. **Floating Basin Telemetry Widget**: Pure white card floating over the satellite map at bottom-left, providing instant ward totals, advisory counts, critical breach counts, and risk indicator dots.
4. **Hydrograph Time-Series**: Commusoft mint green bars (`#10b981`) for antecedent rain, warm orange line (`#ea580c`) for risk trajectory, and deep teal line (`#064244`) for river stage.
5. **Card Architecture**: White surfaces (`bg-white`), generous `rounded-2xl` radii, soft borders (`border-slate-200/90`), and subtle drop shadows (`shadow-sm`).

