"""
compute_feature_importances.py  — standalone, runs entirely from local RAM.
Fits B4 RandomForest on SOH (all rows) and RUL (observed-EOL only),
saves feature_importances.csv and feature_importance_ablation.png to all output dirs.
"""
import os, shutil, tempfile
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor

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
    LOCAL_DIR = tempfile.gettempdir()

OUT_DIRS  = [
    os.path.join(BIP_DIR, 'classification_artifacts'),
    LOCAL_DIR,
    os.path.join(BIP_DIR, 'docs', 'image'),
]

B4_FEATURES = [
    'voltage_mean', 'voltage_std', 'voltage_min', 'voltage_max', 'voltage_skewness', 'voltage_kurtosis',
    'current_mean', 'current_std', 'temperature_mean', 'temperature_std', 'discharge_duration_s', 'charge_time_s',
    'ripple_norm_deg2', 'D1_ripple', 'D2_ripple', 'dominant_frequency', 'fft_energy', 'spectral_entropy'
]
RF_PARAMS = {'n_estimators': 30, 'max_depth': 10, 'random_state': 42, 'n_jobs': 1}

# Copy master CSV to a local temp file to avoid NTFS lock during fit
print("Copying master CSV to local temp for fast fit...")
with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as tmp:
    tmp_path = tmp.name
shutil.copy2(MASTER_CSV, tmp_path)

df = pd.read_csv(tmp_path)
os.unlink(tmp_path)
print(f"Loaded {len(df):,} rows")

df_soh = df.dropna(subset=B4_FEATURES + ['soh']).copy()
df_rul = df[df['rul_censored'] == 0].dropna(subset=B4_FEATURES + ['rul']).copy()
print(f"SOH rows: {len(df_soh):,}  |  RUL rows (observed EOL): {len(df_rul):,}")

feat_importances = []
for target, df_t in [('soh', df_soh), ('rul', df_rul)]:
    X = df_t[B4_FEATURES].to_numpy()
    y = df_t[target].to_numpy()
    print(f"Fitting RF for {target.upper()} ({len(df_t):,} rows)...")
    model = RandomForestRegressor(**RF_PARAMS)
    model.fit(X, y)
    for feat, imp in zip(B4_FEATURES, model.feature_importances_):
        feat_importances.append({'target': target, 'feature': feat, 'importance': imp})
    print(f"  Done.")

df_imp = pd.DataFrame(feat_importances)

# Save CSV to all output dirs
for d in OUT_DIRS:
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, 'feature_importances.csv')
    df_imp.to_csv(p, index=False)
    print(f"Saved feature_importances.csv → {p}")

# Plot
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
for ax, t in zip([ax1, ax2], ['soh', 'rul']):
    df_t = df_imp[df_imp['target'] == t].sort_values('importance', ascending=True)
    ax.barh(df_t['feature'], df_t['importance'], color='skyblue', edgecolor='gray')
    ax.set_title(f'Feature Importance — {t.upper()} (B4 Combined, all chemistries)',
                 fontsize=12, fontweight='bold')
    ax.set_xlabel('Mean Decrease in Impurity', fontsize=11)
    ax.grid(True, linestyle='--', alpha=0.5)
plt.tight_layout()

NTFS_DIRS = [
    os.path.join(BIP_DIR, 'classification_artifacts'),
    os.path.join(BIP_DIR, 'docs/image'),
]

# Save to local first (no NTFS lock), then copy
local_img = os.path.join(LOCAL_DIR, 'feature_importance_ablation.png')
plt.savefig(local_img, dpi=150, bbox_inches='tight')
print(f"Saved feature_importance_ablation.png → {local_img}")
for d in NTFS_DIRS:
    os.makedirs(d, exist_ok=True)
    dst = os.path.join(d, 'feature_importance_ablation.png')
    shutil.copy2(local_img, dst)
    print(f"Copied → {dst}")

print("\nDone.")
