# Original User Request

## Initial Request — 2026-09-13T12:57:58Z

Resolve page transition bottlenecks, eliminate application crash triggers (including React ErrorBoundary fallbacks), and resolve responsive layout defects across all devices in the AI Financial Consultant web platform.

Working directory: C:\Users\Legion 5\.gemini\antigravity\scratch\ai-financial-consultant
Integrity mode: development

## Requirements

### R1. Smooth & Reliable Page Transitions
Eliminate transition delays, rendering pauses, and unhandled runtime exceptions when navigating between wizard modules (Portal, Mandate & Cashflow, Risk Shield, Tax Optimization, Asset Allocation, Solvency) and their respective sub-steps. The application must transition between views under 100ms with zero unhandled React exceptions.

### R2. Crash Prevention & Defensive State Hydration
Ensure all client state stores, local persistence data, and reactive recalculations handle missing, partial, null, or corrupted data gracefully without crashing or triggering ErrorBoundary fallbacks. Provide graceful fallbacks with self-healing recovery actions if invalid state is detected.

### R3. Comprehensive Responsive Layout & Viewport Optimization
Eliminate horizontal overflow, content clipping, misaligned controls, and overcrowded UI elements across mobile (360px–480px), tablet (481px–1024px), and desktop viewports. All ledger tables, metrics grids, and interactive sliders must scale and wrap fluidly.

### R4. Production Build & Lint Hygiene
Ensure the entire application compiles cleanly without warnings, broken imports, missing dependencies, or syntax errors.

## Acceptance Criteria

### Performance & Stability
- [ ] No ErrorBoundary fallback or white screen is triggered across any wizard step or sub-step under normal navigation, rapid clicking, or initial page reload.
- [ ] Step transitions complete seamlessly without frame drops or blocking main thread execution.
- [ ] Store hydration from empty, default, or previously saved local storage profiles never throws runtime `TypeError` or `ReferenceError`.

### Viewport & Responsiveness
- [ ] Zero horizontal scrollbar/overflow on screen widths between 360px and 1440px.
- [ ] All action buttons, navigation tabs, and form input sliders are fully accessible and unobstructed on mobile viewports.
- [ ] Ledger tables, audit matrices, and card decks automatically adapt into readable single-column or wrapping layouts on mobile screens.

### Verification & Build
- [ ] `npm run build` in the `frontend` directory exits with code 0 and produces an optimized production bundle without errors.
- [ ] Automated verification script or headless test confirms error-free navigation across all primary routes (`welcome`, `profile`, `insurance`, `tax`, `invest`, `pension`).
