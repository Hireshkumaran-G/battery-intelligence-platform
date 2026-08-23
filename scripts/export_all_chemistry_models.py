import os
import sys
import pandas as pd
from pathlib import Path
from sklearn.tree import DecisionTreeRegressor
from sklearn.preprocessing import StandardScaler

# Locate project root dynamically by searching upward for pyproject.toml
_curr = os.path.dirname(os.path.abspath(__file__))
while _curr != os.path.dirname(_curr):
    if os.path.exists(os.path.join(_curr, 'pyproject.toml')):
        PROJECT_ROOT = _curr
        break
    _curr = os.path.dirname(_curr)
else:
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # fallback

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from bip import (
    STM32ModelExporter,
    STM32InferenceConfig,
)

def main():
    print("\n" + "="*80)
    print("  EXPORTING EMBEDDED C MODELS FOR LFP, NMC, & LCO CHEMISTRIES")
    print("="*80 + "\n")

    # 1. Load the compiled master chemistry dataset
    csv_path = Path(PROJECT_ROOT) / "bip" / "classification_artifacts" / "master_chemistry_dataset.csv"
    if not csv_path.exists():
        print(f"ERROR: master_chemistry_dataset.csv not found at {csv_path}")
        sys.exit(1)
        
    print(f"Loading master chemistry dataset from {csv_path}...")
    df = pd.read_csv(csv_path)

    # 2. Define the features for prediction
    features = [
        'voltage_mean', 'voltage_std', 'voltage_min', 'voltage_max', 'voltage_skewness', 'voltage_kurtosis',
        'current_mean', 'current_std', 'temperature_mean', 'temperature_std', 'discharge_duration_s', 'charge_time_s',
        'ripple_norm_deg2', 'D1_ripple', 'D2_ripple', 'dominant_frequency', 'fft_energy', 'spectral_entropy'
    ]

    # 3. Process and export each chemistry model
    chemistries = ['LFP', 'NMC', 'LCO']
    for chem in chemistries:
        print(f"\nProcessing {chem} chemistry...")
        df_chem = df[df['chemistry'] == chem].dropna(subset=features + ['soh']).reset_index(drop=True)
        if len(df_chem) == 0:
            print(f"  No data found for {chem}. Skipping.")
            continue
            
        print(f"  Found {len(df_chem)} cycles for training.")
        
        # Fit standard scaler
        scaler = StandardScaler()
        X = df_chem[features].values
        y = df_chem['soh'].values
        X_scaled = scaler.fit_transform(X)
        
        # Train decision tree regressor to predict SOH
        model = DecisionTreeRegressor(max_depth=5, random_state=42)
        model.fit(X_scaled, y)
        
        # Export model
        export_dir = Path(PROJECT_ROOT) / "stm32_export" / f"{chem.lower()}_soh_model"
        exporter = STM32ModelExporter(config=STM32InferenceConfig(target_mcu="STM32F446RE"))
        exporter.export_for_stm32(
            model=model,
            feature_names=features,
            scaler_params={
                "mean": scaler.mean_.tolist(),
                "scale": scaler.scale_.tolist(),
            },
            output_dir=export_dir,
            model_name=f"{chem.lower()}_soh"
        )
        print(f"  Successfully exported {chem} C headers to {export_dir}")

    print("\nAll chemistry models successfully compiled and exported!")

if __name__ == '__main__':
    main()
