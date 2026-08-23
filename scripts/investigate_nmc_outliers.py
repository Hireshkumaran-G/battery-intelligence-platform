"""
investigate_nmc_outliers.py
---------------------------
Diagnoses why NMC Cell 2 and Cell 5 show weak ripple-capacity correlations
while the other 6 NMC cells show r > -0.88.

Plots (per cell, 4-panel):
  1. Capacity vs. cycle number
  2. Temperature mean vs. cycle number
  3. Ripple RMS (deg 2) vs. cycle number
  4. Scatter: ripple_norm_deg2 vs. capacity_ah  (coloured by cycle)

Also prints cycle-by-cycle SNR stats for all 8 cells to reveal measurement
quality differences.
"""
import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy.stats import pearsonr

# Locate project root dynamically by searching upward for pyproject.toml
_curr = os.path.dirname(os.path.abspath(__file__))
while _curr != os.path.dirname(_curr):
    if os.path.exists(os.path.join(_curr, 'pyproject.toml')):
        PROJECT_ROOT = _curr
        break
    _curr = os.path.dirname(_curr)
else:
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # fallback

BIP_DIR = os.path.join(PROJECT_ROOT, 'bip')
MASTER_CSV = os.path.join(BIP_DIR, 'classification_artifacts', 'master_chemistry_dataset.csv')
DOCS_IMG   = os.path.join(BIP_DIR, 'docs', 'image')
ART_DIR    = os.path.join(BIP_DIR, 'classification_artifacts')
os.makedirs(DOCS_IMG, exist_ok=True)

print(f"Loading {MASTER_CSV} ...")
df = pd.read_csv(MASTER_CSV)
df_nmc = df[df['chemistry'] == 'NMC'].copy()

cells = sorted(df_nmc['cell_id'].unique())
print(f"NMC cells found: {cells}\n")

# ── Per-cell diagnostic summary ────────────────────────────────────────────────
print(f"{'cell':<20} {'n_cyc':>6} {'soh_min':>8} {'soh_max':>8} {'temp_mean':>10} "
      f"{'snr_deg2 mean':>14} {'snr_deg2 std':>13} {'r_norm2_cap':>13}")
print("-" * 100)

diag_rows = []
for cell_id in cells:
    dc = df_nmc[df_nmc['cell_id'] == cell_id].copy().reset_index(drop=True)
    cap  = dc['capacity_ah'].to_numpy(dtype=float)
    norm = dc['ripple_norm_deg2'].to_numpy(dtype=float)
    snr  = dc['snr_deg2'].to_numpy(dtype=float)
    temp = dc['temperature_mean'].to_numpy(dtype=float)

    mask = np.isfinite(norm) & np.isfinite(cap)
    r, p = pearsonr(norm[mask], cap[mask]) if mask.sum() > 4 else (np.nan, np.nan)

    print(f"{cell_id:<20} {len(dc):>6} {dc['soh'].min():>8.4f} {dc['soh'].max():>8.4f} "
          f"{np.nanmean(temp):>10.2f} {np.nanmean(snr):>14.2f} {np.nanstd(snr):>13.2f} "
          f"{r:>+13.4f}")

    diag_rows.append({'cell_id': cell_id, 'n_cycles': len(dc),
                      'soh_min': dc['soh'].min(), 'soh_max': dc['soh'].max(),
                      'temp_mean': np.nanmean(temp), 'snr_deg2_mean': np.nanmean(snr),
                      'snr_deg2_std': np.nanstd(snr), 'r_norm2_cap': r, 'p': p})

pd.DataFrame(diag_rows).to_csv(os.path.join(ART_DIR, 'nmc_outlier_summary.csv'), index=False)

# ── 4-panel diagnostic plot for all 8 cells ────────────────────────────────────
fig, axes = plt.subplots(len(cells), 4, figsize=(22, len(cells) * 3.2))

ORDER = 2
outliers = {'NMC_Cell_2', 'NMC_Cell_5'}

for row_idx, cell_id in enumerate(cells):
    dc = df_nmc[df_nmc['cell_id'] == cell_id].copy().sort_values('cycle_index').reset_index(drop=True)
    cycles = dc['cycle_index'].to_numpy()
    cap    = dc['capacity_ah'].to_numpy(dtype=float)
    norm   = dc['ripple_norm_deg2'].to_numpy(dtype=float)
    rms    = dc['ripple_rms_deg2'].to_numpy(dtype=float)
    snr    = dc['snr_deg2'].to_numpy(dtype=float)
    temp   = dc['temperature_mean'].to_numpy(dtype=float)
    mask   = np.isfinite(norm) & np.isfinite(cap)
    r, _   = pearsonr(norm[mask], cap[mask]) if mask.sum() > 4 else (np.nan, np.nan)

    color = '#d62728' if cell_id in outliers else '#1f77b4'
    label = cell_id.replace('NMC_', '')
    title_suffix = ' [OUTLIER]' if cell_id in outliers else ''

    ax0, ax1, ax2, ax3 = axes[row_idx]

    # Panel 1 — Capacity decay
    ax0.plot(cycles, cap, color=color, lw=1.5)
    ax0.set_ylabel('Capacity (Ah)', fontsize=8)
    ax0.set_title(f'{label}{title_suffix} — Capacity decay', fontsize=9, fontweight='bold')
    ax0.grid(True, linestyle='--', alpha=0.5)

    # Panel 2 — Temperature
    ax1.plot(cycles, temp, color='darkorange', lw=1.5)
    ax1.set_ylabel('Temp mean (°C)', fontsize=8)
    ax1.set_title(f'{label} — Temperature', fontsize=9, fontweight='bold')
    ax1.grid(True, linestyle='--', alpha=0.5)

    # Panel 3 — Ripple RMS & SNR
    ax2_twin = ax2.twinx()
    ax2.plot(cycles, rms, color=color, lw=1.5, label='RMS')
    ax2_twin.plot(cycles, snr, color='grey', lw=1, linestyle='--', label='SNR')
    ax2.set_ylabel('Ripple RMS (V)', fontsize=8)
    ax2_twin.set_ylabel('SNR (dB)', fontsize=8, color='grey')
    ax2.set_title(f'{label} — Ripple RMS (deg {ORDER}) & SNR', fontsize=9, fontweight='bold')
    ax2.grid(True, linestyle='--', alpha=0.5)

    # Panel 4 — Scatter norm vs capacity
    sc = ax3.scatter(norm, cap, c=cycles, cmap='plasma', s=15, alpha=0.8)
    ax3.set_xlabel('ripple_norm_deg2', fontsize=8)
    ax3.set_ylabel('Capacity (Ah)', fontsize=8)
    ax3.set_title(f'{label} — Scatter (r = {r:+.4f})', fontsize=9, fontweight='bold')
    ax3.grid(True, linestyle='--', alpha=0.5)
    plt.colorbar(sc, ax=ax3, label='Cycle')

plt.suptitle('NMC Cell Diagnostic: Outlier Investigation (Cell 2 & 5 in red)',
             fontsize=13, fontweight='bold', y=1.002)
plt.tight_layout()

out_img = os.path.join(DOCS_IMG, 'nmc_outlier_investigation.png')
plt.savefig(out_img, dpi=130, bbox_inches='tight')
out_img2 = os.path.join(ART_DIR, 'nmc_outlier_investigation.png')
plt.savefig(out_img2, dpi=130, bbox_inches='tight')
print(f"\nDiagnostic plot saved → {out_img}")

# Also save to LOCAL_DIR if available
LOCAL_DIR = os.environ.get('BIP_UI_DIR', '')
if not LOCAL_DIR:
    base_brain = '/home/hiresh/.gemini/antigravity/brain'
    if os.path.exists(base_brain):
        subdirs = [os.path.join(base_brain, d) for d in os.listdir(base_brain)]
        subdirs = [d for d in subdirs if os.path.isdir(d) and not d.endswith('.system_generated')]
        if subdirs:
            LOCAL_DIR = max(subdirs, key=os.path.getmtime)
if LOCAL_DIR and os.path.exists(LOCAL_DIR):
    try:
        import shutil
        shutil.copy2(out_img, os.path.join(LOCAL_DIR, 'nmc_outlier_investigation.png'))
        print(f"Copied outlier investigation plot to: {os.path.join(LOCAL_DIR, 'nmc_outlier_investigation.png')}")
    except Exception:
        pass

# ── Key observation printout ───────────────────────────────────────────────────
print("\n\n" + "="*70)
print("KEY OBSERVATIONS")
print("="*70)
for cell_id in cells:
    dc = df_nmc[df_nmc['cell_id'] == cell_id]
    norm = dc['ripple_norm_deg2'].to_numpy(dtype=float)
    cap  = dc['capacity_ah'].to_numpy(dtype=float)
    mask = np.isfinite(norm) & np.isfinite(cap)
    r, p = pearsonr(norm[mask], cap[mask]) if mask.sum() > 4 else (np.nan, np.nan)
    flag = ' ← OUTLIER' if cell_id in outliers else ''
    soh_range = f"{dc['soh'].min():.3f}–{dc['soh'].max():.3f}"
    print(f"  {cell_id:<20}  r={r:+.4f}  p={p:.1e}  SOH range={soh_range}  "
          f"n_cyc={len(dc)}  SNR_mean={dc['snr_deg2'].mean():.1f} dB{flag}")
