# Battery Intelligence Dashboard — Project Skill

## Mission

Build a modern, research-grade Battery Intelligence Platform dashboard for
battery degradation analysis, physics-motivated dynamic signatures, SOH/RUL
estimation, cross-chemistry analysis, explainability, and embedded deployment.

This is an engineering/scientific application, NOT a generic SaaS/admin
dashboard.

---

## 1. Project Context

The existing Python backend is the source of truth.

Important modules:

- `bip/physics.py` — physics processing, ripple decomposition, polynomial
  detrending, derivatives, SNR, electrochemical interpretation
- `bip/features.py` — deterministic feature engineering
- `bip/models.py` — intelligence models, metrics, explainability
- `bip/signal.py` — signal processing
- `bip/store.py` — dataset/artifact storage
- `bip/validation.py` — validation
- `bip/classification_artifacts/` — research outputs
- `stm32_export/` — embedded deployment artifacts
- `configs/` — project configuration
- `scripts/` — research/data-generation pipelines

Do not rewrite or unnecessarily modify the scientific backend merely to make
the dashboard easier to build.

---

## 2. Scientific Concepts

The dashboard should understand and visually communicate:

### Battery signals

- Voltage
- Current
- Temperature
- Time
- Cycle number
- Capacity
- SOH
- RUL where available

### Physics-motivated signatures

- Ripple component
- Polynomial detrending residual
- D1 ripple
- D2 ripple
- RMS ripple
- Peak ripple
- Peak-to-peak ripple
- SNR
- Dominant frequency
- FFT energy
- Spectral entropy
- dQ/dV
- dV/dt

### Chemistry

Support:

- LFP
- NMC
- LCO

Never imply that a feature behaves identically across chemistries unless
the backend/research data supports that conclusion.

Cross-chemistry behavior is a first-class analytical concept.

---

## 3. Scientific Integrity

NEVER fabricate scientific data.

If a value, prediction, confidence interval, RUL estimate, metric, or
measurement is not available from the backend:

- do not invent it
- do not use plausible placeholder numbers in the production UI
- clearly indicate unavailable data
- implement the backend calculation/API if appropriate

Example:

GOOD:
"RUL unavailable"

BAD:
"RUL: 412 cycles" when no RUL result exists.

Demo/mock data must be clearly isolated from production data.

---

## 4. Dashboard Information Architecture

Prefer this structure:

### Overview

- Dataset/system status
- SOH summary
- lifetime/RUL summary when available
- chemistry distribution
- model health
- important alerts/anomalies

### Cell Explorer

- Cell selector
- Chemistry
- Cycle timeline
- Capacity/SOH trajectory
- Voltage/current/temperature
- Ripple signature
- Selected-cycle analysis

### Physics

- Raw vs processed signals
- Trend vs ripple decomposition
- Polynomial residual
- D1/D2 signatures
- dQ/dV
- dV/dt
- SNR

### Features

- Feature overview
- Ripple features
- Statistical features
- Frequency-domain features
- Rolling features
- Feature importance

### Cross-Chemistry

- LFP/NMC/LCO comparison
- Feature transfer
- Within-chemistry performance
- Sign/reversal behavior
- Interaction analysis
- Sensitivity analysis

### Model Intelligence

- SOH prediction
- Lifetime classification
- Model metrics
- Confidence/uncertainty when available
- Feature importance
- SHAP/local explanations when available

### Edge Deployment

- Target MCU
- Model version
- Model size
- Flash usage
- Memory usage
- Inference time
- Exported C artifacts

---

## 5. Visual Design Direction

The visual language must feel like a modern 2026 scientific engineering
instrument.

Do NOT produce:

- generic Bootstrap dashboards
- old enterprise dashboards
- excessive rounded cards
- excessive gradients
- excessive glassmorphism
- giant meaningless KPI cards
- rainbow charts
- decorative charts with no analytical purpose
- "cyberpunk" styling
- fake AI visual effects
- excessive shadows
- dense tables as the default visualization

Prefer:

- dark-first scientific interface
- excellent typography
- restrained color system
- strong hierarchy
- subtle borders
- layered surfaces
- generous but efficient spacing
- analytical whitespace
- precise chart axes
- high-quality hover states
- clear selected states
- responsive layouts
- subtle motion only when useful

The interface should look closer to a modern engineering/scientific
instrument than a CRM dashboard.

---

## 6. Color Semantics

Colors must communicate meaning consistently.

Recommended semantic roles:

- neutral → baseline/system
- blue → voltage/electrical
- orange/amber → current
- red → thermal/warning
- cyan/teal → ripple/dynamic signatures
- green → healthy/positive state
- yellow/amber → caution
- red → degraded/critical
- purple → model/explainability where useful

Do not assign arbitrary colors to the same metric in different views.

Do not use color as the only mechanism for communicating state.

---

## 7. Charts

Charts are analytical instruments, not decoration.

Every chart should have:

- meaningful title
- units
- axis labels
- readable tick spacing
- appropriate domain
- useful tooltip
- clear legend when needed
- meaningful empty state

Use synchronized charts when comparing:

- voltage/current/temperature
- raw/processed/ripple
- degradation/features
- chemistry behavior

Avoid unnecessary pie/donut charts.

Prefer:

- line charts
- area charts where appropriate
- scatter plots
- heatmaps
- distributions
- feature-ranking plots
- correlation matrices
- degradation trajectories
- uncertainty bands

For scientific plots, preserve the physical meaning of the x/y axes.

Never distort axes solely to make a trend look stronger.

---

## 8. Interaction Design

The user should be able to move from:

Dataset
→ Cell
→ Cycle
→ Signal
→ Physics signature
→ Feature
→ Model prediction
→ Explanation

without losing context.

Use:

- persistent filters
- chemistry selector
- cell selector
- cycle selector
- date/range selectors where relevant
- synchronized crosshair
- hover inspection
- zoom/pan for long signals
- reset-view controls
- clear loading states
- clear empty states
- meaningful error states

Do not make the user navigate through unnecessary modal dialogs.

---

## 9. Responsive Design

Support:

- desktop
- laptop
- tablet

Prioritize desktop/laptop because this is an engineering analysis tool.

Do not simply shrink desktop cards on smaller screens.

Recompose layouts intelligently.

---

## 10. Frontend Architecture

Prefer a modern component-based frontend.

If a frontend does not already exist, use:

- React
- Vite
- TypeScript
- Tailwind CSS or another modern utility/component styling system
- a high-quality charting library suitable for scientific interactive plots

Keep components modular.

Suggested structure:

```text
dashboard/
  src/
    components/
    features/
      overview/
      cell-explorer/
      physics/
      features/
      cross-chemistry/
      models/
      edge-deployment/
    charts/
    lib/
    api/
    types/
    pages/

