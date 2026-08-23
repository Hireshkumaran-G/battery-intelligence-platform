import os
import scipy.io
import numpy as np
import pandas as pd
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

MAT_PATH = os.path.join(PROJECT_ROOT, 'data', 'raw', 'Oxford_Battery_Degradation_Dataset_1.mat')
PLOTS_DIR = os.path.join(PROJECT_ROOT, 'bip', 'classification_artifacts')

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

print(f"Loading Oxford NMC dataset from {MAT_PATH}...")
mat = scipy.io.loadmat(MAT_PATH)

cell_names = [f'Cell{i}' for i in range(1, 9)]
poly_orders = [3, 4, 5]

print("\n" + "="*70)
print("OXFORD NMC CHEMISTRY DYNAMIC RIPPLE CORRELATION ANALYSIS")
print("="*70)

all_results = {}

for cell_name in cell_names:
    print(f"Processing {cell_name}...")
    cell_data = mat[cell_name][0, 0]
    
    # List and sort all cycle keys
    cycle_keys = sorted([name for name in cell_data.dtype.names if name.startswith('cyc')], 
                        key=lambda x: int(x[3:]))
    
    capacities = []
    ripple_rms = {order: [] for order in poly_orders}
    snrs = {order: [] for order in poly_orders}
    valid_cycles = []
    
    for cycle_key in cycle_keys:
        cycle_struct = cell_data[cycle_key][0, 0]
        
        # Check if C1dc exists in this cycle
        if 'C1dc' not in cycle_struct.dtype.names:
            continue
            
        dc_struct = cycle_struct['C1dc'][0, 0]
        v = dc_struct['v'].flatten()
        t = dc_struct['t'].flatten()
        q = dc_struct['q'].flatten()
        
        # q goes from 0 down to -capacity. Calculate capacity in Ah
        cap_val = (np.max(q) - np.min(q)) / 1000.0 # Convert mAh to Ah
        
        # Ensure capacity is reasonable (greater than 0.2 Ah, nominal is 0.74 Ah)
        if cap_val < 0.2:
            continue
            
        capacities.append(cap_val)
        valid_cycles.append(int(cycle_key[3:]))
        
        # Convert MATLAB serial date to seconds starting at 0
        t_sec = (t - t[0]) * 24.0 * 3600.0
        
        for order in poly_orders:
            # Fit polynomial trend to voltage curve over stabilized time vector
            coefs = np.polyfit(t_sec, v, order)
            v_trend = np.polyval(coefs, t_sec)
            v_ripple = v - v_trend
            
            r_rms = np.sqrt(np.mean(v_ripple ** 2))
            ripple_rms[order].append(r_rms)
            
            p_trend = np.mean(v_trend ** 2)
            p_ripple = np.mean(v_ripple ** 2)
            snr = 10 * np.log10(p_trend / p_ripple)
            snrs[order].append(snr)
            
    if len(capacities) < 10:
        print(f"  Skipping {cell_name} due to insufficient valid cycles ({len(capacities)})")
        continue
        
    df = pd.DataFrame({'cycle': valid_cycles, 'capacity': capacities})
    for order in poly_orders:
        df[f'ripple_rms_deg{order}'] = ripple_rms[order]
        df[f'snr_deg{order}'] = snrs[order]
        
        # Normalize to the first cycle
        first_val = df[f'ripple_rms_deg{order}'].iloc[0]
        df[f'ripple_norm_deg{order}'] = df[f'ripple_rms_deg{order}'] / first_val
        
    # Analyze correlations
    print(f"  Valid cycles found: {len(df)}")
    cell_corrs = {}
    for order in poly_orders:
        r_val, p_val = pearsonr(df[f'ripple_norm_deg{order}'], df['capacity'])
        mean_snr = df[f'snr_deg{order}'].mean()
        cell_corrs[order] = (r_val, p_val, mean_snr)
        print(f"    Degree {order}: r = {r_val:.4f} (p = {p_val:.2e}) | SNR = {mean_snr:.2f} dB")
        
    all_results[cell_name] = (df, cell_corrs)

print("="*70 + "\n")

# Plot results for Cell1 to Cell8 for the best polynomial degree (Degree 4)
fig, axs = plt.subplots(4, 2, figsize=(15, 20))
axs = axs.flatten()

best_order = 4

for idx, cell_name in enumerate(cell_names):
    if cell_name not in all_results:
        axs[idx].text(0.5, 0.5, f"{cell_name} Data Missing", ha='center', va='center')
        continue
        
    df, corrs = all_results[cell_name]
    r_val, p_val, snr = corrs[best_order]
    
    # Plot Capacity vs. Normalized Ripple
    ax = axs[idx]
    scatter = ax.scatter(df[f'ripple_norm_deg{best_order}'], df['capacity'], c=df['cycle'], cmap='plasma', label='Cycles')
    
    # Fit regression line
    slope, intercept = np.polyfit(df[f'ripple_norm_deg{best_order}'], df['capacity'], 1)
    x_vals = np.linspace(df[f'ripple_norm_deg{best_order}'].min(), df[f'ripple_norm_deg{best_order}'].max(), 100)
    y_vals = slope * x_vals + intercept
    ax.plot(x_vals, y_vals, 'r--', label=f'Linear Fit (r = {r_val:.3f})')
    
    ax.set_title(f"{cell_name} NMC (r = {r_val:.3f}, SNR = {snr:.1f} dB)")
    ax.set_xlabel('Normalized Ripple RMS')
    ax.set_ylabel('Discharge Capacity (Ah)')
    ax.grid(True)
    ax.legend()
    
    if idx == 0:
        cbar = plt.colorbar(scatter, ax=ax)
        cbar.set_label('Cycle Number')

plt.tight_layout()
plot_paths = [
    os.path.join(PLOTS_DIR, 'nmc_verification.png'),
    os.path.join(os.path.dirname(PLOTS_DIR), 'docs', 'image', 'nmc_verification.png')
]
for p in plot_paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    plt.savefig(p, dpi=150)
    print(f"Verification plot for NMC saved successfully to {p}")
try:
    import shutil
    shutil.copy2(plot_paths[0], os.path.join(LOCAL_DIR, 'nmc_verification.png'))
    print(f"Copied verification plot to: {os.path.join(LOCAL_DIR, 'nmc_verification.png')}")
except Exception:
    pass
