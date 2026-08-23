"""
run_feature_transfer_study.py
------------------------------
Tests each physics feature INDIVIDUALLY under Leave-One-Chemistry-Out (LOCO)
cross-validation to answer: which features survive chemistry transfer?

For each feature in TRANSFER_FEATURES:
  For each LOCO direction (train on 2, test on 1):
    Fit a single-feature RandomForest and record RMSE for SOH and RUL.

Outputs:
  classification_artifacts/feature_transfer_study.csv
  docs/image/feature_transfer_heatmap.png    — RMSE heatmap (features × LOCO dirs)
  docs/image/feature_transfer_rank.png       — ranked bar chart of mean transfer RMSE

NOTE: RUL regression is restricted to rows where rul_censored == 0.
"""
import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
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
ART_DIR    = os.path.join(BIP_DIR, 'classification_artifacts')
DOCS_IMG   = os.path.join(BIP_DIR, 'docs', 'image')

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
print(f"  {len(df):,} rows | EOL observed: {df['eol_observed'].sum():,}")

TRANSFER_FEATURES = [
    'ripple_norm_deg2',   # core physics-normalised feature
    'ripple_rms_deg2',    # raw (un-normalised) ripple
    'D1_ripple',          # legacy ripple (first derivative integral)
    'D2_ripple',          # legacy ripple (second derivative integral)
    'fft_energy',         # dominant FFT energy from spectral analysis
    'spectral_entropy',   # spectral entropy
    'voltage_kurtosis',   # top SOH predictor from ablation
    'voltage_mean',       # conventional baseline anchor
    'cycle_index',        # naive baseline
]

CHEMISTRIES = ['LFP', 'NMC', 'LCO']
TARGETS     = ['soh', 'rul']

rf_params = {'n_estimators': 30, 'max_depth': 10, 'random_state': 42, 'n_jobs': 1}

records = []

print("\n" + "="*80)
print("PER-FEATURE LEAVE-ONE-CHEMISTRY-OUT TRANSFER STUDY")
print("="*80)

for target in TARGETS:
    print(f"\n── Target: {target.upper()} ──")

    # For RUL, restrict to observed-EOL rows only
    if target == 'rul':
        df_target = df[df['rul_censored'] == 0].dropna(subset=[target]).copy()
        print(f"  RUL: using {len(df_target):,} observed-EOL rows "
              f"(excluded {len(df) - len(df_target):,} censored)")
    else:
        df_target = df.dropna(subset=[target]).copy()

    for feat in TRANSFER_FEATURES:
        if feat not in df_target.columns:
            print(f"  Feature {feat!r} not in dataset — skipping.")
            continue

        df_f = df_target.dropna(subset=[feat]).copy()

        print(f"\n  Feature: {feat:<25}", end='  ')
        for test_chem in CHEMISTRIES:
            df_train = df_f[df_f['chemistry'] != test_chem]
            df_test  = df_f[df_f['chemistry'] == test_chem]

            if len(df_train) < 10 or len(df_test) < 5:
                rmse, r2 = np.nan, np.nan
            else:
                X_tr = df_train[[feat]].to_numpy()
                y_tr = df_train[target].to_numpy()
                X_te = df_test[[feat]].to_numpy()
                y_te = df_test[target].to_numpy()

                model = RandomForestRegressor(**rf_params)
                model.fit(X_tr, y_tr)
                preds = model.predict(X_te)

                rmse = float(np.sqrt(mean_squared_error(y_te, preds)))
                r2   = float(r2_score(y_te, preds))

            print(f"→ {test_chem}: RMSE={rmse:.4f}", end='  ')
            records.append({
                'target':      target,
                'feature':     feat,
                'test_chem':   test_chem,
                'train_chems': ','.join(c for c in CHEMISTRIES if c != test_chem),
                'rmse':        round(rmse, 6) if not np.isnan(rmse) else np.nan,
                'r2':          round(r2,   6) if not np.isnan(r2)   else np.nan,
            })
        print()  # newline

df_results = pd.DataFrame(records)
df_results.to_csv(os.path.join(ART_DIR, 'feature_transfer_study.csv'), index=False)
df_results.to_csv(os.path.join(LOCAL_DIR, 'feature_transfer_study.csv'), index=False)
print(f"\nResults saved → {os.path.join(ART_DIR, 'feature_transfer_study.csv')}")

# ── Heatmap: RMSE per feature × LOCO direction ────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(22, 8))

for ax, target in zip(axes, TARGETS):
    df_t = df_results[df_results['target'] == target]
    pivot_rmse = df_t.pivot_table(index='feature', columns='test_chem',
                                   values='rmse', aggfunc='mean')
    pivot_rmse = pivot_rmse.reindex(TRANSFER_FEATURES).dropna(how='all')

    # Normalise each column to [0,1] for colour scale (lower = better = greener)
    normed = pivot_rmse.copy()
    for col in normed.columns:
        col_vals = normed[col]
        rng = col_vals.max() - col_vals.min()
        normed[col] = (col_vals - col_vals.min()) / rng if rng > 0 else 0.5

    im = ax.imshow(normed.values, cmap='RdYlGn_r', vmin=0, vmax=1, aspect='auto')
    ax.set_xticks(range(len(normed.columns)))
    ax.set_xticklabels([f'Test: {c}' for c in normed.columns], fontsize=10)
    ax.set_yticks(range(len(normed.index)))
    ax.set_yticklabels(normed.index, fontsize=9)
    ax.set_title(f'{target.upper()} — Feature Transfer RMSE\n(Green = lower error, red = higher)',
                 fontsize=11, fontweight='bold')

    # Annotate with actual RMSE
    for ri, feat in enumerate(normed.index):
        for ci, chem in enumerate(normed.columns):
            val = pivot_rmse.loc[feat, chem] if feat in pivot_rmse.index else np.nan
            if not np.isnan(val):
                fmt = f'{val:.3f}' if target == 'soh' else f'{val:.0f}'
                ax.text(ci, ri, fmt, ha='center', va='center', fontsize=8,
                        color='white' if normed.loc[feat, chem] > 0.7 else 'black')

    plt.colorbar(im, ax=ax, label='Relative RMSE (normalised per column)')

plt.suptitle('Per-Feature LOCO Transfer Study\nSingle-feature RandomForest trained on 2 chemistries → tested on unseen third',
             fontsize=12, fontweight='bold')
plt.tight_layout()

for d in [DOCS_IMG, LOCAL_DIR, ART_DIR]:
    plt.savefig(os.path.join(d, 'feature_transfer_heatmap.png'), dpi=150, bbox_inches='tight')
print(f"Heatmap saved → {os.path.join(DOCS_IMG, 'feature_transfer_heatmap.png')}")

# ── Ranked bar chart: mean RMSE across all LOCO directions per feature ─────────
fig2, axes2 = plt.subplots(1, 2, figsize=(18, 6))
for ax, target in zip(axes2, TARGETS):
    df_t = df_results[df_results['target'] == target]
    mean_rmse = (df_t.groupby('feature')['rmse']
                   .mean()
                   .reindex(TRANSFER_FEATURES)
                   .dropna()
                   .sort_values())
    colors = ['#2ca02c' if f in ('ripple_norm_deg2', 'fft_energy', 'D1_ripple', 'D2_ripple',
                                   'ripple_rms_deg2', 'spectral_entropy')
              else '#d62728' for f in mean_rmse.index]
    mean_rmse.plot(kind='barh', ax=ax, color=colors, edgecolor='black')
    ax.set_xlabel('Mean RMSE across all LOCO test chemistries', fontsize=10)
    ax.set_title(f'{target.upper()} — Mean Transfer RMSE by Feature\n(green = physics-derived, red = conventional)',
                 fontsize=11, fontweight='bold')
    ax.grid(True, linestyle='--', alpha=0.5)
    # Annotate
    for bar, val in zip(ax.patches, mean_rmse.values):
        fmt = f'{val:.4f}' if target == 'soh' else f'{val:.0f}'
        ax.text(val + mean_rmse.max() * 0.01, bar.get_y() + bar.get_height() / 2,
                fmt, va='center', fontsize=8)

plt.tight_layout()
for d in [DOCS_IMG, LOCAL_DIR, ART_DIR]:
    plt.savefig(os.path.join(d, 'feature_transfer_rank.png'), dpi=150, bbox_inches='tight')
print(f"Rank chart saved → {os.path.join(DOCS_IMG, 'feature_transfer_rank.png')}")

# ── Printable summary ──────────────────────────────────────────────────────────
print("\n\n" + "="*80)
print("SUMMARY: Best and worst features for cross-chemistry transfer")
print("="*80)
for target in TARGETS:
    df_t = df_results[df_results['target'] == target]
    mean_rmse = df_t.groupby('feature')['rmse'].mean().sort_values()
    print(f"\n  {target.upper()} — ranked by mean LOCO RMSE (lower = better transfer):")
    for feat, rmse in mean_rmse.items():
        fmt = f'{rmse:.5f}' if target == 'soh' else f'{rmse:.1f}'
        print(f"    {feat:<28} → {fmt}")
