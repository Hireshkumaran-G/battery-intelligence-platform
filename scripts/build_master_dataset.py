import os
import urllib.request
import scipy.io
import h5py
import numpy as np
import pandas as pd
from scipy.stats import pearsonr
from scipy.signal import savgol_filter
from pathlib import Path
from tqdm import tqdm

# Setup paths
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
DATA_DIR = os.path.join(PROJECT_ROOT, 'data', 'raw')
OUTPUT_DIR = os.path.join(BIP_DIR, 'classification_artifacts')
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# LCO Files to download if not present
LCO_CELLS = ['B0005', 'B0006', 'B0007', 'B0018']
LCO_URLS = {
    cell: f'https://github.com/anirudhkhatry/SOH-prediction-using-NASA-Dataset/raw/master/{cell}.mat'
    for cell in LCO_CELLS
}

# Ensure LCO files exist
for cell, url in LCO_URLS.items():
    dest = os.path.join(DATA_DIR, f'{cell}.mat')
    if not os.path.exists(dest):
        print(f"Downloading LCO cell {cell} from {url}...")
        try:
            urllib.request.urlretrieve(url, dest)
            print(f"Downloaded {cell}.mat successfully.")
        except Exception as e:
            print(f"Failed to download {cell}.mat: {e}")

# Helper functions for features
def compute_skewness(x):
    mean = np.mean(x)
    std = np.std(x)
    if std == 0:
        return 0.0
    return float(np.mean(((x - mean) / std) ** 3))

def compute_kurtosis(x):
    mean = np.mean(x)
    std = np.std(x)
    if std == 0:
        return 0.0
    return float(np.mean(((x - mean) / std) ** 4) - 3.0)

def compute_spectral_features(x, fs=1.0):
    n = len(x)
    if n < 4:
        return 0.0, 0.0, 0.0
    # FFT
    fft_vals = np.fft.rfft(x - np.mean(x))
    freqs = np.fft.rfftfreq(n, d=1.0/fs)
    mags = np.abs(fft_vals)
    power = mags ** 2
    
    total_power = np.sum(power)
    if total_power <= 0:
        return freqs[0], 0.0, 0.0
        
    dom_idx = np.argmax(mags)
    norm_power = power / total_power
    norm_power = norm_power[norm_power > 0]
    spectral_entropy = -np.sum(norm_power * np.log2(norm_power))
    
    return float(freqs[dom_idx]), float(total_power), float(spectral_entropy)

def compute_legacy_ripple(v):
    # Interpolate to 100 points
    xp = np.linspace(0.0, 1.0, len(v))
    x_new = np.linspace(0.0, 1.0, 100)
    v_interp = np.interp(x_new, xp, v)
    
    dv1 = np.diff(v_interp)
    dv2 = np.diff(dv1)
    
    def trapz_uniform(y, dx):
        if len(y) < 2:
            return 0.0
        return float(dx * (np.sum(y) - 0.5 * (y[0] + y[-1])))
        
    d1_ripple = trapz_uniform(np.abs(dv1), 1.0/99.0)
    d2_ripple = trapz_uniform(np.abs(dv2), 1.0/98.0)
    
    sig_pow = float(np.mean(v_interp**2))
    noise_pow = float(np.var(v_interp))
    snr_db = float(10.0 * np.log10(sig_pow / noise_pow)) if noise_pow > 0 and sig_pow > 0 else 0.0
    
    return d1_ripple, d2_ripple, snr_db

print("Starting unified master dataset compilation...")

master_records = []

# =====================================================================
# --- 1. LFP (Severson) Dataset ---
# =====================================================================
LFP_MAT = os.path.join(DATA_DIR, 'severson_mat/batch_1.mat')
if os.path.exists(LFP_MAT):
    print("Processing LFP (Severson) chemistry...")
    with h5py.File(LFP_MAT, "r") as f:
        batch = f["batch"]
        n_cells = batch["summary"].shape[0]
        
        for i in tqdm(range(min(8, n_cells)), desc="LFP Cells"):
            cell_id = f"LFP_Cell_{i}"
            
            summary_ref = batch["summary"][i, 0]
            cycles_ref = batch["cycles"][i, 0]
            
            summary_group = f[summary_ref]
            cycles_group = f[cycles_ref]
            
            summary_data = {key: np.asarray(summary_group[key][()]).squeeze() for key in summary_group.keys()}
            summary_df = pd.DataFrame(summary_data)
            
            # Initial capacity and EOL definition
            valid_caps = summary_df["QDischarge"].to_numpy()
            positive_caps = valid_caps[valid_caps > 0.5]
            if len(positive_caps) == 0:
                continue
            ref_cap = np.max(positive_caps[:10]) if len(positive_caps) >= 10 else positive_caps[0]
            
            # Find 80% EOL cycle
            eol_cycle = None
            eol_observed = 0
            for cyc_idx, cap in enumerate(valid_caps):
                if ref_cap > 0:
                    soh_val = cap / ref_cap
                else:
                    soh_val = 0.0
                if soh_val > 0.1 and soh_val <= 0.80:
                    eol_cycle = cyc_idx
                    eol_observed = 1
                    break
            
            # Process cycles
            for cyc_idx in range(len(summary_df)):
                cap = summary_df["QDischarge"].iloc[cyc_idx]
                if cap < 0.2: # Invalid
                    continue
                
                try:
                    t_ref = cycles_group["t"][cyc_idx, 0]
                    v_ref = cycles_group["V"][cyc_idx, 0]
                    i_ref = cycles_group["I"][cyc_idx, 0]
                    temp_ref = cycles_group["T"][cyc_idx, 0]
                    
                    t_arr = np.asarray(f[t_ref][()]).squeeze()
                    v_arr = np.asarray(f[v_ref][()]).squeeze()
                    i_arr = np.asarray(f[i_ref][()]).squeeze()
                    temp_arr = np.asarray(f[temp_ref][()]).squeeze()
                    
                    min_len = min(len(t_arr), len(v_arr), len(i_arr), len(temp_arr))
                    if min_len < 40:
                        continue
                        
                    t_arr, v_arr, i_arr, temp_arr = t_arr[:min_len], v_arr[:min_len], i_arr[:min_len], temp_arr[:min_len]
                    
                    # Discharge: current < -0.5 A
                    dc_mask = i_arr < -0.5
                    if np.sum(dc_mask) < 20:
                        continue
                    
                    v_dc = v_arr[dc_mask]
                    t_dc = t_arr[dc_mask]
                    i_dc = i_arr[dc_mask]
                    temp_dc = temp_arr[dc_mask]
                    
                    # Middle 80%
                    n_samples = len(v_dc)
                    s_idx, e_idx = int(0.1 * n_samples), int(0.9 * n_samples)
                    if (e_idx - s_idx) < 20:
                        continue
                        
                    v_stable = v_dc[s_idx:e_idx]
                    t_stable = t_dc[s_idx:e_idx] - t_dc[s_idx]
                    i_stable = i_dc[s_idx:e_idx]
                    temp_stable = temp_dc[s_idx:e_idx]
                    
                    soh = cap / ref_cap

                    # RUL calculation — proper right-censoring
                    # If EOL was never observed the cell was still alive at test end;
                    # its RUL is unknown (censored), NOT "last cycle - current cycle".
                    if eol_observed:
                        rul          = eol_cycle - cyc_idx
                        rul_censored = 0
                    else:
                        rul          = np.nan   # censored
                        rul_censored = 1
                    
                    # Voltage statistics (B1)
                    v_mean = np.mean(v_stable)
                    v_std = np.std(v_stable)
                    v_min = np.min(v_stable)
                    v_max = np.max(v_stable)
                    v_skew = compute_skewness(v_stable)
                    v_kurt = compute_kurtosis(v_stable)
                    
                    # Conventional statistics (B2)
                    c_mean = np.mean(i_stable)
                    c_std = np.std(i_stable)
                    temp_mean = np.mean(temp_stable)
                    temp_std = np.std(temp_stable)
                    dc_duration = t_dc[-1] - t_dc[0]
                    charge_time = summary_df["charge_time_s"].iloc[cyc_idx] if "charge_time_s" in summary_df.columns else 0.0
                    
                    # Legacy & Spectral Features
                    d1_rip, d2_rip, snr_db = compute_legacy_ripple(v_stable)
                    dom_f, fft_e, spec_ent = compute_spectral_features(v_stable)
                    
                    record = {
                        'chemistry': 'LFP',
                        'cell_id': cell_id,
                        'cycle_index': cyc_idx,
                        'capacity_ah': cap,
                        'soh': soh,
                        'eol_observed': eol_observed,
                        'rul': rul,
                        'rul_censored': rul_censored,
                        'voltage_mean': v_mean,
                        'voltage_std': v_std,
                        'voltage_min': v_min,
                        'voltage_max': v_max,
                        'voltage_skewness': v_skew,
                        'voltage_kurtosis': v_kurt,
                        'current_mean': c_mean,
                        'current_std': c_std,
                        'temperature_mean': temp_mean,
                        'temperature_std': temp_std,
                        'discharge_duration_s': dc_duration,
                        'charge_time_s': charge_time,
                        'D1_ripple': d1_rip,
                        'D2_ripple': d2_rip,
                        'snr_dB': snr_db,
                        'dominant_frequency': dom_f,
                        'fft_energy': fft_e,
                        'spectral_entropy': spec_ent
                    }
                    
                    # Polynomial Order Study (Degrees 1 to 6)
                    for order in range(1, 7):
                        coefs = np.polyfit(t_stable, v_stable, order)
                        v_trend = np.polyval(coefs, t_stable)
                        v_ripple = v_stable - v_trend
                        
                        rip_rms = np.sqrt(np.mean(v_ripple ** 2))
                        p_trend = np.mean(v_trend ** 2)
                        p_ripple = np.mean(v_ripple ** 2)
                        snr_val = 10 * np.log10(p_trend / p_ripple) if p_ripple > 0 else 0.0
                        
                        record[f'ripple_rms_deg{order}'] = rip_rms
                        record[f'ripple_norm_deg{order}'] = rip_rms / v_mean if v_mean > 0 else 0.0
                        record[f'snr_deg{order}'] = snr_val
                        
                    master_records.append(record)
                except Exception as e:
                    continue
else:
    print(f"WARNING: LFP dataset file not found at {LFP_MAT}.")

# =====================================================================
# --- 2. NMC (Oxford) Dataset ---
# =====================================================================
NMC_MAT = os.path.join(DATA_DIR, 'Oxford_Battery_Degradation_Dataset_1.mat')
if os.path.exists(NMC_MAT):
    print("Processing NMC (Oxford) chemistry...")
    try:
        mat = scipy.io.loadmat(NMC_MAT)
        
        # Oxford dataset contains Cell1 to Cell8
        for cell_idx in tqdm(range(1, 9), desc="NMC Cells"):
            cell_name = f"Cell{cell_idx}"
            cell_id = f"NMC_Cell_{cell_idx}"
            
            if cell_name not in mat:
                print(f"Cell {cell_name} not in mat keys: {mat.keys()}")
                continue
                
            cell_data = mat[cell_name][0, 0]
            
            # List and sort all cycle keys
            cycle_keys = sorted([name for name in cell_data.dtype.names if name.startswith('cyc')], 
                                key=lambda x: int(x[3:]))
            print(f"Cell {cell_name}: found {len(cycle_keys)} cycle keys.")
            
            capacities = []
            valid_cycles = []
            
            for cycle_key in cycle_keys:
                cycle_struct = cell_data[cycle_key][0, 0]
                if 'C1dc' not in cycle_struct.dtype.names:
                    continue
                dc_struct = cycle_struct['C1dc'][0, 0]
                q = dc_struct['q'].flatten()
                cap_val = (np.max(q) - np.min(q)) / 1000.0 # Convert mAh to Ah
                if cap_val < 0.2:
                    continue
                capacities.append(cap_val)
                valid_cycles.append((int(cycle_key[3:]), cycle_key))
                
            if not capacities:
                continue
                
            ref_cap = capacities[0]
            
            # EOL definition
            eol_cycle = None
            eol_observed = 0
            for idx_c, cap in enumerate(capacities):
                soh_val = cap / ref_cap
                if soh_val <= 0.80:
                    eol_cycle = valid_cycles[idx_c][0]
                    eol_observed = 1
                    break
            
            # Process cycles
            for idx_c, (c, cycle_key) in enumerate(valid_cycles):
                cap = capacities[idx_c]
                soh = cap / ref_cap
                
                try:
                    cycle_struct = cell_data[cycle_key][0, 0]
                    dc_struct = cycle_struct['C1dc'][0, 0]
                    
                    v_arr = dc_struct['v'].flatten()
                    t_days = dc_struct['t'].flatten()
                    temp_arr = dc_struct['T'].flatten()
                    
                    # Convert MATLAB serial date to seconds starting at 0
                    t_sec = (t_days - t_days[0]) * 86400.0
                    
                    min_len = min(len(t_sec), len(v_arr), len(temp_arr))
                    if min_len < 30:
                        continue
                        
                    t_sec, v_arr, temp_arr = t_sec[:min_len], v_arr[:min_len], temp_arr[:min_len]
                    
                    # Current is nominally -1C (approx -0.74A)
                    i_arr = np.full_like(v_arr, -0.74)
                    
                    # Middle 80%
                    n_samples = len(v_arr)
                    s_idx, e_idx = int(0.1 * n_samples), int(0.9 * n_samples)
                    if (e_idx - s_idx) < 20:
                        continue
                        
                    v_stable = v_arr[s_idx:e_idx]
                    t_stable = t_sec[s_idx:e_idx] - t_sec[s_idx]
                    i_stable = i_arr[s_idx:e_idx]
                    temp_stable = temp_arr[s_idx:e_idx]
                    
                    # RUL — proper right-censoring
                    if eol_observed:
                        rul          = eol_cycle - c
                        rul_censored = 0
                    else:
                        rul          = np.nan
                        rul_censored = 1
                        
                    # Voltage stats (B1)
                    v_mean = np.mean(v_stable)
                    v_std = np.std(v_stable)
                    v_min = np.min(v_stable)
                    v_max = np.max(v_stable)
                    v_skew = compute_skewness(v_stable)
                    v_kurt = compute_kurtosis(v_stable)
                    
                    # Conventional stats (B2)
                    c_mean = np.mean(i_stable)
                    c_std = np.std(i_stable)
                    temp_mean = np.mean(temp_stable)
                    temp_std = np.std(temp_stable)
                    dc_duration = t_stable[-1] - t_stable[0]
                    charge_time = 3600.0
                    
                    # Legacy & Spectral
                    d1_rip, d2_rip, snr_db = compute_legacy_ripple(v_stable)
                    dom_f, fft_e, spec_ent = compute_spectral_features(v_stable)
                    
                    record = {
                        'chemistry': 'NMC',
                        'cell_id': cell_id,
                        'cycle_index': c,
                        'capacity_ah': cap,
                        'soh': soh,
                        'eol_observed': eol_observed,
                        'rul': rul,
                        'rul_censored': rul_censored,
                        'voltage_mean': v_mean,
                        'voltage_std': v_std,
                        'voltage_min': v_min,
                        'voltage_max': v_max,
                        'voltage_skewness': v_skew,
                        'voltage_kurtosis': v_kurt,
                        'current_mean': c_mean,
                        'current_std': c_std,
                        'temperature_mean': temp_mean,
                        'temperature_std': temp_std,
                        'discharge_duration_s': dc_duration,
                        'charge_time_s': charge_time,
                        'D1_ripple': d1_rip,
                        'D2_ripple': d2_rip,
                        'snr_dB': snr_db,
                        'dominant_frequency': dom_f,
                        'fft_energy': fft_e,
                        'spectral_entropy': spec_ent
                    }
                    
                    # Poly orders
                    for order in range(1, 7):
                        coefs = np.polyfit(t_stable, v_stable, order)
                        v_trend = np.polyval(coefs, t_stable)
                        v_ripple = v_stable - v_trend
                        
                        rip_rms = np.sqrt(np.mean(v_ripple ** 2))
                        p_trend = np.mean(v_trend ** 2)
                        p_ripple = np.mean(v_ripple ** 2)
                        snr_val = 10 * np.log10(p_trend / p_ripple) if p_ripple > 0 else 0.0
                        
                        record[f'ripple_rms_deg{order}'] = rip_rms
                        record[f'ripple_norm_deg{order}'] = rip_rms / v_mean if v_mean > 0 else 0.0
                        record[f'snr_deg{order}'] = snr_val
                        
                    master_records.append(record)
                except Exception as e:
                    print(f"Error processing NMC Cell {cell_idx} cycle {c}: {e}")
                    continue
    except Exception as e:
        print(f"Error loading NMC dataset: {e}")
else:
    print(f"WARNING: NMC dataset file not found at {NMC_MAT}.")

# =====================================================================
# --- 3. LCO (NASA) Dataset ---
# =====================================================================
print("Processing LCO (NASA Ames) chemistry...")
for cell_name in tqdm(LCO_CELLS, desc="LCO Cells"):
    cell_mat_path = os.path.join(DATA_DIR, f'{cell_name}.mat')
    if not os.path.exists(cell_mat_path):
        print(f"WARNING: LCO cell {cell_name} not available. Skipping.")
        continue
        
    try:
        mat = scipy.io.loadmat(cell_mat_path)
        cycle_array = mat[cell_name][0, 0]['cycle']
        n_cycles = cycle_array.shape[1]
        
        # Extract discharge cycles
        discharge_cycles = []
        capacities = []
        cycle_indices = []
        
        for c_idx in range(n_cycles):
            cycle = cycle_array[0, c_idx]
            c_type = cycle['type'][0]
            if c_type == 'discharge':
                cycle_data = cycle['data']
                if 'Capacity' in cycle_data.dtype.names:
                    cap_val = cycle_data['Capacity'][0, 0]
                    if cap_val.size > 0 and cap_val[0, 0] > 0.2:
                        capacities.append(cap_val[0, 0])
                        discharge_cycles.append(cycle)
                        cycle_indices.append(c_idx + 1)
                        
        if not capacities:
            continue
            
        ref_cap = capacities[0]
        
        # EOL definition
        eol_cycle = None
        eol_observed = 0
        for idx_c, cap in enumerate(capacities):
            soh_val = cap / ref_cap
            if soh_val <= 0.80:
                eol_cycle = cycle_indices[idx_c]
                eol_observed = 1
                break
                
        # Process cycles
        for idx_c, cycle in enumerate(discharge_cycles):
            cap = capacities[idx_c]
            c_idx_actual = cycle_indices[idx_c]
            soh = cap / ref_cap
            
            try:
                cycle_data = cycle['data']
                v_arr = cycle_data['Voltage_measured'][0, 0].flatten()
                i_arr = cycle_data['Current_measured'][0, 0].flatten()
                t_arr = cycle_data['Time'][0, 0].flatten()
                temp_arr = cycle_data['Temperature_measured'][0, 0].flatten()
                
                # Isolate CC discharge (current < -0.5 A)
                dc_mask = i_arr < -0.5
                if np.sum(dc_mask) < 20:
                    continue
                    
                v_dc = v_arr[dc_mask]
                t_dc = t_arr[dc_mask]
                i_dc = i_arr[dc_mask]
                temp_dc = temp_arr[dc_mask]
                
                # Middle 80%
                n_samples = len(v_dc)
                s_idx, e_idx = int(0.1 * n_samples), int(0.9 * n_samples)
                if (e_idx - s_idx) < 20:
                    continue
                    
                v_stable = v_dc[s_idx:e_idx]
                t_stable = t_dc[s_idx:e_idx] - t_dc[s_idx]
                i_stable = i_dc[s_idx:e_idx]
                temp_stable = temp_dc[s_idx:e_idx]
                
                # RUL — proper right-censoring
                if eol_observed:
                    rul          = eol_cycle - c_idx_actual
                    rul_censored = 0
                else:
                    rul          = np.nan
                    rul_censored = 1
                    
                # Voltage stats (B1)
                v_mean = np.mean(v_stable)
                v_std = np.std(v_stable)
                v_min = np.min(v_stable)
                v_max = np.max(v_stable)
                v_skew = compute_skewness(v_stable)
                v_kurt = compute_kurtosis(v_stable)
                
                # Conventional stats (B2)
                c_mean = np.mean(i_stable)
                c_std = np.std(i_stable)
                temp_mean = np.mean(temp_stable)
                temp_std = np.std(temp_stable)
                dc_duration = t_dc[-1] - t_dc[0]
                
                # Search for charge time of preceding cycle in cycle_array
                # (NASA has distinct charge/discharge cycles)
                charge_time = 3600.0 # Default fallback
                if idx_c > 0:
                    # Find preceding charge cycle time
                    for sc in range(c_idx_actual - 2, -1, -1):
                        prev_cycle = cycle_array[0, sc]
                        if prev_cycle['type'][0] == 'charge':
                            c_data = prev_cycle['data']
                            if 'Time' in c_data.dtype.names:
                                t_c = c_data['Time'][0, 0].flatten()
                                if len(t_c) > 0:
                                    charge_time = t_c[-1] - t_c[0]
                                    break
                
                # Legacy & Spectral
                d1_rip, d2_rip, snr_db = compute_legacy_ripple(v_stable)
                dom_f, fft_e, spec_ent = compute_spectral_features(v_stable)
                
                record = {
                    'chemistry': 'LCO',
                    'cell_id': f"LCO_{cell_name}",
                    'cycle_index': c_idx_actual,
                    'capacity_ah': cap,
                    'soh': soh,
                    'eol_observed': eol_observed,
                    'rul': rul,
                    'rul_censored': rul_censored,
                    'voltage_mean': v_mean,
                    'voltage_std': v_std,
                    'voltage_min': v_min,
                    'voltage_max': v_max,
                    'voltage_skewness': v_skew,
                    'voltage_kurtosis': v_kurt,
                    'current_mean': c_mean,
                    'current_std': c_std,
                    'temperature_mean': temp_mean,
                    'temperature_std': temp_std,
                    'discharge_duration_s': dc_duration,
                    'charge_time_s': charge_time,
                    'D1_ripple': d1_rip,
                    'D2_ripple': d2_rip,
                    'snr_dB': snr_db,
                    'dominant_frequency': dom_f,
                    'fft_energy': fft_e,
                    'spectral_entropy': spec_ent
                }
                
                # Poly orders
                for order in range(1, 7):
                    coefs = np.polyfit(t_stable, v_stable, order)
                    v_trend = np.polyval(coefs, t_stable)
                    v_ripple = v_stable - v_trend
                    
                    rip_rms = np.sqrt(np.mean(v_ripple ** 2))
                    p_trend = np.mean(v_trend ** 2)
                    p_ripple = np.mean(v_ripple ** 2)
                    snr_val = 10 * np.log10(p_trend / p_ripple) if p_ripple > 0 else 0.0
                    
                    record[f'ripple_rms_deg{order}'] = rip_rms
                    record[f'ripple_norm_deg{order}'] = rip_rms / v_mean if v_mean > 0 else 0.0
                    record[f'snr_deg{order}'] = snr_val
                    
                master_records.append(record)
            except Exception as e:
                continue
    except Exception as e:
        print(f"Error reading cell {cell_name}: {e}")

# Save CSV
df_master = pd.DataFrame(master_records)
master_csv_path = os.path.join(OUTPUT_DIR, 'master_chemistry_dataset.csv')
df_master.to_csv(master_csv_path, index=False)

print("\n" + "="*50)
print(f"Master Dataset Compiled Successfully!")
print(f"Saved to: {master_csv_path}")
print(f"Total rows: {len(df_master)}")
print(f"Chemistry Counts:\n{df_master['chemistry'].value_counts()}")
print(f"EOL Observed Cell Counts:\n{df_master.groupby('chemistry')['eol_observed'].value_counts()}")
print("="*50 + "\n")
