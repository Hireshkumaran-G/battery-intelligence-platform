import os
import sys
import numpy as np
import pandas as pd
from pathlib import Path
from tqdm import tqdm
from sklearn.tree import DecisionTreeClassifier
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
    ConfigManager,
    FeatureEngineer,
    ValidationFramework,
    ValidationConfig,
    STM32ModelExporter,
    STM32InferenceConfig,
)
from scripts.ingest_severson_data import get_battery_data_from_mat

def main():
    print("\n" + "="*70)
    print("  CELL-LEVEL LIFETIME CLASSIFICATION PIPELINE (LEGACY PARITY)")
    print("="*70 + "\n")

    # 1. Load config if present, or create default
    config_path = Path(PROJECT_ROOT) / "configs" / "default_config.yaml"
    if config_path.exists():
        ConfigManager.load_config(config_path)
    
    fast_test = os.environ.get("BIP_FAST_TEST", "false").lower() == "true"
    
    # 2. Locate MATLAB files
    data_dir = Path(PROJECT_ROOT) / "data" / "raw" / "severson_mat"
    batch_files = sorted(list(data_dir.glob("batch_*.mat")))
    if not batch_files:
        print(f"ERROR: No .mat files found in {data_dir}")
        print("Please run scripts/run_complete_pipeline.py first to copy/symlink them.")
        sys.exit(1)
        
    if fast_test:
        print("BIP_FAST_TEST mode active: limiting to first batch file.")
        batch_files = batch_files[:1]

    # 3. Load data and extract early-cycle (cycle 1) features
    print("Extracting features from cycle 1 for all cells...")
    feature_engineer = FeatureEngineer()
    
    cells_data = []
    
    for batch_file in batch_files:
        print(f"Loading {batch_file.name}...")
        raw_data = get_battery_data_from_mat(batch_file)
        
        # In fast_test, limit number of cells per batch file
        cell_keys = list(raw_data.keys())
        if fast_test:
            cell_keys = cell_keys[:15]
            
        for cell_id in tqdm(cell_keys, desc="Processing cells"):
            cell_info = raw_data[cell_id]
            summary_df = cell_info["summary"]
            cycles_dict = cell_info["cycles"]
            cycle_life = cell_info["cycle_life"]
            policy = cell_info["policy"]
            
            # Skip cells with insufficient cycles
            if len(cycles_dict) < 2 or 1 not in cycles_dict:
                continue
                
            cycle_1_data = cycles_dict[1]
            if len(cycle_1_data) < 100:
                continue
                
            # Get charge time and average temperature for cycle 1 from summary_df
            # Cycle 1 in Severson corresponds to index 1 (formation is index 0)
            if "chargetime" in summary_df.columns:
                chargetime_m = summary_df["chargetime"].iloc[1]
            else:
                chargetime_m = 10.0
                
            # Compute feature vector
            v = cycle_1_data["V_batt_V"].values
            i = cycle_1_data["I_batt_A"].values
            t = cycle_1_data["T_batt_C"].values
            
            fv = feature_engineer.compute_feature_vector(
                voltage=v,
                current=i,
                temperature=t,
                sampling_rate_hz=1.0,
                charge_time_s=chargetime_m * 60.0
            )
            
            fv_dict = fv.as_dict()
            fv_dict["cell_id"] = cell_id
            fv_dict["policy"] = policy
            fv_dict["cycle_life"] = cycle_life
            # Target classification label: 1 if cycle_life < 550 else 0
            fv_dict["label"] = 1 if cycle_life < 550 else 0
            
            cells_data.append(fv_dict)
            
    df = pd.DataFrame(cells_data)
    print(f"\nExtracted features for {len(df)} cells.")
    print(f"Label distribution (0=Long-lived, 1=Short-lived):")
    print(df["label"].value_counts())
    
    # 4. Feature Selection: use the 9 exact legacy features
    legacy_features = [
        "D1_ripple", "D2_ripple", "snr_dB", 
        "v_mean", "v_std", "v_min", "v_max", 
        "tavg", "chargetime"
    ]
    
    X = df[legacy_features].values
    y = df["label"].values
    policies = df["policy"].values
    
    # 5. Run LOCO-CV Validation
    print("\nRunning Leave-One-Charging-Policy-Out Cross Validation (LOCO-CV)...")
    val_config = ValidationConfig(
        metrics=["accuracy", "precision", "recall", "f1"]
    )
    val_framework = ValidationFramework(config=val_config)
    
    def model_constructor():
        return DecisionTreeClassifier(max_depth=4, class_weight='balanced', random_state=42)
        
    validation_result = val_framework.run_loco_validation(
        model_constructor=model_constructor,
        X=X,
        y=y,
        groups=policies,
        scaler=True,
        experiment_name="cell_lifetime_loco_cv"
    )
    
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    y_true = validation_result.y_true_all
    y_pred = validation_result.y_pred_all
    
    overall_acc = accuracy_score(y_true, y_pred)
    overall_prec = precision_score(y_true, y_pred, zero_division=0)
    overall_rec = recall_score(y_true, y_pred, zero_division=0)
    overall_f1 = f1_score(y_true, y_pred, zero_division=0)

    print("\n" + "="*40)
    print("LOCO-CV OVERALL AGGREGATED METRICS:")
    print("="*40)
    print(f"  - Accuracy:  {overall_acc:.4f}")
    print(f"  - Precision: {overall_prec:.4f}")
    print(f"  - Recall:    {overall_rec:.4f}")
    print(f"  - F1-Score:  {overall_f1:.4f}")
    print("="*40)
    
    print("\nLOCO-CV Fold Average Metrics:")
    for metric, avg_val in validation_result.average_metrics.items():
        std_val = validation_result.std_metrics.get(metric, 0.0)
        print(f"  - Average {metric.capitalize()}: {avg_val:.4f} (±{std_val:.4f})")
    print("="*40 + "\n")
    
    # 6. Train production model on 100% of data
    print("Training final production model on 100% of data...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    final_model = model_constructor()
    final_model.fit(X_scaled, y)
    
    # 7. Export Model to STM32
    print("Exporting production model to STM32 C Header...")
    exporter = STM32ModelExporter(config=STM32InferenceConfig(target_mcu="STM32F446RE"))
    
    export_dir = Path(PROJECT_ROOT) / "stm32_export" / "cell_lifetime_model"
    exporter.export_for_stm32(
        model=final_model,
        feature_names=legacy_features,
        scaler_params={
            "mean": scaler.mean_.tolist(),
            "scale": scaler.scale_.tolist(),
        },
        output_dir=export_dir,
        model_name="cell_lifetime"
    )
    
    print(f"\n✓ Pipeline complete. Model exported to {export_dir.resolve()}\n")

if __name__ == "__main__":
    main()
