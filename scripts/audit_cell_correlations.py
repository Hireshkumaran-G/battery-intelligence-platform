"""
audit_cell_correlations.py
--------------------------
Read-only diagnostic script. Loads master_chemistry_dataset.csv and produces
a canonical per-cell, per-poly-order correlation table.

Two normalisation conventions are computed side-by-side so the discrepancy
between the verify_*.py scripts and the sensitivity study can be pinpointed:

  r_raw         : Pearson(ripple_rms_degN,  capacity_ah)
  r_norm_vmean  : Pearson(ripple_norm_degN, capacity_ah)   <- current master definition (rms / v_mean)
  r_norm_fc     : Pearson(rms / first_cycle_rms,           <- verify script definition
                          capacity_ah)

Outputs:
  classification_artifacts/cell_correlation_audit.csv
  docs/image/cell_correlation_audit_heatmap.png
"""
import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy.stats import pearsonr

# ── Paths ──────────────────────────────────────────────────────────────────────
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
OUT_CSV    = os.path.join(BIP_DIR, 'classification_artifacts', 'cell_correlation_audit.csv')
DOCS_IMG   = os.path.join(BIP_DIR, 'docs', 'image')
os.makedirs(DOCS_IMG, exist_ok=True)

print(f"Loading {MASTER_CSV} ...")
df = pd.read_csv(MASTER_CSV)
print(f"  Loaded {len(df):,} rows | chemistries: {sorted(df['chemistry'].unique())}")

POLY_ORDERS = list(range(1, 7))
records = []

for chem in sorted(df['chemistry'].unique()):
    df_c = df[df['chemistry'] == chem].copy()
    cells = sorted(df_c['cell_id'].unique())
    print(f"\n{'='*70}")
    print(f"Chemistry: {chem}  |  cells: {len(cells)}  |  total cycles: {len(df_c)}")
    print(f"{'='*70}")
    print(f"{'cell':<20} {'deg':>4} {'r_raw':>8} {'r_norm_vmean':>14} {'r_norm_fc':>11} {'p_norm_fc':>11} {'SNR_dB':>8} {'n_cyc':>6} {'soh_min':>8} {'soh_max':>8}")
    print(f"{'-'*100}")

    for cell_id in cells:
        df_cell = df_c[df_c['cell_id'] == cell_id].copy().reset_index(drop=True)
        if len(df_cell) < 5:
            continue

        cap = df_cell['capacity_ah'].to_numpy(dtype=float)
        soh = df_cell['soh'].to_numpy(dtype=float)

        for order in POLY_ORDERS:
            rms_col  = f'ripple_rms_deg{order}'
            norm_col = f'ripple_norm_deg{order}'
            snr_col  = f'snr_deg{order}'

            if rms_col not in df_cell.columns:
                continue

            rms  = df_cell[rms_col].to_numpy(dtype=float)
            norm = df_cell[norm_col].to_numpy(dtype=float)

            # First-cycle normalisation (verify-script convention)
            first_rms = rms[0] if rms[0] > 0 else np.nan
            norm_fc   = rms / first_rms if not np.isnan(first_rms) else np.full_like(rms, np.nan)

            mean_snr = df_cell[snr_col].mean()

            # Remove NaN / Inf rows before Pearson
            mask = np.isfinite(rms) & np.isfinite(norm) & np.isfinite(norm_fc) & np.isfinite(cap)
            if mask.sum() < 5:
                continue

            r_raw,  _       = pearsonr(rms[mask],     cap[mask])
            r_norm_vm, _    = pearsonr(norm[mask],     cap[mask])
            r_norm_fc, p_fc = pearsonr(norm_fc[mask],  cap[mask])

            n_cyc   = int(mask.sum())
            soh_min = float(np.nanmin(soh))
            soh_max = float(np.nanmax(soh))

            print(f"{cell_id:<20} {order:>4} {r_raw:>+8.4f} {r_norm_vm:>+14.4f} {r_norm_fc:>+11.4f} {p_fc:>11.2e} {mean_snr:>8.2f} {n_cyc:>6} {soh_min:>8.4f} {soh_max:>8.4f}")

            records.append({
                'chemistry':      chem,
                'cell_id':        cell_id,
                'poly_order':     order,
                'r_raw':          round(r_raw,     6),
                'r_norm_vmean':   round(r_norm_vm, 6),
                'r_norm_firstcyc':round(r_norm_fc, 6),
                'p_norm_firstcyc':round(p_fc,      6),
                'mean_snr_dB':    round(mean_snr,  4),
                'n_cycles':       n_cyc,
                'soh_min':        round(soh_min,   6),
                'soh_max':        round(soh_max,   6),
            })

df_audit = pd.DataFrame(records)
df_audit.to_csv(OUT_CSV, index=False)
print(f"\n\nAudit table saved → {OUT_CSV}")

# ── Per-chemistry aggregate (mean |r| across cells per degree, both norms) ────
print("\n\n" + "="*70)
print("AGGREGATE: Mean |r| across cells, by chemistry × poly order")
print("="*70)
print(f"{'chemistry':<10} {'deg':>4} {'|r_raw| mean':>14} {'|r_norm_vmean| mean':>20} {'|r_norm_fc| mean':>18}")
print(f"{'-'*68}")
for chem in sorted(df_audit['chemistry'].unique()):
    dc = df_audit[df_audit['chemistry'] == chem]
    for order in POLY_ORDERS:
        do = dc[dc['poly_order'] == order]
        if do.empty:
            continue
        mr_raw = do['r_raw'].abs().mean()
        mr_vm  = do['r_norm_vmean'].abs().mean()
        mr_fc  = do['r_norm_firstcyc'].abs().mean()
        print(f"{chem:<10} {order:>4} {mr_raw:>14.4f} {mr_vm:>20.4f} {mr_fc:>18.4f}")

# ── Heatmap: |r_norm_firstcyc| for degree-2 across all cells ─────────────────
df_deg2 = df_audit[df_audit['poly_order'] == 2].copy()
pivot = df_deg2.pivot_table(index='cell_id', columns='chemistry',
                             values='r_norm_firstcyc', aggfunc='mean')

fig, axes = plt.subplots(1, 3, figsize=(18, 7))
chemistries = ['LFP', 'NMC', 'LCO']
cmap = plt.cm.RdYlGn

for ax, chem in zip(axes, chemistries):
    dc  = df_audit[(df_audit['chemistry'] == chem)].copy()
    cells = sorted(dc['cell_id'].unique())
    orders = POLY_ORDERS

    # Build matrix: rows=cells, cols=poly orders, values=r_norm_firstcyc
    mat = np.full((len(cells), len(orders)), np.nan)
    for ri, cell in enumerate(cells):
        for ci, order in enumerate(orders):
            val = dc[(dc['cell_id'] == cell) & (dc['poly_order'] == order)]['r_norm_firstcyc']
            if not val.empty:
                mat[ri, ci] = val.values[0]

    im = ax.imshow(mat, vmin=-1, vmax=1, cmap=cmap, aspect='auto')
    ax.set_xticks(range(len(orders)))
    ax.set_xticklabels([f'Deg {o}' for o in orders], rotation=30, ha='right')
    ax.set_yticks(range(len(cells)))
    ax.set_yticklabels([c.replace(f'{chem}_', '') for c in cells], fontsize=8)
    ax.set_title(f'{chem} — r(norm_firstcyc, capacity)', fontweight='bold')
    ax.set_xlabel('Polynomial Order')

    # Annotate cells
    for ri in range(len(cells)):
        for ci in range(len(orders)):
            v = mat[ri, ci]
            if not np.isnan(v):
                ax.text(ci, ri, f'{v:+.2f}', ha='center', va='center', fontsize=7,
                        color='black' if abs(v) < 0.7 else 'white')

    plt.colorbar(im, ax=ax, label='Pearson r')

plt.suptitle('Cell-level Correlation Audit: r(first-cycle-normalised ripple RMS, capacity)\nAll cells × all poly orders',
             fontsize=12, fontweight='bold', y=1.01)
plt.tight_layout()

out_img = os.path.join(DOCS_IMG, 'cell_correlation_audit_heatmap.png')
plt.savefig(out_img, dpi=150, bbox_inches='tight')
print(f"\nHeatmap saved → {out_img}")
# Also save to classification_artifacts
out_img2 = os.path.join(BIP_DIR, 'classification_artifacts', 'cell_correlation_audit_heatmap.png')
plt.savefig(out_img2, dpi=150, bbox_inches='tight')
print(f"Heatmap also saved → {out_img2}")
