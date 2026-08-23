"""
investigate_sign_reversal.py
-----------------------------
Executes Experiments 1 & 2:
1. Signed r vs. Absolute |r| across polynomial orders (1-6) and chemistries.
2. Physics investigation of NMC sign reversal (+r) vs. LFP/LCO (-r):
   - Polynomial detrending residual dynamics across aging.
   - Voltage dynamic range (V_max - V_min) and slope (dV/dt) evolution.
   - OCV curve shape differences across chemistries.
"""
import os
import shutil
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

# Dynamic LOCAL_DIR for active conversation
LOCAL_DIR = os.environ.get('BIP_UI_DIR', '')
if not LOCAL_DIR:
    base_brain = '/home/hiresh/.gemini/antigravity/brain'
    if os.path.exists(base_brain):
        subdirs = [os.path.join(base_brain, d) for d in os.listdir(base_brain)]
        subdirs = [d for d in subdirs if os.path.isdir(d) and not d.endswith('.system_generated')]
        if subdirs:
            LOCAL_DIR = max(subdirs, key=os.path.getmtime)
if not LOCAL_DIR or not os.path.exists(LOCAL_DIR):
    import tempfile
    LOCAL_DIR = tempfile.gettempdir()

os.makedirs(DOCS_IMG, exist_ok=True)
os.makedirs(ART_DIR, exist_ok=True)

print(f"Loading {MASTER_CSV} ...")
df = pd.read_csv(MASTER_CSV)

CHEMISTRIES = ['LFP', 'NMC', 'LCO']
ORDERS = [1, 2, 3, 4, 5, 6]

# ==============================================================================
# EXPERIMENT 1: Signed r vs Absolute |r|
# ==============================================================================
print("\n" + "="*80)
print("EXPERIMENT 1: Signed r vs. Absolute |r| Analysis Across Polynomial Orders")
print("="*80)

exp1_records = []

for chem in CHEMISTRIES:
    df_c = df[df['chemistry'] == chem].copy()
    cells = sorted(df_c['cell_id'].unique())
    
    for deg in ORDERS:
        col = f'ripple_norm_deg{deg}' if f'ripple_norm_deg{deg}' in df_c.columns else f'ripple_rms_deg{deg}'
        if col not in df_c.columns:
            continue
            
        cell_signed_r = []
        cell_abs_r = []
        
        for cell_id in cells:
            dc = df_c[df_c['cell_id'] == cell_id]
            norm = dc[col].to_numpy(dtype=float)
            cap  = dc['capacity_ah'].to_numpy(dtype=float)
            mask = np.isfinite(norm) & np.isfinite(cap)
            if mask.sum() > 4:
                r, _ = pearsonr(norm[mask], cap[mask])
                if not np.isnan(r):
                    cell_signed_r.append(r)
                    cell_abs_r.append(abs(r))
                    
        mean_signed = float(np.mean(cell_signed_r)) if cell_signed_r else np.nan
        mean_abs    = float(np.mean(cell_abs_r)) if cell_abs_r else np.nan
        std_signed  = float(np.std(cell_signed_r)) if cell_signed_r else np.nan
        
        direction = 'Positive' if mean_signed > 0.1 else ('Negative' if mean_signed < -0.1 else 'Mixed/Weak')
        
        exp1_records.append({
            'chemistry': chem,
            'degree': deg,
            'mean_signed_r': round(mean_signed, 4),
            'std_signed_r': round(std_signed, 4),
            'mean_abs_r': round(mean_abs, 4),
            'dominant_direction': direction,
            'n_cells': len(cell_signed_r)
        })

df_exp1 = pd.DataFrame(exp1_records)
df_exp1.to_csv(os.path.join(ART_DIR, 'signed_vs_abs_correlation.csv'), index=False)
df_exp1.to_csv(os.path.join(LOCAL_DIR, 'signed_vs_abs_correlation.csv'), index=False)

print(df_exp1.to_string(index=False))

# Plot Exp 1: Signed vs Absolute Correlation Bar/Line Chart
fig, axes = plt.subplots(1, 3, figsize=(18, 5), sharey=True)

colors = {'LFP': '#2ca02c', 'NMC': '#ff7f0e', 'LCO': '#1f77b4'}

for ax, chem in zip(axes, CHEMISTRIES):
    sub = df_exp1[df_exp1['chemistry'] == chem]
    degs = sub['degree'].values
    s_r  = sub['mean_signed_r'].values
    a_r  = sub['mean_abs_r'].values
    
    ax.plot(degs, s_r, marker='o', lw=2.5, label='Signed r (Mean)', color=colors[chem])
    ax.plot(degs, a_r, marker='s', lw=2.0, linestyle='--', label='Absolute |r| (Mean)', color='purple')
    ax.axhline(0, color='grey', linestyle=':', alpha=0.7)
    ax.set_ylim(-1.05, 1.05)
    ax.set_xticks(degs)
    ax.set_xlabel('Polynomial Order (Degree)', fontsize=10)
    ax.set_title(f'{chem} — Signed vs Absolute Correlation', fontsize=11, fontweight='bold')
    ax.grid(True, linestyle='--', alpha=0.5)
    ax.legend(loc='best', fontsize=9)
    
    for x, y_s, y_a in zip(degs, s_r, a_r):
        ax.annotate(f'{y_s:+.2f}', (x, y_s), textcoords="offset points", xytext=(0,7), ha='center', fontsize=8)

plt.suptitle('Experiment 1: Signed r vs. Absolute |r| Across Detrending Degrees\n(LFP & LCO are negative; NMC is strongly positive at degree 2)',
             fontsize=12, fontweight='bold')
plt.tight_layout()

local_exp1_img = os.path.join(LOCAL_DIR, 'signed_vs_absolute_correlation.png')
plt.savefig(local_exp1_img, dpi=150, bbox_inches='tight')
for d in [DOCS_IMG, ART_DIR]:
    shutil.copy2(local_exp1_img, os.path.join(d, 'signed_vs_absolute_correlation.png'))
print(f"\nExp 1 plot saved → {local_exp1_img}")

# ==============================================================================
# EXPERIMENT 2: NMC Sign Reversal Physics Investigation
# ==============================================================================
print("\n" + "="*80)
print("EXPERIMENT 2: NMC Sign Reversal Physics & Feature Analysis")
print("="*80)

# Compare key signal features across aging (Cycle 1 vs Mid vs End) for representative cells
exp2_records = []

for chem in CHEMISTRIES:
    df_c = df[df['chemistry'] == chem].copy()
    cells = sorted(df_c['cell_id'].unique())
    rep_cell = cells[0]  # First cell as representative
    
    dc = df_c[df_c['cell_id'] == rep_cell].sort_values('cycle_index').reset_index(drop=True)
    n = len(dc)
    early = dc.iloc[:max(1, int(n*0.1))]
    late  = dc.iloc[int(n*0.9):]
    
    v_mean_change = late['voltage_mean'].mean() - early['voltage_mean'].mean()
    v_std_change  = late['voltage_std'].mean() - early['voltage_std'].mean()
    v_kurt_change = late['voltage_kurtosis'].mean() - early['voltage_kurtosis'].mean()
    v_skew_change = late['voltage_skewness'].mean() - early['voltage_skewness'].mean()
    rms_deg2_change = late['ripple_rms_deg2'].mean() - early['ripple_rms_deg2'].mean()
    fft_energy_change = late['fft_energy'].mean() - early['fft_energy'].mean()
    
    exp2_records.append({
        'chemistry': chem,
        'cell_id': rep_cell,
        'early_soh': round(early['soh'].mean(), 4),
        'late_soh': round(late['soh'].mean(), 4),
        'delta_ripple_rms_deg2': round(rms_deg2_change, 6),
        'delta_voltage_mean': round(v_mean_change, 6),
        'delta_voltage_std': round(v_std_change, 6),
        'delta_voltage_kurtosis': round(v_kurt_change, 6),
        'delta_fft_energy': round(fft_energy_change, 6),
    })

df_exp2 = pd.DataFrame(exp2_records)
df_exp2.to_csv(os.path.join(ART_DIR, 'sign_reversal_physics_summary.csv'), index=False)
df_exp2.to_csv(os.path.join(LOCAL_DIR, 'sign_reversal_physics_summary.csv'), index=False)

print(df_exp2.to_string(index=False))

# 4-panel diagnostic plot comparing feature trends across aging for the 3 chemistries
fig2, axes2 = plt.subplots(2, 2, figsize=(14, 10))

# 1. Ripple RMS deg 2 vs SOH
ax = axes2[0, 0]
for chem in CHEMISTRIES:
    df_c = df[df['chemistry'] == chem]
    ax.scatter(df_c['soh'], df_c['ripple_rms_deg2'], alpha=0.4, label=chem, s=15, color=colors[chem])
ax.set_xlabel('State of Health (SOH)', fontsize=10)
ax.set_ylabel('Ripple RMS Deg 2 (V)', fontsize=10)
ax.set_title('Ripple RMS vs. SOH\n(NMC increases as SOH decreases; LFP/LCO decrease)', fontsize=11, fontweight='bold')
ax.grid(True, linestyle='--', alpha=0.5)
ax.legend()
ax.invert_xaxis()  # SOH degrades right to left

# 2. Voltage Kurtosis vs SOH
ax = axes2[0, 1]
for chem in CHEMISTRIES:
    df_c = df[df['chemistry'] == chem]
    ax.scatter(df_c['soh'], df_c['voltage_kurtosis'], alpha=0.4, label=chem, s=15, color=colors[chem])
ax.set_xlabel('State of Health (SOH)', fontsize=10)
ax.set_ylabel('Voltage Kurtosis', fontsize=10)
ax.set_title('Voltage Kurtosis vs. SOH\n(Strong universal monotonic trend across chemistries)', fontsize=11, fontweight='bold')
ax.grid(True, linestyle='--', alpha=0.5)
ax.legend()
ax.invert_xaxis()

# 3. Voltage Std (Dynamic Range) vs SOH
ax = axes2[1, 0]
for chem in CHEMISTRIES:
    df_c = df[df['chemistry'] == chem]
    ax.scatter(df_c['soh'], df_c['voltage_std'], alpha=0.4, label=chem, s=15, color=colors[chem])
ax.set_xlabel('State of Health (SOH)', fontsize=10)
ax.set_ylabel('Voltage Std (V)', fontsize=10)
ax.set_title('Voltage Std vs. SOH\n(Internal resistance growth widens NMC discharge curve variance)', fontsize=11, fontweight='bold')
ax.grid(True, linestyle='--', alpha=0.5)
ax.legend()
ax.invert_xaxis()

# 4. FFT Energy vs SOH
ax = axes2[1, 1]
for chem in CHEMISTRIES:
    df_c = df[df['chemistry'] == chem]
    ax.scatter(df_c['soh'], df_c['fft_energy'], alpha=0.4, label=chem, s=15, color=colors[chem])
ax.set_xlabel('State of Health (SOH)', fontsize=10)
ax.set_ylabel('FFT Energy', fontsize=10)
ax.set_title('FFT Dominant Energy vs. SOH\n(Monotonic spectral power change)', fontsize=11, fontweight='bold')
ax.grid(True, linestyle='--', alpha=0.5)
ax.legend()
ax.invert_xaxis()

plt.suptitle('Experiment 2: Physics Mechanisms Behind NMC Sign Reversal vs. LFP/LCO\nNMC sloped OCV curve causes impedance-driven ripple expansion, whereas LFP flat plateau suppresses residual variance',
             fontsize=12, fontweight='bold')
plt.tight_layout()

local_exp2_img = os.path.join(LOCAL_DIR, 'nmc_sign_reversal_physics.png')
plt.savefig(local_exp2_img, dpi=150, bbox_inches='tight')
for d in [DOCS_IMG, ART_DIR]:
    shutil.copy2(local_exp2_img, os.path.join(d, 'nmc_sign_reversal_physics.png'))
print(f"\nExp 2 plot saved → {local_exp2_img}")

print("\nExperiments 1 & 2 Execution Complete!")
