"""
generate_patent_paper_figures.py
--------------------------------
Generates modular, single-concept scientific & patent figures for:
- Indian Patent Office (IPO) Drawing & Journal Publication Compliance
- Single-concept modular plots for high legibility and focused presentation
"""
import os
import shutil
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

# Set Patent & Journal compliant clean publication style
plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['DejaVu Sans', 'Arial', 'Helvetica'],
    'font.size': 11,
    'axes.labelsize': 12,
    'axes.titlesize': 13,
    'axes.titleweight': 'bold',
    'xtick.labelsize': 11,
    'ytick.labelsize': 11,
    'legend.fontsize': 11,
    'figure.titlesize': 14,
    'figure.titleweight': 'bold',
    'axes.edgecolor': '#2C3E50',
    'axes.linewidth': 1.2,
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
os.makedirs(ART_DIR, exist_ok=True)

# Curated Scientific Palette
COLOR_MAP = {
    'LFP': '#2E7D32',  # Emerald Green
    'NMC': '#D81B60',  # Crimson Magenta
    'LCO': '#1565C0',  # Sapphire Blue
}

print(f"Loading master dataset from {os.path.join(ART_DIR, 'master_chemistry_dataset.csv')} ...")
df_master = pd.read_csv(os.path.join(ART_DIR, 'master_chemistry_dataset.csv'))

# ==============================================================================
# FIGURE 1: Dynamic Ripple RMS vs SOH (Sign Reversal Phenomenon)
# ==============================================================================
print("\n[Generating Patent Figure 1] Dynamic Ripple RMS vs. SOH (Sign Reversal) ...")
fig, ax = plt.subplots(figsize=(7, 5))

for chem in ['LFP', 'NMC', 'LCO']:
    sub = df_master[df_master['chemistry'] == chem]
    sns.regplot(data=sub, x='soh', y='ripple_rms_deg2', ax=ax, scatter_kws={'alpha':0.3, 's':15}, 
                line_kws={'linewidth': 2.5}, color=COLOR_MAP[chem], label=f'{chem} Chemistry')

ax.set_xlabel('State of Health (SOH)', fontsize=12)
ax.set_ylabel('Dynamic Ripple RMS Degree 2 (V)', fontsize=12)
ax.set_title('Dynamic Voltage Ripple RMS vs. SOH (Sign Reversal)', pad=12)
ax.invert_xaxis()
ax.legend(frameon=True, facecolor='white', framealpha=0.95, loc='upper left')
ax.grid(True)

fig1_path = os.path.join(DOCS_IMG, 'fig1_ripple_sign_reversal.png')
plt.savefig(fig1_path)
shutil.copy2(fig1_path, os.path.join(LOCAL_DIR, 'fig1_ripple_sign_reversal.png'))
plt.close()

# ==============================================================================
# FIGURE 2: Voltage Kurtosis vs SOH (Universal Degradation Signature)
# ==============================================================================
print("[Generating Patent Figure 2] Voltage Kurtosis vs. SOH (Universal Signature) ...")
fig, ax = plt.subplots(figsize=(7, 5))

for chem in ['LFP', 'NMC', 'LCO']:
    sub = df_master[df_master['chemistry'] == chem]
    sns.regplot(data=sub, x='soh', y='voltage_kurtosis', ax=ax, scatter_kws={'alpha':0.3, 's':15}, 
                line_kws={'linewidth': 2.5}, color=COLOR_MAP[chem], label=f'{chem} Chemistry')

ax.set_xlabel('State of Health (SOH)', fontsize=12)
ax.set_ylabel('Voltage Kurtosis', fontsize=12)
ax.set_title('Universal Degradation Signature: Voltage Kurtosis vs. SOH', pad=12)
ax.invert_xaxis()
ax.legend(frameon=True, facecolor='white', framealpha=0.95, loc='upper left')
ax.grid(True)

fig2_path = os.path.join(DOCS_IMG, 'fig2_kurtosis_universal_signature.png')
plt.savefig(fig2_path)
shutil.copy2(fig2_path, os.path.join(LOCAL_DIR, 'fig2_kurtosis_universal_signature.png'))
plt.close()

# ==============================================================================
# FIGURE 3: Signed vs Absolute Correlation across Detrending Degrees
# ==============================================================================
print("[Generating Patent Figure 3] Signed vs. Absolute Correlation across Orders ...")
df_exp1 = pd.read_csv(os.path.join(ART_DIR, 'signed_vs_abs_correlation.csv'))

fig, ax = plt.subplots(figsize=(8, 5))

for chem in ['LFP', 'NMC', 'LCO']:
    sub = df_exp1[df_exp1['chemistry'] == chem].sort_values('degree')
    degs = sub['degree'].values
    s_r  = sub['mean_signed_r'].values
    ax.plot(degs, s_r, marker='o', markersize=7, lw=2.4, label=f'{chem} (Signed $r$)', color=COLOR_MAP[chem])

ax.axhline(0, color='#7F8C8D', linestyle=':', lw=1.5)
ax.set_ylim(-1.08, 1.08)
ax.set_xticks([1, 2, 3, 4, 5, 6])
ax.set_xlabel('Polynomial Detrending Order ($d$)', fontsize=12)
ax.set_ylabel('Pearson Correlation Coefficient ($r$)', fontsize=12)
ax.set_title('Signed Pearson Correlation ($r$) Across Detrending Polynomial Orders', pad=12)
ax.grid(True)
ax.legend(frameon=True, facecolor='white', framealpha=0.95, loc='lower right')

fig3_path = os.path.join(DOCS_IMG, 'fig3_signed_vs_abs_correlation.png')
plt.savefig(fig3_path)
shutil.copy2(fig3_path, os.path.join(LOCAL_DIR, 'fig3_signed_vs_abs_correlation.png'))
plt.close()

# ==============================================================================
# FIGURE 4: SOH Strategy Benchmark (Global vs Specific vs Calibrated)
# ==============================================================================
print("[Generating Patent Figure 4] SOH Strategy Benchmark ...")
df_strat = pd.read_csv(os.path.join(ART_DIR, 'strategy_comparison_results.csv'))
sub_soh = df_strat[df_strat['target'] == 'SOH']

fig, ax = plt.subplots(figsize=(7.5, 5))
x = np.arange(len(sub_soh))
w = 0.25

b1 = ax.bar(x - w, sub_soh['rmse_strategy_A_global'], w, label='Strategy A (Global)', color='#3498DB', edgecolor='#1B4F72', lw=1.0)
b2 = ax.bar(x, sub_soh['rmse_strategy_B_specific'], w, label='Strategy B (Chemistry-Specific)', color='#2ECC71', edgecolor='#145A32', lw=1.0)
b3 = ax.bar(x + w, sub_soh['rmse_strategy_C_calibrated'], w, label='Strategy C (Shared + Calibrated)', color='#E67E22', edgecolor='#7E5109', lw=1.0)

ax.set_ylabel('SOH RMSE (Lower is Better)', fontsize=12)
ax.set_title('SOH Estimation Error across Modeling Strategies', pad=12)
ax.set_xticks(x)
ax.set_xticklabels(sub_soh['chemistry'], fontweight='bold', fontsize=11)
ax.set_ylim(0, max(sub_soh['rmse_strategy_C_calibrated']) * 1.18)
ax.grid(True, axis='y')
ax.legend(frameon=True, facecolor='white', loc='upper left')

for rects in [b1, b2, b3]:
    for rect in rects:
        h = rect.get_height()
        ax.annotate(f'{h:.3f}', (rect.get_x() + rect.get_width()/2., h),
                    xytext=(0, 4), textcoords="offset points", ha='center', va='bottom', fontsize=9.5, fontweight='bold')

fig4_path = os.path.join(DOCS_IMG, 'fig4_modeling_strategy_soh.png')
plt.savefig(fig4_path)
shutil.copy2(fig4_path, os.path.join(LOCAL_DIR, 'fig4_modeling_strategy_soh.png'))
plt.close()

# ==============================================================================
# FIGURE 5: RUL Strategy Benchmark (Global vs Specific vs Calibrated)
# ==============================================================================
print("[Generating Patent Figure 5] RUL Strategy Benchmark ...")
sub_rul = df_strat[df_strat['target'] == 'RUL']

fig, ax = plt.subplots(figsize=(6.5, 5))
x2 = np.arange(len(sub_rul))

b1_r = ax.bar(x2 - w, sub_rul['rmse_strategy_A_global'], w, label='Strategy A (Global)', color='#3498DB', edgecolor='#1B4F72', lw=1.0)
b2_r = ax.bar(x2, sub_rul['rmse_strategy_B_specific'], w, label='Strategy B (Chemistry-Specific)', color='#2ECC71', edgecolor='#145A32', lw=1.0)
b3_r = ax.bar(x2 + w, sub_rul['rmse_strategy_C_calibrated'], w, label='Strategy C (Shared + Calibrated)', color='#E67E22', edgecolor='#7E5109', lw=1.0)

ax.set_ylabel('RUL RMSE in Cycles (Lower is Better)', fontsize=12)
ax.set_title('RUL Estimation Error across Modeling Strategies', pad=12)
ax.set_xticks(x2)
ax.set_xticklabels(sub_rul['chemistry'], fontweight='bold', fontsize=11)
ax.set_ylim(0, max(sub_rul['rmse_strategy_C_calibrated']) * 1.18)
ax.grid(True, axis='y')
ax.legend(frameon=True, facecolor='white', loc='upper left')

for rects in [b1_r, b2_r, b3_r]:
    for rect in rects:
        h = rect.get_height()
        ax.annotate(f'{h:.0f}', (rect.get_x() + rect.get_width()/2., h),
                    xytext=(0, 4), textcoords="offset points", ha='center', va='bottom', fontsize=9.5, fontweight='bold')

fig5_path = os.path.join(DOCS_IMG, 'fig5_modeling_strategy_rul.png')
plt.savefig(fig5_path)
shutil.copy2(fig5_path, os.path.join(LOCAL_DIR, 'fig5_modeling_strategy_rul.png'))
plt.close()

# ==============================================================================
# FIGURE 6: Feature Transfer Ranking SOH (LOCO CV)
# ==============================================================================
print("[Generating Patent Figure 6] Feature Transfer Ranking SOH ...")
df_loco = pd.read_csv(os.path.join(ART_DIR, 'feature_transfer_study.csv'))
soh_loco = df_loco[df_loco['target'] == 'soh'].copy()
pivot_loco_soh = soh_loco.pivot(index='feature', columns='test_chem', values='rmse')
mean_soh_rmse = pivot_loco_soh.mean(axis=1).sort_values()

fig, ax = plt.subplots(figsize=(8, 5))
features_sorted = mean_soh_rmse.index
vals = mean_soh_rmse.values
bar_colors = ['#8E44AD' if 'voltage' in f else ('#2E7D32' if 'ripple' in f or 'D' in f else '#34495E') for f in features_sorted]

ax.barh(features_sorted[::-1], vals[::-1], color=bar_colors[::-1], edgecolor='#1B2631', height=0.65)
ax.set_xlabel('Mean Cross-Chemistry SOH Transfer RMSE', fontsize=12)
ax.set_title('SOH Feature Transferability Ranking (Leave-One-Chemistry-Out)', pad=12)
ax.grid(True, axis='x')

for i, (f, v) in enumerate(zip(features_sorted[::-1], vals[::-1])):
    ax.annotate(f'{v:.4f}', (v + 0.003, i), va='center', fontsize=9.5, fontweight='bold')

ax.set_xlim(0, max(vals) * 1.15)

fig6_path = os.path.join(DOCS_IMG, 'fig6_feature_transfer_rank_soh.png')
plt.savefig(fig6_path)
shutil.copy2(fig6_path, os.path.join(LOCAL_DIR, 'fig6_feature_transfer_rank_soh.png'))
plt.close()

# ==============================================================================
# FIGURE 7: Feature Transfer Ranking RUL (LOCO CV)
# ==============================================================================
print("[Generating Patent Figure 7] Feature Transfer Ranking RUL ...")
rul_loco = df_loco[df_loco['target'] == 'rul'].dropna(subset=['rmse']).copy()
pivot_loco_rul = rul_loco.pivot(index='feature', columns='test_chem', values='rmse')
mean_rul_rmse = pivot_loco_rul.mean(axis=1).sort_values()

fig, ax = plt.subplots(figsize=(8, 5))
features_sorted_r = mean_rul_rmse.index
vals_r = mean_rul_rmse.values
bar_colors_r = ['#8E44AD' if 'voltage' in f else ('#2E7D32' if 'ripple' in f or 'D' in f or 'fft' in f else '#34495E') for f in features_sorted_r]

ax.barh(features_sorted_r[::-1], vals_r[::-1], color=bar_colors_r[::-1], edgecolor='#1B2631', height=0.65)
ax.set_xlabel('Mean Cross-Chemistry RUL Transfer RMSE (Cycles)', fontsize=12)
ax.set_title('RUL Feature Transferability Ranking (NMC $\leftrightarrow$ LCO)', pad=12)
ax.grid(True, axis='x')

for i, (f, v) in enumerate(zip(features_sorted_r[::-1], vals_r[::-1])):
    ax.annotate(f'{v:.0f}', (v + 50, i), va='center', fontsize=9.5, fontweight='bold')

ax.set_xlim(0, max(vals_r) * 1.15)

fig7_path = os.path.join(DOCS_IMG, 'fig7_feature_transfer_rank_rul.png')
plt.savefig(fig7_path)
shutil.copy2(fig7_path, os.path.join(LOCAL_DIR, 'fig7_feature_transfer_rank_rul.png'))
plt.close()

# ==============================================================================
# FIGURE 8: Cell-Level Correlation Heatmap
# ==============================================================================
print("[Generating Patent Figure 8] Cell-Level Correlation Audit Heatmap ...")
df_audit = pd.read_csv(os.path.join(ART_DIR, 'cell_correlation_audit.csv'))
pivot_r = df_audit.pivot(index='cell_id', columns='poly_order', values='r_norm_firstcyc')

fig, ax = plt.subplots(figsize=(8, 6.5))
sns.heatmap(pivot_r, annot=True, fmt="+.2f", cmap="coolwarm", center=0, vmin=-1, vmax=1,
            cbar_kws={'label': 'Pearson Correlation ($r$)'}, ax=ax, linewidths=0.5, linecolor='#ECF0F1')

ax.set_title('Cell-Level Pearson Correlation ($r$) across Detrending Degrees (1–6)', pad=12)
ax.set_xlabel('Polynomial Detrending Degree ($d$)', fontsize=12, labelpad=8)
ax.set_ylabel('Cell Identifier', fontsize=12)

fig8_path = os.path.join(DOCS_IMG, 'fig8_cell_correlation_heatmap.png')
plt.savefig(fig8_path)
shutil.copy2(fig8_path, os.path.join(LOCAL_DIR, 'fig8_cell_correlation_heatmap.png'))
plt.close()

print("\nAll modular patent & paper figures generated successfully!")
