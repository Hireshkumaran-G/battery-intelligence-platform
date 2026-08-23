"""
split_verification_figures.py
------------------------------
Generates clean, single-cell representative verification figures for:
- LFP (Severson Cell 7)
- NMC (Oxford Cell 1)
- LCO (NASA Ames Cell B0005)

Saves these individual representative plots to `bip/docs/image/` while keeping 
all original composite multi-grid figures intact for full reference.
"""
import os
import shutil
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

# Clean publication style
plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['DejaVu Sans', 'Arial', 'Helvetica'],
    'font.size': 11,
    'axes.labelsize': 12,
    'axes.titlesize': 13,
    'axes.titleweight': 'bold',
    'xtick.labelsize': 10.5,
    'ytick.labelsize': 10.5,
    'legend.fontsize': 10.5,
    'figure.titlesize': 14,
    'figure.titleweight': 'bold',
    'axes.edgecolor': '#2C3E50',
    'axes.linewidth': 1.1,
    'grid.color': '#BDC3C7',
    'grid.linestyle': '--',
    'grid.alpha': 0.45,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight'
})

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
ART_DIR = os.path.join(BIP_DIR, 'classification_artifacts')
DOCS_IMG = os.path.join(BIP_DIR, 'docs', 'image')

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

df_master = pd.read_csv(os.path.join(ART_DIR, 'master_chemistry_dataset.csv'))

# ==============================================================================
# 1. LFP Representative Cell Verification Plot (Cell 7 - Severson)
# ==============================================================================
print("\n[Generating LFP Representative Verification Plot] ...")
sub_lfp = df_master[df_master['cell_id'] == 'LFP_Cell_7'].sort_values('cycle_index')

fig, ax = plt.subplots(figsize=(7, 5))
sc = ax.scatter(sub_lfp['ripple_norm_deg2'], sub_lfp['capacity_ah'], c=sub_lfp['cycle_index'], 
                cmap='viridis', alpha=0.85, s=25, label='Cycle Observations')
cbar = plt.colorbar(sc, ax=ax)
cbar.set_label('Cycle Index', fontsize=11)

# Fit linear regression
slope, intercept = np.polyfit(sub_lfp['ripple_norm_deg2'], sub_lfp['capacity_ah'], 1)
x_vals = np.linspace(sub_lfp['ripple_norm_deg2'].min(), sub_lfp['ripple_norm_deg2'].max(), 100)
y_vals = slope * x_vals + intercept
r_val = sub_lfp['ripple_norm_deg2'].corr(sub_lfp['capacity_ah'])

ax.plot(x_vals, y_vals, color='#E74C3C', linestyle='--', linewidth=2.2, label=f'Linear Fit ($r = {r_val:+.3f}$)')

ax.set_title('LFP Chemistry Verification: Representative Cell 7 (Severson)', pad=12)
ax.set_xlabel('First-Cycle Normalized Ripple RMS (Degree 2)', fontsize=12)
ax.set_ylabel('Discharge Capacity (Ah)', fontsize=12)
ax.grid(True)
ax.legend(frameon=True, facecolor='white', loc='upper right')

lfp_rep_path = os.path.join(DOCS_IMG, 'lfp_representative_verification.png')
plt.savefig(lfp_rep_path)
shutil.copy2(lfp_rep_path, os.path.join(LOCAL_DIR, 'lfp_representative_verification.png'))
plt.close()

# ==============================================================================
# 2. NMC Representative Cell Verification Plot (Cell 1 - Oxford)
# ==============================================================================
print("[Generating NMC Representative Verification Plot] ...")
sub_nmc = df_master[df_master['cell_id'] == 'NMC_Cell_1'].sort_values('cycle_index')

fig, ax = plt.subplots(figsize=(7, 5))
sc = ax.scatter(sub_nmc['ripple_norm_deg2'], sub_nmc['capacity_ah'], c=sub_nmc['cycle_index'], 
                cmap='plasma', alpha=0.85, s=30, label='Cycle Observations')
cbar = plt.colorbar(sc, ax=ax)
cbar.set_label('Cycle Index', fontsize=11)

# Fit linear regression
slope, intercept = np.polyfit(sub_nmc['ripple_norm_deg2'], sub_nmc['capacity_ah'], 1)
x_vals = np.linspace(sub_nmc['ripple_norm_deg2'].min(), sub_nmc['ripple_norm_deg2'].max(), 100)
y_vals = slope * x_vals + intercept
r_val = sub_nmc['ripple_norm_deg2'].corr(sub_nmc['capacity_ah'])

ax.plot(x_vals, y_vals, color='#27AE60', linestyle='--', linewidth=2.2, label=f'Linear Fit ($r = {r_val:+.3f}$)')

ax.set_title('NMC Chemistry Verification: Representative Cell 1 (Oxford)', pad=12)
ax.set_xlabel('First-Cycle Normalized Ripple RMS (Degree 2)', fontsize=12)
ax.set_ylabel('Discharge Capacity (Ah)', fontsize=12)
ax.grid(True)
ax.legend(frameon=True, facecolor='white', loc='lower left')

nmc_rep_path = os.path.join(DOCS_IMG, 'nmc_representative_verification.png')
plt.savefig(nmc_rep_path)
shutil.copy2(nmc_rep_path, os.path.join(LOCAL_DIR, 'nmc_representative_verification.png'))
plt.close()

# ==============================================================================
# 3. LCO Representative Cell Verification Plot (Cell B0005 - NASA Ames)
# ==============================================================================
print("[Generating LCO Representative Verification Plot] ...")
sub_lco = df_master[df_master['cell_id'] == 'LCO_B0005'].sort_values('cycle_index')

fig, ax = plt.subplots(figsize=(7, 5))
sc = ax.scatter(sub_lco['ripple_norm_deg2'], sub_lco['capacity_ah'], c=sub_lco['cycle_index'], 
                cmap='cividis', alpha=0.85, s=30, label='Cycle Observations')
cbar = plt.colorbar(sc, ax=ax)
cbar.set_label('Cycle Index', fontsize=11)

# Fit linear regression
slope, intercept = np.polyfit(sub_lco['ripple_norm_deg2'], sub_lco['capacity_ah'], 1)
x_vals = np.linspace(sub_lco['ripple_norm_deg2'].min(), sub_lco['ripple_norm_deg2'].max(), 100)
y_vals = slope * x_vals + intercept
r_val = sub_lco['ripple_norm_deg2'].corr(sub_lco['capacity_ah'])

ax.plot(x_vals, y_vals, color='#E74C3C', linestyle='--', linewidth=2.2, label=f'Linear Fit ($r = {r_val:+.3f}$)')

ax.set_title('LCO Chemistry Verification: Representative Cell B0005 (NASA Ames)', pad=12)
ax.set_xlabel('First-Cycle Normalized Ripple RMS (Degree 2)', fontsize=12)
ax.set_ylabel('Discharge Capacity (Ah)', fontsize=12)
ax.grid(True)
ax.legend(frameon=True, facecolor='white', loc='upper right')

lco_rep_path = os.path.join(DOCS_IMG, 'lco_representative_verification.png')
plt.savefig(lco_rep_path)
shutil.copy2(lco_rep_path, os.path.join(LOCAL_DIR, 'lco_representative_verification.png'))
plt.close()

print("\nRepresentative single-cell verification figures generated successfully!")
