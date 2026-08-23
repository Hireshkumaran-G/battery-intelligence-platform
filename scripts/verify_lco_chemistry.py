import os
import urllib.request
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

DATA_DIR = os.path.join(PROJECT_ROOT, 'data', 'raw')
MAT_PATH = os.path.join(DATA_DIR, 'B0005.mat')
URL = 'https://github.com/anirudhkhatry/SOH-prediction-using-NASA-Dataset/raw/master/B0005.mat'
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

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(PLOTS_DIR, exist_ok=True)

if not os.path.exists(MAT_PATH):
    print(f"Downloading NASA Ames LCO dataset (B0005.mat) from {URL}...")
    try:
        urllib.request.urlretrieve(URL, MAT_PATH)
        print("Download complete.")
    except Exception as e:
        print(f"Failed to download from GitHub mirror: {e}")
        # Try local temp path as backup if it was downloaded previously
        TEMP_PATH = '/tmp/B0005_test.mat'
        if os.path.exists(TEMP_PATH) and os.path.getsize(TEMP_PATH) > 10 * 1024 * 1024:
            print("Copying from local /tmp backup...")
            import shutil
            shutil.copy(TEMP_PATH, MAT_PATH)
        else:
            raise RuntimeError("Could not retrieve dataset.")

# 2. Load and inspect
print(f"Loading LCO battery dataset from {MAT_PATH}...")
mat = scipy.io.loadmat(MAT_PATH)
cycle_array = mat['B0005'][0, 0]['cycle']
n_cycles = cycle_array.shape[1]
print(f"Loaded {n_cycles} cycles.")

# 3. Extract discharge cycles
discharge_cycles = []
capacities = []
cycle_indices = []

for c_idx in range(n_cycles):
    cycle = cycle_array[0, c_idx]
    c_type = cycle['type'][0]
    if c_type == 'discharge':
        cycle_data = cycle['data']
        # Check if Capacity is present (some late cycles might miss it or have empty arrays)
        if 'Capacity' in cycle_data.dtype.names:
            cap_val = cycle_data['Capacity'][0, 0]
            if cap_val.size > 0:
                capacities.append(cap_val[0, 0])
                discharge_cycles.append(cycle)
                cycle_indices.append(c_idx + 1) # 1-based cycle index

n_discharge = len(discharge_cycles)
print(f"Found {n_discharge} discharge cycles with capacity measurements.")

# 4. Perform dynamic ripple extraction with different polynomial orders
poly_orders = [3, 4, 5]
results = {order: [] for order in poly_orders}
snrs = {order: [] for order in poly_orders}

for c_idx, cycle in enumerate(discharge_cycles):
    cycle_data = cycle['data']
    v = cycle_data['Voltage_measured'][0, 0].flatten()
    i = cycle_data['Current_measured'][0, 0].flatten()
    t = cycle_data['Time'][0, 0].flatten()
    
    # Isolate constant current discharge part
    # Under discharge, current is negative (around -2A). Ignore transient startup/end.
    cc_idx = np.where(i < -0.5)[0]
    
    if len(cc_idx) < 10:
        # If no valid CC discharge points found, skip this cycle
        for order in poly_orders:
            results[order].append(np.nan)
            snrs[order].append(np.nan)
        continue
        
    v_cc = v[cc_idx]
    t_cc = t[cc_idx]
    
    for order in poly_orders:
        # Fit polynomial trend to sloping discharge voltage curve
        coefs = np.polyfit(t_cc, v_cc, order)
        v_trend = np.polyval(coefs, t_cc)
        v_ripple = v_cc - v_trend
        
        r_rms = np.sqrt(np.mean(v_ripple ** 2))
        results[order].append(r_rms)
        
        p_trend = np.mean(v_trend ** 2)
        p_ripple = np.mean(v_ripple ** 2)
        snr = 10 * np.log10(p_trend / p_ripple)
        snrs[order].append(snr)

# Convert to DataFrame
df = pd.DataFrame({'cycle': cycle_indices, 'capacity': capacities})
for order in poly_orders:
    df[f'ripple_rms_deg{order}'] = results[order]
    df[f'snr_deg{order}'] = snrs[order]

# Drop any rows with NaN values
df = df.dropna().reset_index(drop=True)
n_valid = len(df)
print(f"Processed {n_valid} valid cycles after removing NaNs.")

# Normalize ripple RMS to cycle 1 (the first valid discharge cycle)
for order in poly_orders:
    first_val = df[f'ripple_rms_deg{order}'].iloc[0]
    df[f'ripple_norm_deg{order}'] = df[f'ripple_rms_deg{order}'] / first_val

# 5. Correlation analysis with Capacity
print("\n" + "="*50)
print("LCO CHEMISTRY DYNAMIC RIPPLE CORRELATION ANALYSIS")
print("="*50)
for order in poly_orders:
    r_val, p_val = pearsonr(df[f'ripple_norm_deg{order}'], df['capacity'])
    mean_snr = df[f'snr_deg{order}'].mean()
    print(f"Polynomial Degree {order}:")
    print(f"  - Pearson Correlation (r) with Capacity: {r_val:.4f} (p-value: {p_val:.2e})")
    print(f"  - Average Signal-to-Noise Ratio (SNR):  {mean_snr:.2f} dB")
print("="*50 + "\n")

# 6. Generate and save diagnostic plots
fig, axs = plt.subplots(3, 1, figsize=(10, 12))

# Subplot 1: Capacity degradation
axs[0].plot(df['cycle'], df['capacity'], 'b-', label='Discharge Capacity (Ah)')
axs[0].set_title('LCO (NASA B0005) Capacity Degradation')
axs[0].set_xlabel('Cycle Number')
axs[0].set_ylabel('Capacity (Ah)')
axs[0].grid(True)
axs[0].legend()

# Subplot 2: Normalized Ripple RMS for different degrees
colors = ['red', 'green', 'purple']
for idx, order in enumerate(poly_orders):
    axs[1].plot(df['cycle'], df[f'ripple_norm_deg{order}'], color=colors[idx], 
                label=f'Normalized Ripple (Poly Order {order})')
axs[1].set_title('Normalized Ripple RMS Over Lifecycle')
axs[1].set_xlabel('Cycle Number')
axs[1].set_ylabel('Normalized Ripple RMS (relative to Cycle 1)')
axs[1].grid(True)
axs[1].legend()

# Subplot 3: Scatter plot for best performing poly order (typically 4 or 5)
best_order = 4 # We select degree 4 for LCO due to the sloping curve
r_best, p_best = pearsonr(df[f'ripple_norm_deg{best_order}'], df['capacity'])
axs[2].scatter(df[f'ripple_norm_deg{best_order}'], df['capacity'], c=df['cycle'], cmap='viridis', label='Discharge Cycles')
# Fit a regression line
slope, intercept = np.polyfit(df[f'ripple_norm_deg{best_order}'], df['capacity'], 1)
x_vals = np.linspace(df[f'ripple_norm_deg{best_order}'].min(), df[f'ripple_norm_deg{best_order}'].max(), 100)
y_vals = slope * x_vals + intercept
axs[2].plot(x_vals, y_vals, 'r--', label=f'Linear Fit (r = {r_best:.4f})')
axs[2].set_title(f'Capacity vs. Normalized Ripple (Degree {best_order})')
axs[2].set_xlabel('Normalized Ripple RMS')
axs[2].set_ylabel('Discharge Capacity (Ah)')
cbar = plt.colorbar(axs[2].collections[0], ax=axs[2])
cbar.set_label('Cycle Number')
axs[2].grid(True)
axs[2].legend()

plt.tight_layout()
plot_paths = [
    os.path.join(PLOTS_DIR, 'lco_verification.png'),
    os.path.join(os.path.dirname(PLOTS_DIR), 'docs', 'image', 'lco_verification.png')
]
for p in plot_paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    plt.savefig(p, dpi=150)
    print(f"Verification plot saved successfully to {p}")
try:
    import shutil
    shutil.copy2(plot_paths[0], os.path.join(LOCAL_DIR, 'lco_verification.png'))
    print(f"Copied verification plot to: {os.path.join(LOCAL_DIR, 'lco_verification.png')}")
except Exception:
    pass
