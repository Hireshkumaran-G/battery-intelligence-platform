import os
import h5py
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.stats import pearsonr
from pathlib import Path
from tqdm import tqdm

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
MAT_PATH = os.path.join(PROJECT_ROOT, 'data', 'raw', 'severson_mat', 'batch_1.mat')
PLOTS_DIR = os.path.join(BIP_DIR, 'classification_artifacts')
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

os.makedirs(PLOTS_DIR, exist_ok=True)

print(f"Loading Severson LFP dataset from {MAT_PATH}...")

# Parameters
num_cells_to_process = 8
poly_orders = [3, 4, 5]

print("\n" + "="*70)
print("SEVERSON LFP CHEMISTRY DYNAMIC RIPPLE CORRELATION ANALYSIS")
print("="*70)

all_results = {}

with h5py.File(MAT_PATH, "r") as f:
    batch = f["batch"]
    n_cells = batch["summary"].shape[0]
    
    # Process the first 8 cells
    for i in tqdm(range(min(num_cells_to_process, n_cells)), desc="Processing Cells"):
        cell_id = f"Cell_{i}"
        
        summary_ref = batch["summary"][i, 0]
        cycles_ref = batch["cycles"][i, 0]
        
        summary_group = f[summary_ref]
        cycles_group = f[cycles_ref]
        
        # Load summary DataFrame
        summary_data = {key: np.asarray(summary_group[key][()]).squeeze() for key in summary_group.keys()}
        summary_df = pd.DataFrame(summary_data)
        
        n_cycles = len(summary_df)
        
        capacities = []
        ripple_rms = {order: [] for order in poly_orders}
        snrs = {order: [] for order in poly_orders}
        valid_cycles = []
        
        # Loop over cycles
        for cycle_idx in range(n_cycles):
            # Check capacity in summary
            if cycle_idx >= len(summary_df) or pd.isna(summary_df["QDischarge"].iloc[cycle_idx]):
                continue
                
            cap_val = summary_df["QDischarge"].iloc[cycle_idx]
            if cap_val < 0.2: # Nominal is ~1.1 Ah
                continue
                
            try:
                t_ref = cycles_group["t"][cycle_idx, 0]
                v_ref = cycles_group["V"][cycle_idx, 0]
                i_ref = cycles_group["I"][cycle_idx, 0]
                
                time_arr = np.asarray(f[t_ref][()]).squeeze()
                voltage_arr = np.asarray(f[v_ref][()]).squeeze()
                current_arr = np.asarray(f[i_ref][()]).squeeze()
                
                min_len = min(len(time_arr), len(voltage_arr), len(current_arr))
                if min_len < 50:
                    continue
                    
                time_arr = time_arr[:min_len]
                voltage_arr = voltage_arr[:min_len]
                current_arr = current_arr[:min_len]
                
                # Isolate Constant-Current Discharge (current < -0.5 A)
                discharge_mask = current_arr < -0.5
                if np.sum(discharge_mask) < 20:
                    continue
                    
                v = voltage_arr[discharge_mask]
                t = time_arr[discharge_mask]
                
                # Stabilize time starting at 0 (seconds)
                t_sec = t - t[0]
                
                # Filter out transient phases at start and end of discharge if needed
                # (Keep middle 80% to avoid edge effects)
                n_samples = len(v)
                start_idx = int(0.1 * n_samples)
                end_idx = int(0.9 * n_samples)
                if (end_idx - start_idx) < 20:
                    continue
                    
                v_stable = v[start_idx:end_idx]
                t_stable = t_sec[start_idx:end_idx]
                
                capacities.append(cap_val)
                valid_cycles.append(cycle_idx)
                
                for order in poly_orders:
                    coefs = np.polyfit(t_stable, v_stable, order)
                    v_trend = np.polyval(coefs, t_stable)
                    v_ripple = v_stable - v_trend
                    
                    r_rms = np.sqrt(np.mean(v_ripple ** 2))
                    ripple_rms[order].append(r_rms)
                    
                    p_trend = np.mean(v_trend ** 2)
                    p_ripple = np.mean(v_ripple ** 2)
                    snr = 10 * np.log10(p_trend / p_ripple)
                    snrs[order].append(snr)
                    
            except Exception as e:
                continue
                
        if len(capacities) < 10:
            print(f"  Skipping {cell_id} due to insufficient valid cycles ({len(capacities)})")
            continue
            
        df = pd.DataFrame({'cycle': valid_cycles, 'capacity': capacities})
        for order in poly_orders:
            df[f'ripple_rms_deg{order}'] = ripple_rms[order]
            df[f'snr_deg{order}'] = snrs[order]
            
            # Normalize to the first cycle
            first_val = df[f'ripple_rms_deg{order}'].iloc[0]
            df[f'ripple_norm_deg{order}'] = df[f'ripple_rms_deg{order}'] / first_val
            
        # Analyze correlations
        print(f"\n{cell_id} Results:")
        print(f"  Valid cycles found: {len(df)}")
        cell_corrs = {}
        for order in poly_orders:
            r_val, p_val = pearsonr(df[f'ripple_norm_deg{order}'], df['capacity'])
            mean_snr = df[f'snr_deg{order}'].mean()
            cell_corrs[order] = (r_val, p_val, mean_snr)
            print(f"    Degree {order}: r = {r_val:.4f} (p = {p_val:.2e}) | SNR = {mean_snr:.2f} dB")
            
        all_results[cell_id] = (df, cell_corrs)

print("="*70 + "\n")

# Plot results for all processed cells for the best polynomial degree (Degree 4)
fig, axs = plt.subplots(4, 2, figsize=(15, 20))
axs = axs.flatten()

best_order = 4

for idx in range(num_cells_to_process):
    cell_id = f"Cell_{idx}"
    ax = axs[idx]
    
    if cell_id not in all_results:
        ax.text(0.5, 0.5, f"{cell_id} Data Missing", ha='center', va='center')
        continue
        
    df, corrs = all_results[cell_id]
    r_val, p_val, snr = corrs[best_order]
    
    # Plot Capacity vs. Normalized Ripple
    scatter = ax.scatter(df[f'ripple_norm_deg{best_order}'], df['capacity'], c=df['cycle'], cmap='viridis', label='Cycles')
    
    # Fit regression line
    slope, intercept = np.polyfit(df[f'ripple_norm_deg{best_order}'], df['capacity'], 1)
    x_vals = np.linspace(df[f'ripple_norm_deg{best_order}'].min(), df[f'ripple_norm_deg{best_order}'].max(), 100)
    y_vals = slope * x_vals + intercept
    ax.plot(x_vals, y_vals, 'r--', label=f'Linear Fit (r = {r_val:.3f})')
    
    ax.set_title(f"{cell_id} LFP (r = {r_val:.3f}, SNR = {snr:.1f} dB)")
    ax.set_xlabel('Normalized Ripple RMS')
    ax.set_ylabel('Discharge Capacity (Ah)')
    ax.grid(True)
    ax.legend()
    
    if idx == 0:
        cbar = plt.colorbar(scatter, ax=ax)
        cbar.set_label('Cycle Number')

plt.tight_layout()
plot_paths = [
    os.path.join(PLOTS_DIR, 'lfp_verification.png'),
    os.path.join(os.path.dirname(PLOTS_DIR), 'docs', 'image', 'lfp_verification.png')
]
for p in plot_paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    plt.savefig(p, dpi=150)
    print(f"Verification plot for LFP saved successfully to {p}")
try:
    import shutil
    shutil.copy2(plot_paths[0], os.path.join(LOCAL_DIR, 'lfp_verification.png'))
    print(f"Copied verification plot to: {os.path.join(LOCAL_DIR, 'lfp_verification.png')}")
except Exception:
    pass
