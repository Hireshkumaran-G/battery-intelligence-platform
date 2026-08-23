"""
regenerate_scientific_plots.py
------------------------------
Generates publication-quality, pristine, high-density scientific figures for:
1. Figure 1: Signed vs Absolute Pearson Correlation Across Polynomial Orders (1-6)
2. Figure 2: Physical Degradation Signatures & NMC Sign Reversal Mechanics
3. Figure 3: Modeling Strategy Comparison (Global vs. Specific vs. Calibrated)
4. Figure 4: Cell-Level Correlation Audit Heatmap (Degree 1 to 6)
5. Figure 5: Per-Feature LOCO Transferability Heatmap & Ranking
"""
import os
import shutil
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

# Set publication style defaults
plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['DejaVu Sans', 'Arial', 'Helvetica'],
    'font.size': 10,
    'axes.labelsize': 11,
    'axes.titlesize': 12,
    'axes.titleweight': 'bold',
    'xtick.labelsize': 9.5,
    'ytick.labelsize': 9.5,
    'legend.fontsize': 9.5,
    'figure.titlesize': 13,
    'figure.titleweight': 'bold',
    'axes.edgecolor': '#2C3E50',
    'axes.linewidth': 1.1,
    'grid.color': '#BDC3C7',
    'grid.linestyle': '--',
    'grid.alpha': 0.4,
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
    'LFP': '#2E7D32',  # Deep Emerald Green
    'NMC': '#D81B60',  # Rich Crimson Magenta
    'LCO': '#1565C0',  # Sapphire Blue
    'Signed': '#2980B9', # Slate Blue
    'Absolute': '#8E44AD' # Royal Purple
}

print(f"Loading master dataset from {os.path.join(ART_DIR, 'master_chemistry_dataset.csv')} ...")
df_master = pd.read_csv(os.path.join(ART_DIR, 'master_chemistry_dataset.csv'))

# ==============================================================================
# FIGURE 1: Signed vs Absolute Correlation Across Polynomial Orders (1-6)
# ==============================================================================
print("\n[Generating Figure 1] Signed vs. Absolute Correlation ...")
df_exp1 = pd.read_csv(os.path.join(ART_DIR, 'signed_vs_abs_correlation.csv'))

fig, axes = plt.subplots(1, 3, figsize=(15, 4.5), sharey=True)

for ax, chem in zip(axes, ['LFP', 'NMC', 'LCO']):
    sub = df_exp1[df_exp1['chemistry'] == chem].sort_values('degree')
    degs = sub['degree'].values
    s_r  = sub['mean_signed_r'].values
    a_r  = sub['mean_abs_r'].values
    
    # Fill area for absolute strength
    ax.fill_between(degs, 0, a_r, color=COLOR_MAP[chem], alpha=0.08)
    
    # Line plots
    ax.plot(degs, s_r, marker='o', markersize=6, lw=2.2, label='Signed Pearson $r$', color=COLOR_MAP[chem])
    ax.plot(degs, a_r, marker='s', markersize=5, lw=1.8, linestyle='--', label='Absolute $|r|$', color='#5D6D7E')
    
    ax.axhline(0, color='#7F8C8D', linestyle=':', lw=1.2)
    ax.set_ylim(-1.08, 1.08)
    ax.set_xticks(degs)
    ax.set_xlabel('Polynomial Detrending Order ($d$)', fontsize=10.5, labelpad=8)
    ax.set_title(f'{chem} Chemistry', color=COLOR_MAP[chem], pad=10)
    ax.grid(True)
    ax.legend(loc='lower right' if chem == 'LFP' else ('upper right' if chem == 'NMC' else 'lower left'), frameon=True, facecolor='white', framealpha=0.9)

    # Annotate Degree 2 point cleanly
    d2_signed = s_r[degs == 2][0]
    d2_abs = a_r[degs == 2][0]
    ax.annotate(f'$r = {d2_signed:+.2f}$', (2, d2_signed), textcoords="offset points", 
                xytext=(0, 10 if d2_signed >= 0 else -15), ha='center', fontsize=9, fontweight='bold',
                bbox=dict(boxstyle='round,pad=0.2', facecolor='white', edgecolor=COLOR_MAP[chem], alpha=0.85))

axes[0].set_ylabel('Pearson Correlation Coefficient ($r$)', fontsize=11)
plt.suptitle('Figure 1: Signed $r$ vs. Absolute $|r|$ Association Across Detrending Polynomial Orders', y=1.02)

fig1_path = os.path.join(DOCS_IMG, 'signed_vs_absolute_correlation.png')
plt.savefig(fig1_path)
shutil.copy2(fig1_path, os.path.join(LOCAL_DIR, 'signed_vs_absolute_correlation.png'))
plt.close()

# ==============================================================================
# FIGURE 2: Physical Degradation Signatures & NMC Sign Reversal Mechanics
# ==============================================================================
print("[Generating Figure 2] Physics of NMC Sign Reversal ...")

fig, axes = plt.subplots(2, 2, figsize=(12, 9))

# Panel A: Ripple RMS vs SOH
ax = axes[0, 0]
for chem in ['LFP', 'NMC', 'LCO']:
    sub = df_master[df_master['chemistry'] == chem]
    sns.regplot(data=sub, x='soh', y='ripple_rms_deg2', ax=ax, scatter_kws={'alpha':0.25, 's':12}, 
                line_kws={'linewidth': 2.0}, color=COLOR_MAP[chem], label=chem)
ax.set_xlabel('State of Health (SOH)', fontsize=10.5)
ax.set_ylabel('Ripple RMS Degree 2 (V)', fontsize=10.5)
ax.set_title('A. Dynamic Ripple RMS vs. SOH (Sign Reversal)', pad=8)
ax.invert_xaxis()
ax.legend(frameon=True, facecolor='white')
ax.grid(True)

# Panel B: Voltage Kurtosis vs SOH (Universal Trend)
ax = axes[0, 1]
for chem in ['LFP', 'NMC', 'LCO']:
    sub = df_master[df_master['chemistry'] == chem]
    sns.regplot(data=sub, x='soh', y='voltage_kurtosis', ax=ax, scatter_kws={'alpha':0.25, 's':12}, 
                line_kws={'linewidth': 2.0}, color=COLOR_MAP[chem], label=chem)
ax.set_xlabel('State of Health (SOH)', fontsize=10.5)
ax.set_ylabel('Voltage Kurtosis', fontsize=10.5)
ax.set_title('B. Voltage Kurtosis vs. SOH (Universal Signature)', pad=8)
ax.invert_xaxis()
ax.legend(frameon=True, facecolor='white')
ax.grid(True)

# Panel C: Voltage Standard Deviation vs SOH
ax = axes[1, 0]
for chem in ['LFP', 'NMC', 'LCO']:
    sub = df_master[df_master['chemistry'] == chem]
    sns.regplot(data=sub, x='soh', y='voltage_std', ax=ax, scatter_kws={'alpha':0.25, 's':12}, 
                line_kws={'linewidth': 2.0}, color=COLOR_MAP[chem], label=chem)
ax.set_xlabel('State of Health (SOH)', fontsize=10.5)
ax.set_ylabel('Voltage Standard Deviation (V)', fontsize=10.5)
ax.set_title('C. Discharge Curve Variance ($\sigma_V$) vs. SOH', pad=8)
ax.invert_xaxis()
ax.legend(frameon=True, facecolor='white')
ax.grid(True)

# Panel D: Spectral FFT Energy vs SOH
ax = axes[1, 1]
for chem in ['LFP', 'NMC', 'LCO']:
    sub = df_master[df_master['chemistry'] == chem]
    sns.regplot(data=sub, x='soh', y='fft_energy', ax=ax, scatter_kws={'alpha':0.25, 's':12}, 
                line_kws={'linewidth': 2.0}, color=COLOR_MAP[chem], label=chem)
ax.set_xlabel('State of Health (SOH)', fontsize=10.5)
ax.set_ylabel('FFT Spectral Energy', fontsize=10.5)
ax.set_title('D. Dominant Spectral Power ($E_{FFT}$) vs. SOH', pad=8)
ax.invert_xaxis()
ax.legend(frameon=True, facecolor='white')
ax.grid(True)

plt.suptitle('Figure 2: Electrochemical Physics & Signal Degradation Signatures across Chemistries', y=1.01)
plt.tight_layout()

fig2_path = os.path.join(DOCS_IMG, 'nmc_sign_reversal_physics.png')
plt.savefig(fig2_path)
shutil.copy2(fig2_path, os.path.join(LOCAL_DIR, 'nmc_sign_reversal_physics.png'))
plt.close()

# ==============================================================================
# FIGURE 3: Modeling Strategy Comparison (Global vs. Specific vs. Calibrated)
# ==============================================================================
print("[Generating Figure 3] Modeling Strategy Comparison ...")
df_strat = pd.read_csv(os.path.join(ART_DIR, 'strategy_comparison_results.csv'))

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

# SOH Subplot
sub_soh = df_strat[df_strat['target'] == 'SOH']
x = np.arange(len(sub_soh))
w = 0.24

b1 = ax1.bar(x - w, sub_soh['rmse_strategy_A_global'], w, label='Strategy A (Global)', color='#3498DB', edgecolor='#1B4F72', lw=1.0)
b2 = ax1.bar(x, sub_soh['rmse_strategy_B_specific'], w, label='Strategy B (Chemistry-Specific)', color='#2ECC71', edgecolor='#145A32', lw=1.0)
b3 = ax1.bar(x + w, sub_soh['rmse_strategy_C_calibrated'], w, label='Strategy C (Shared + Calibrated)', color='#E67E22', edgecolor='#7E5109', lw=1.0)

ax1.set_ylabel('SOH Root Mean Squared Error (RMSE)', fontsize=10.5)
ax1.set_title('A. State-of-Health (SOH) Estimation Error', pad=10)
ax1.set_xticks(x)
ax1.set_xticklabels(sub_soh['chemistry'], fontweight='bold')
ax1.set_ylim(0, max(sub_soh['rmse_strategy_C_calibrated']) * 1.18)
ax1.grid(True, axis='y')
ax1.legend(frameon=True, facecolor='white', loc='upper left')

for rects in [b1, b2, b3]:
    for rect in rects:
        h = rect.get_height()
        ax1.annotate(f'{h:.3f}', (rect.get_x() + rect.get_width()/2., h),
                    xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=8.5)

# RUL Subplot
sub_rul = df_strat[df_strat['target'] == 'RUL']
x2 = np.arange(len(sub_rul))

b1_r = ax2.bar(x2 - w, sub_rul['rmse_strategy_A_global'], w, label='Strategy A (Global)', color='#3498DB', edgecolor='#1B4F72', lw=1.0)
b2_r = ax2.bar(x2, sub_rul['rmse_strategy_B_specific'], w, label='Strategy B (Chemistry-Specific)', color='#2ECC71', edgecolor='#145A32', lw=1.0)
b3_r = ax2.bar(x2 + w, sub_rul['rmse_strategy_C_calibrated'], w, label='Strategy C (Shared + Calibrated)', color='#E67E22', edgecolor='#7E5109', lw=1.0)

ax2.set_ylabel('RUL RMSE (Cycles)', fontsize=10.5)
ax2.set_title('B. Remaining Useful Life (RUL) Estimation Error', pad=10)
ax2.set_xticks(x2)
ax2.set_xticklabels(sub_rul['chemistry'], fontweight='bold')
ax2.set_ylim(0, max(sub_rul['rmse_strategy_C_calibrated']) * 1.18)
ax2.grid(True, axis='y')
ax2.legend(frameon=True, facecolor='white', loc='upper left')

for rects in [b1_r, b2_r, b3_r]:
    for rect in rects:
        h = rect.get_height()
        ax2.annotate(f'{h:.0f}', (rect.get_x() + rect.get_width()/2., h),
                    xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=8.5)

plt.suptitle('Figure 3: Benchmark Comparison of Machine Learning Modeling Paradigms', y=1.02)
plt.tight_layout()

fig3_path = os.path.join(DOCS_IMG, 'strategy_comparison_soh_rul.png')
plt.savefig(fig3_path)
shutil.copy2(fig3_path, os.path.join(LOCAL_DIR, 'strategy_comparison_soh_rul.png'))
plt.close()

# ==============================================================================
# FIGURE 4: Cell-Level Correlation Audit Heatmap
# ==============================================================================
print("[Generating Figure 4] Cell-Level Correlation Audit Heatmap ...")
df_audit = pd.read_csv(os.path.join(ART_DIR, 'cell_correlation_audit.csv'))

# Create pivot table cell_id x degree for r_norm_fc
pivot_r = df_audit.pivot(index='cell_id', columns='poly_order', values='r_norm_firstcyc')

fig, ax = plt.subplots(figsize=(10, 7))

sns.heatmap(pivot_r, annot=True, fmt="+.2f", cmap="coolwarm", center=0, vmin=-1, vmax=1,
            cbar_kws={'label': 'Pearson Correlation ($r$)'}, ax=ax, linewidths=0.5, linecolor='#ECF0F1')

ax.set_title('Figure 4: Canonical Cell-Level Pearson Correlation ($r$) Across Detrending Degrees (1–6)', pad=12)
ax.set_xlabel('Polynomial Detrending Degree ($d$)', fontsize=11, labelpad=8)
ax.set_ylabel('Cell Identifier', fontsize=11)

fig4_path = os.path.join(DOCS_IMG, 'cell_correlation_audit_heatmap.png')
plt.savefig(fig4_path)
shutil.copy2(fig4_path, os.path.join(LOCAL_DIR, 'cell_correlation_audit_heatmap.png'))
plt.close()

# ==============================================================================
# FIGURE 5: Per-Feature LOCO Transfer Study Heatmap & Rank Chart
# ==============================================================================
print("[Generating Figure 5] Per-Feature LOCO Transfer Heatmap & Ranking ...")
df_loco = pd.read_csv(os.path.join(ART_DIR, 'feature_transfer_study.csv'))

# 5A: SOH Heatmap
soh_loco = df_loco[df_loco['target'] == 'soh'].copy()
pivot_loco_soh = soh_loco.pivot(index='feature', columns='test_chem', values='rmse')

# Sort features by mean RMSE
mean_soh_rmse = pivot_loco_soh.mean(axis=1).sort_values()
pivot_loco_soh = pivot_loco_soh.loc[mean_soh_rmse.index]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

sns.heatmap(pivot_loco_soh, annot=True, fmt=".4f", cmap="YlGnBu_r", cbar_kws={'label': 'Transfer RMSE'}, ax=ax1, lw=0.5)
ax1.set_title('A. SOH LOCO Transfer RMSE per Feature', pad=10)
ax1.set_xlabel('Unseen Test Chemistry', fontsize=10.5)
ax1.set_ylabel('Feature Descriptor', fontsize=10.5)

# 5B: Ranked Mean SOH RMSE Bar Plot
features_sorted = mean_soh_rmse.index
vals = mean_soh_rmse.values
bar_colors = ['#8E44AD' if 'voltage' in f else ('#2E7D32' if 'ripple' in f or 'D' in f else '#34495E') for f in features_sorted]

ax2.barh(features_sorted[::-1], vals[::-1], color=bar_colors[::-1], edgecolor='#1B2631', height=0.6)
ax2.set_xlabel('Mean Cross-Chemistry Transfer RMSE', fontsize=10.5)
ax2.set_title('B. SOH Feature Transferability Ranking', pad=10)
ax2.grid(True, axis='x')

for i, (f, v) in enumerate(zip(features_sorted[::-1], vals[::-1])):
    ax2.annotate(f'{v:.4f}', (v + 0.002, i), va='center', fontsize=9, fontweight='bold')

ax2.set_xlim(0, max(vals) * 1.15)

plt.suptitle('Figure 5: Single-Feature Leave-One-Chemistry-Out (LOCO) Transferability Benchmark', y=1.02)
plt.tight_layout()

fig5_path = os.path.join(DOCS_IMG, 'feature_transfer_heatmap.png')
plt.savefig(fig5_path)
shutil.copy2(fig5_path, os.path.join(LOCAL_DIR, 'feature_transfer_heatmap.png'))
plt.close()

print("\nAll pristine scientific figures generated successfully!")
