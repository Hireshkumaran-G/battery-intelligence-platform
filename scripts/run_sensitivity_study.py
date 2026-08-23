import os
import shutil
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy.stats import pearsonr

# Set clean scientific publication style
plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['DejaVu Sans', 'Arial', 'Helvetica'],
    'font.size': 10.5,
    'axes.labelsize': 11.5,
    'axes.titlesize': 12.5,
    'axes.titleweight': 'bold',
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 8.5,
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
DATA_DIR = os.path.join(BIP_DIR, 'classification_artifacts')
DOCS_IMAGE_DIR = os.path.join(BIP_DIR, 'docs', 'image')
MASTER_CSV = os.path.join(DATA_DIR, 'master_chemistry_dataset.csv')

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

print(f"Loading master dataset from {MASTER_CSV}...")
if not os.path.exists(MASTER_CSV):
    raise FileNotFoundError(f"Master dataset CSV not found at {MASTER_CSV}")

df = pd.read_csv(MASTER_CSV)
chemistries = ['LFP', 'NMC', 'LCO']

results = []

for chem in chemistries:
    df_chem = df[df['chemistry'] == chem].dropna(subset=['capacity_ah'])
    for order in range(1, 7):
        r_raw, p_raw = pearsonr(df_chem[f'ripple_rms_deg{order}'], df_chem['capacity_ah'])
        r_norm, p_norm = pearsonr(df_chem[f'ripple_norm_deg{order}'], df_chem['capacity_ah'])
        mean_snr = df_chem[f'snr_deg{order}'].mean()
        
        results.append({
            'chemistry': chem,
            'poly_order': order,
            'correlation_raw': r_raw,
            'correlation_norm': r_norm,
            'p_value_raw': p_raw,
            'p_value_norm': p_norm,
            'mean_snr_dB': mean_snr
        })

df_results.to_csv(results_csv_path, index=False)
df_results.to_csv(os.path.join(LOCAL_DIR, 'sensitivity_study_results.csv'), index=False)

# Create a clean, multi-panel grouped bar figure (3 panels: LFP, NMC, LCO)
fig, axes = plt.subplots(1, 3, figsize=(15, 5.2), sharey=True)

chem_colors = {
    'LFP': {'raw': '#81C784', 'norm': '#2E7D32', 'title': 'LFP (Severson)'},
    'NMC': {'raw': '#F48FB1', 'norm': '#C2185B', 'title': 'NMC (Oxford)'},
    'LCO': {'raw': '#90CAF9', 'norm': '#1565C0', 'title': 'LCO (NASA Ames)'}
}

x = np.arange(1, 7)  # poly orders 1 to 6
width = 0.35

for idx, chem in enumerate(chemistries):
    ax = axes[idx]
    df_c = df_results[df_results['chemistry'] == chem].sort_values('poly_order')
    
    raw_corrs = df_c['correlation_raw'].values
    norm_corrs = df_c['correlation_norm'].values
    
    # Highlight optimal Order (Degree 2)
    ax.axvspan(1.5, 2.5, color='#F1C40F', alpha=0.18, label='Optimal Order (d=2)')
    
    rects1 = ax.bar(x - width/2, raw_corrs, width, label='Raw Ripple RMS', 
                    color=chem_colors[chem]['raw'], edgecolor='#2C3E50', linewidth=0.8, alpha=0.9)
    rects2 = ax.bar(x + width/2, norm_corrs, width, label='Normalized Ripple ($R_{norm}$)', 
                    color=chem_colors[chem]['norm'], edgecolor='#2C3E50', linewidth=0.8, alpha=0.9)
    
    ax.axhline(0, color='#34495E', linestyle='-', linewidth=1.1)
    ax.set_title(f"{chem_colors[chem]['title']}", pad=10)
    ax.set_xlabel('Polynomial Detrending Degree ($d$)', fontsize=11)
    ax.set_xticks(x)
    ax.set_xticklabels([f'd={i}' for i in x])
    ax.set_ylim(-1.42, 1.22)
    ax.grid(True, linestyle='--', alpha=0.4, axis='y')
    
    if idx == 0:
        ax.set_ylabel('Pearson Correlation Coefficient ($r$)', fontsize=11.5)
    
    # Independent per-panel legend using that panel's specific chemistry colors placed at bottom left
    ax.legend(loc='lower left', frameon=True, facecolor='white', framealpha=0.92, edgecolor='#BDC3C7')

plt.suptitle('Polynomial Detrending Sensitivity Study (Orders 1–6) across Battery Chemistries', 
             fontsize=13.5, fontweight='bold', y=0.98)

plt.tight_layout()

plot_paths = [
    os.path.join(DATA_DIR, 'sensitivity_study.png'),
    os.path.join(DOCS_IMAGE_DIR, 'sensitivity_study.png')
]

for p in plot_paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    plt.savefig(p, dpi=300, bbox_inches='tight')
    print(f"Saved bar graph sensitivity plot with per-panel bottom-left legends to: {p}")
    try:
        shutil.copy2(p, os.path.join(LOCAL_DIR, 'sensitivity_study.png'))
    except Exception:
        pass
