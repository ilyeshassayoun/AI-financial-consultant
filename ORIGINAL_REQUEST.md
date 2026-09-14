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

## 2026-09-14T10:51:55Z

Elevate the full-stack AI Financial Consultant to a world-class institutional fintech standard that decisively proves mid-to-senior engineering caliber in a junior portfolio, with continuous adversarial review by a Senior Tech Recruiter / Staff Hiring Manager agent at top firms (Goldman Sachs, Stripe, Datadog). Focus on advanced engineering disciplines that top-tier firms value and junior applicants almost universally ignore: historical crisis stress testing with Sequence-of-Returns Risk (SRR), real-time Server-Sent Events (SSE) AI streaming with bidirectional chart synchronization, an event-sourced temporal audit trail with time-travel scrubbing, and enterprise Prometheus/OpenTelemetry observability metrics.

Working directory: C:\Users\Legion 5\.gemini\antigravity\scratch\ai-financial-consultant
Integrity mode: development

## Requirements

### R1. Historical Regime Stress Testing & Sequence-of-Returns Risk (SRR)
Integrate an institutional stress-testing laboratory that replays historical macroeconomic shocks (2008 Global Financial Crisis, 2000 Dot-Com Crash, 1970s Stagflation Shock) against the user’s asset portfolio. Model Sequence-of-Returns Risk (SRR) during the fragile decumulation window (5 years pre/post retirement), quantifying portfolio survival probabilities and maximum drawdown durations.

### R2. Real-Time Streaming AI Advisory with Chart Synchronization (SSE)
Implement a Server-Sent Events (text/event-stream) streaming endpoint in FastAPI for the AI Wealth Concierge. As the AI streams German statutory advice (§ 32a EStG, SGB VI, DIN 77230), it dispatches structured tool-call event payloads that the React client consumes in real-time to highlight active chart nodes, trigger visual delta badges, and display interactive optimization patch cards without page reloads.

### R3. Event Sourcing & Temporal Time-Travel Profile Audit
Implement an immutable event log for household profile changes (ProfileEvent table with event types like IncomeAdjusted, ChildAdded, PropertyPurchased, GoalToggled). Provide an interactive "Time-Travel Career Scrub Bar" in the frontend allowing users to scrub backward and forward through career milestones, visualizing how tax bracket progression, net wealth velocity, and Rentenlücke evolve over time.

### R4. Cloud-Native Observability & Prometheus Metrics (/metrics)
Equip the backend with standard Prometheus metrics (/metrics) and OpenTelemetry span instrumentation. Expose latency histogram buckets (financial_analysis_duration_seconds), calculation throughput counters (simulations_total), database connection pool metrics (active/idle connections), and distributed trace IDs (X-Correlation-ID) across all request logs and client error boundaries.

### R5. Cryptographic Calculation Verification & Security Hardening
Generate a downloadable audit dossier stamped with a SHA-256 calculation checksum over inputs and statutory outputs. Enforce enterprise OWASP security headers (Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options: nosniff, X-Frame-Options: DENY), and provide RFC-compliant rate limiting headers (X-RateLimit-*, Retry-After).

### R6. Senior Tech Recruiter Quality Gate & Feedback Loop
An adversarial Senior Technical Recruiter / Staff Hiring Manager review agent continuously inspects all code commits, architectures, tests, and documentation, grading each component against top-firm hiring rubrics (code clarity, defensive edge cases, performance benchmarks, and resume-impact evidence).

## Acceptance Criteria

### Quantitative Stress Testing & SRR
- [ ] Endpoint /api/lab/stress-test executes historical crisis replay scenarios (2008 GFC, 2000 Dot-com, 1973 Stagflation) and returns recovery year horizons, maximum drawdown %, and safe withdrawal rates.
- [ ] Frontend renders an interactive "Stress Test & Fragility Lab" visualization displaying drawdown curves and decumulation survival probabilities.
- [ ] Automated tests in backend/tests/test_stress_testing.py verify mathematical reproducibility against benchmark asset returns.

### Real-Time Streaming AI & Client Sync
- [ ] /api/chat/stream streams tokens with chunked transfer encoding (text/event-stream).
- [ ] Stream yields structured function events (e.g. {"event": "highlight_metric", "target": "pension_gap"}) that reactively highlight corresponding UI elements in the client.
- [ ] Automated integration tests verify SSE protocol parsing and fallback if the stream disconnects.

### Event Sourcing & Temporal Scrubbing
- [ ] Every profile save records an immutable event entry with timestamp, user ID, delta payload, and version sequence number.
- [ ] Frontend features an interactive time slider that recalculates and previews historical states without mutating the active database head.
- [ ] Automated tests in backend/tests/test_event_sourcing.py confirm event replay faithfully reconstructs snapshot state.

### Prometheus Metrics & Tracing
- [ ] GET /metrics returns standard Prometheus formatted metric text exposing request counts, calculation durations, and error rates.
- [ ] Liveness (/api/health/live) and readiness (/api/health/ready) probes validate DB pool health in < 50ms.
- [ ] Distributed trace IDs (X-Correlation-ID) link client requests, server middleware logs, and ErrorBoundary diagnostics.

### Build & Recruiter Sign-Off
- [ ] 100% of backend tests pass (pytest passes with 0 failures).
- [ ] 100% of frontend tests pass (vitest run passes with 0 failures).
- [ ] Production build (npm run build) builds cleanly with zero errors.
- [ ] Senior Recruiter audit report provides positive sign-off on hiring defensibility.
