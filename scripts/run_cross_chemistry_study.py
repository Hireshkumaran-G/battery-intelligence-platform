import os
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import GroupKFold
from sklearn.metrics import mean_squared_error, r2_score

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
MASTER_CSV = os.path.join(DATA_DIR, 'master_chemistry_dataset.csv')
OUTPUT_DIR = os.path.join(BIP_DIR, 'classification_artifacts')
WORKSPACE_OUTPUT_DIR = DATA_DIR
DOCS_IMAGE_DIR = os.path.join(BIP_DIR, 'docs', 'image')

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
df = pd.read_csv(MASTER_CSV)

# Drop any rows with NaN in features we care about
features_all = [
    'cycle_index',
    'voltage_mean', 'voltage_std', 'voltage_min', 'voltage_max', 'voltage_skewness', 'voltage_kurtosis',
    'current_mean', 'current_std', 'temperature_mean', 'temperature_std', 'discharge_duration_s', 'charge_time_s',
    'ripple_norm_deg2', 'D1_ripple', 'D2_ripple', 'dominant_frequency', 'fft_energy', 'spectral_entropy'
]
df = df.dropna(subset=features_all + ['soh', 'cell_id']).reset_index(drop=True)

# SOH: all rows; RUL: only observed-EOL rows (censored rows have rul=NaN)
df_soh = df.copy()
df_rul = df[df['rul_censored'] == 0].dropna(subset=['rul']).reset_index(drop=True)
print(f"SOH dataset: {len(df_soh):,} rows | RUL dataset (observed EOL only): {len(df_rul):,} rows")
print(f"RUL chemistry counts:\n{df_rul['chemistry'].value_counts()}")

# target → dataframe mapping
target_df = {'soh': df_soh, 'rul': df_rul}

# Define feature baselines
baselines = {
    'B0 (Naive)': ['cycle_index'],
    'B1 (Voltage-only)': ['voltage_mean', 'voltage_std', 'voltage_min', 'voltage_max', 'voltage_skewness', 'voltage_kurtosis'],
    'B2 (Conventional)': [
        'voltage_mean', 'voltage_std', 'voltage_min', 'voltage_max', 'voltage_skewness', 'voltage_kurtosis',
        'current_mean', 'current_std', 'temperature_mean', 'temperature_std', 'discharge_duration_s', 'charge_time_s'
    ],
    'B3 (Ripple-only)': ['ripple_norm_deg2', 'D1_ripple', 'D2_ripple', 'dominant_frequency', 'fft_energy', 'spectral_entropy'],
    'B4 (Combined)': [
        'voltage_mean', 'voltage_std', 'voltage_min', 'voltage_max', 'voltage_skewness', 'voltage_kurtosis',
        'current_mean', 'current_std', 'temperature_mean', 'temperature_std', 'discharge_duration_s', 'charge_time_s',
        'ripple_norm_deg2', 'D1_ripple', 'D2_ripple', 'dominant_frequency', 'fft_energy', 'spectral_entropy'
    ]
}

chemistries = ['LFP', 'NMC', 'LCO']
targets = ['soh', 'rul']

# Results storage
loco_results = []
within_results = []

# RandomForest common parameters
rf_params = {'n_estimators': 30, 'max_depth': 10, 'random_state': 42, 'n_jobs': 1}

print("\n" + "="*80)
print("RUNNING WITHIN-CHEMISTRY GROUP-K-FOLD STUDY (CELL-LEVEL SPLITTING)")
print("="*80)

for target in targets:
    for chem in chemistries:
        df_chem = target_df[target][target_df[target]['chemistry'] == chem].reset_index(drop=True)
        if len(df_chem) == 0:
            continue
            
        cells = df_chem['cell_id'].to_numpy()
        
        # 5-Fold GroupKFold by cell_id
        gkf = GroupKFold(n_splits=min(5, len(np.unique(cells))))
        
        for baseline_name, feat_list in baselines.items():
            oof_preds = np.zeros(len(df_chem))
            
            for train_idx, test_idx in gkf.split(df_chem, groups=cells):
                X_train, y_train = df_chem.loc[train_idx, feat_list], df_chem.loc[train_idx, target]
                X_test = df_chem.loc[test_idx, feat_list]
                
                model = RandomForestRegressor(**rf_params)
                model.fit(X_train, y_train)
                oof_preds[test_idx] = model.predict(X_test)
                
            rmse = np.sqrt(mean_squared_error(df_chem[target], oof_preds))
            r2 = r2_score(df_chem[target], oof_preds)
            
            within_results.append({
                'target': target,
                'chemistry': chem,
                'baseline': baseline_name,
                'rmse': rmse,
                'r2': r2
            })
            print(f"Target: {target:3s} | Chem: {chem:3s} | {baseline_name:18s} | RMSE: {rmse:.4f} | R2: {r2:.4f}")

# Save Within-Chemistry Results
df_within = pd.DataFrame(within_results)
df_within.to_csv(os.path.join(OUTPUT_DIR, 'within_chemistry_results.csv'), index=False)
df_within.to_csv(os.path.join(WORKSPACE_OUTPUT_DIR, 'within_chemistry_results.csv'), index=False)
df_within.to_csv(os.path.join(LOCAL_DIR, 'within_chemistry_results.csv'), index=False)

print("\n" + "="*80)
print("RUNNING CROSS-CHEMISTRY LEAVE-ONE-CHEMISTRY-OUT (LOCO) STUDY")
print("="*80)

for target in targets:
    for test_chem in chemistries:
        # Split train and test by chemistry
        df_all   = target_df[target]
        df_train = df_all[df_all['chemistry'] != test_chem].reset_index(drop=True)
        df_test  = df_all[df_all['chemistry'] == test_chem].reset_index(drop=True)
        
        if len(df_train) == 0 or len(df_test) == 0:
            continue
            
        for baseline_name, feat_list in baselines.items():
            X_train, y_train = df_train[feat_list], df_train[target]
            X_test, y_test = df_test[feat_list], df_test[target]
            
            model = RandomForestRegressor(**rf_params)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            
            rmse = np.sqrt(mean_squared_error(y_test, preds))
            r2 = r2_score(y_test, preds)
            
            loco_results.append({
                'target': target,
                'test_chemistry': test_chem,
                'baseline': baseline_name,
                'rmse': rmse,
                'r2': r2
            })
            print(f"Target: {target:3s} | Test Chem: {test_chem:3s} | {baseline_name:18s} | RMSE: {rmse:.4f} | R2: {r2:.4f}")

# Save LOCO Results
df_loco = pd.DataFrame(loco_results)
df_loco.to_csv(os.path.join(OUTPUT_DIR, 'loco_chemistry_results.csv'), index=False)
df_loco.to_csv(os.path.join(WORKSPACE_OUTPUT_DIR, 'loco_chemistry_results.csv'), index=False)
df_loco.to_csv(os.path.join(LOCAL_DIR, 'loco_chemistry_results.csv'), index=False)

print("\n" + "="*80)
print("COMPILING FEATURE ABLATION IMPORTANCE ANALYSIS (B4 combined model)")
print("="*80)

# Feature importance analysis on combined data for SOH and RUL
feat_importances = []
for target in targets:
    df_t_data = target_df[target].dropna(subset=[target])
    X = df_t_data[baselines['B4 (Combined)']]
    y = df_t_data[target]
    model = RandomForestRegressor(**rf_params)
    model.fit(X, y)
    importances = model.feature_importances_
    
    for feat, imp in zip(baselines['B4 (Combined)'], importances):
        feat_importances.append({
            'target': target,
            'feature': feat,
            'importance': imp
        })
        
df_imp = pd.DataFrame(feat_importances)
df_imp.to_csv(os.path.join(OUTPUT_DIR, 'feature_importances.csv'), index=False)
df_imp.to_csv(os.path.join(WORKSPACE_OUTPUT_DIR, 'feature_importances.csv'), index=False)
df_imp.to_csv(os.path.join(LOCAL_DIR, 'feature_importances.csv'), index=False)

# Plot feature importances
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))

for ax, target_name in zip([ax1, ax2], targets):
    df_t = df_imp[df_imp['target'] == target_name].sort_values('importance', ascending=True)
    ax.barh(df_t['feature'], df_t['importance'], color='skyblue', edgecolor='gray')
    ax.set_title(f'Feature Importance for {target_name.upper()} Prediction', fontsize=12, fontweight='bold')
    ax.set_xlabel('Mean Decrease in Impurity', fontsize=11)
    ax.grid(True, linestyle='--', alpha=0.5)

plt.tight_layout()
for d in [OUTPUT_DIR, WORKSPACE_OUTPUT_DIR, DOCS_IMAGE_DIR, LOCAL_DIR]:
    os.makedirs(d, exist_ok=True)
    plt.savefig(os.path.join(d, 'feature_importance_ablation.png'), dpi=150)
print("Saved feature importance ablation plot to: feature_importance_ablation.png")

# Plot LOCO Performance Comparison
fig, axs = plt.subplots(2, 3, figsize=(18, 10))
for r_idx, target_name in enumerate(targets):
    df_loco_t = df_loco[df_loco['target'] == target_name]
    for c_idx, test_chem in enumerate(chemistries):
        df_plot = df_loco_t[df_loco_t['test_chemistry'] == test_chem]
        ax = axs[r_idx, c_idx]
        
        bars = ax.bar(df_plot['baseline'], df_plot['rmse'], color=['#7f7f7f', '#aec7e8', '#1f77b4', '#ffbb78', '#ff7f0e'], edgecolor='black')
        ax.set_title(f'LOCO RMSE for {test_chem} ({target_name.upper()})', fontsize=11, fontweight='bold')
        ax.set_ylabel('RMSE', fontsize=10)
        ax.set_xticklabels(df_plot['baseline'], rotation=30, ha='right', fontsize=9)
        ax.grid(True, linestyle='--', alpha=0.4)
        
        # Add labels on top of the bars
        for bar in bars:
            height = bar.get_height()
            ax.annotate(f'{height:.3f}',
                        xy=(bar.get_x() + bar.get_width() / 2, height),
                        xytext=(0, 3),  # 3 points vertical offset
                        textcoords="offset points",
                        ha='center', va='bottom', fontsize=8)

plt.tight_layout()
for d in [OUTPUT_DIR, WORKSPACE_OUTPUT_DIR, DOCS_IMAGE_DIR, LOCAL_DIR]:
    os.makedirs(d, exist_ok=True)
    plt.savefig(os.path.join(d, 'loco_baseline_comparison.png'), dpi=150)
print("Saved LOCO baseline comparison plot to: loco_baseline_comparison.png")
print("\nValidation pipeline execution completed successfully!")
