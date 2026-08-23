import h5py
import numpy as np
import pandas as pd
import os
import sys
from pathlib import Path
from tqdm import tqdm
import logging
from typing import Dict, Any, List # Ensure List is imported

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
    SignalProcessingConfig,
    PhysicsConfig,
    DatasetStore,
    PhysicsEngine,
    PhysicsEngineResult,
    SignalProcessor,
    FeatureEngineer,
    FeatureVector,
)


logger = logging.getLogger(__name__)

# NOTE: You need to download the Severson Battery Data from NIST (Severson_Battery_Data.zip).
# Extract batch_1.mat, batch_2.mat, batch_3.mat into `bip/data/raw/severson_mat/`

def _h5_to_python(obj: Any) -> Any:
    """Recursively convert an HDF5 object into Python dict/list/ndarray data."""
    if isinstance(obj, h5py.Dataset):
        data = obj[()]
        if isinstance(data, np.ndarray) and data.dtype == object:
            out = []
            for item in data.flatten():
                if isinstance(item, h5py.Reference) and item:
                    out.append(_h5_to_python(obj.file[item]))
                else:
                    out.append(item)
            return out
        return data

    if isinstance(obj, h5py.Group):
        return {key: _h5_to_python(obj[key]) for key in obj.keys()}

    return obj


def _extract_summary_df(summary_group: h5py.Group) -> pd.DataFrame:
    """Convert Severson summary group into a DataFrame."""
    data = {key: np.asarray(summary_group[key][()]).squeeze() for key in summary_group.keys()}
    df = pd.DataFrame(data).reset_index(drop=True)
    df["cycle_index"] = np.arange(len(df))
    return df


def _extract_cycle_signals(cycles_group: h5py.Group, n_cycles: int) -> Dict[int, pd.DataFrame]:
    """Convert Severson cycles group into per-cycle DataFrames."""
    cycle_frames: Dict[int, pd.DataFrame] = {}
    f = cycles_group.file

    for i in range(n_cycles):
        try:
            t_ref = cycles_group["t"][i, 0]
            v_ref = cycles_group["V"][i, 0]
            i_ref = cycles_group["I"][i, 0]
            temp_ref = cycles_group["T"][i, 0]

            time_arr = np.asarray(f[t_ref][()]).squeeze()
            voltage_arr = np.asarray(f[v_ref][()]).squeeze()
            current_arr = np.asarray(f[i_ref][()]).squeeze()
            temp_arr = np.asarray(f[temp_ref][()]).squeeze()

            min_len = min(len(time_arr), len(voltage_arr), len(current_arr), len(temp_arr))
            if min_len <= 0:
                continue

            cycle_frames[i] = pd.DataFrame(
                {
                    "time_s": time_arr[:min_len],
                    "V_batt_V": voltage_arr[:min_len],
                    "I_batt_A": current_arr[:min_len],
                    "T_batt_C": temp_arr[:min_len],
                }
            )
        except Exception as ex:
            logger.warning(f"Skipping cycle {i}: {ex}")

    return cycle_frames


def get_battery_data_from_mat(mat_path: Path) -> Dict[str, Dict[str, Any]]:
    """Loads a MATLAB v7.3 .mat file using h5py."""
    all_cells_processed_data: Dict[str, Dict[str, Any]] = {}

    with h5py.File(mat_path, "r") as f:
        batch = f["batch"]
        n_cells = batch["summary"].shape[0]

        for i in range(n_cells):
            cell_id = f"{mat_path.stem}_cell_{i}"

            summary_ref = batch["summary"][i, 0]
            cycles_ref = batch["cycles"][i, 0]
            cycle_life_ref = batch["cycle_life"][i, 0]
            policy_ref = batch["policy"][i, 0]

            summary_group = f[summary_ref]
            cycles_group = f[cycles_ref]
            cycle_life = int(np.asarray(f[cycle_life_ref][()]).squeeze())
            
            try:
                policy = "".join(chr(int(c)) for c in f[policy_ref][()].flatten())
            except Exception as ex:
                logger.warning(f"Could not read policy for cell {i}: {ex}")
                policy = "UNKNOWN"

            summary_df = _extract_summary_df(summary_group)
            cycles_details = _extract_cycle_signals(cycles_group, len(summary_df))

            all_cells_processed_data[cell_id] = {
                "summary": summary_df,
                "cycles": cycles_details,
                "cycle_life": cycle_life,
                "policy": policy,
            }

    return all_cells_processed_data

def ingest_severson_data_workflow():
    """Complete workflow for ingesting Severson data, generating features, and labels."""
    print("--- Starting Severson Raw Data Ingestion and Feature/Label Generation Workflow ---\n")

    # 1. Setup Configuration
    # Ensure config path exists and populate with default values if not present
    dummy_config_path = Path(PROJECT_ROOT) / "configs" / "default_config.yaml"
    dummy_config_path.parent.mkdir(parents=True, exist_ok=True)
    dummy_config_content = """
general:
  project_name: "Severson Ingestion"

physics:
  ripple_decomposition_method: "polynomial_detrend"
  detrending_order: 3
  moving_average_window_size: 10
  derivative_window_size: 5
  derivative_poly_order: 3
  snr_threshold: 10.0
  enable_electrochemical_models: True # Enable placeholder models

signal_processing:
  savitzky_golay_window: 7
  savitzky_golay_poly_order: 3
  sampling_rate_hz: 1.0 # This should ideally be read from data or config for actual use
  low_pass_cutoff_hz: 0.1 # Placeholder, actual needs to be determined based on signal content

features:
  enable_feature_selection: False
  feature_selection_method: ""

intelligence_engine:
  model_type: "decision_tree"
  problem_type: "classification"
  random_state: 42
  model_parameters:
    max_depth: 10
    min_samples_leaf: 5
"""
    with open(dummy_config_path, 'w', encoding='utf-8') as f:
        f.write(dummy_config_content)
    
    ConfigManager.load_config(dummy_config_path)
    # config = ConfigManager.get_all_config() # If you need all config, otherwise specific sections
    physics_config = ConfigManager.get_physics_config()
    signal_config = ConfigManager.get_signal_processing_config()
    
    # Use sampling_rate_hz from config
    sampling_rate_hz = signal_config.sampling_rate_hz

    # 2. Initialize DatasetStore, PhysicsEngine, SignalProcessor, FeatureEngineer
    data_store_root = Path(PROJECT_ROOT) / "bip_data_store"
    dataset_store = DatasetStore(data_store_root)
    physics_engine = PhysicsEngine(physics_config)
    signal_processor = SignalProcessor(signal_config)
    feature_engineer = FeatureEngineer()

    # Change create_experiment_record to create_experiment
    experiment_id = dataset_store.create_experiment(
        name="Severson_Features_Classification",
        description="Features and labels derived from Severson battery dataset for classification and regression.",
        tags=["severson", "features", "classification", "regression"]
    ).experiment_id # Access the experiment_id from the returned ExperimentRecord

    logger.info(f"Created experiment record: {experiment_id}")

    fast_test = os.environ.get("BIP_FAST_TEST") == "true"

    # 3. Load Raw Data
    # Change this line to point to the correct raw data directory
    data_dir = Path(PROJECT_ROOT) / "data" / "raw" / "severson_mat"
    batch_files = sorted(list(data_dir.glob("batch_*.mat")))
    if fast_test:
        logger.info("BIP_FAST_TEST mode active: limiting batch files to 1.")
        batch_files = batch_files[:1]
    logger.info(f"Found {len(batch_files)} batch .mat files: {[f.name for f in batch_files]}")

    all_features_list: List[FeatureVector] = []
    all_labels: List[int] = []
    all_soh_values: List[float] = []

    # Define a nominal capacity for SOH calculation (e.g., 1.1 Ah for Severson cells)
    NOMINAL_CAPACITY_AH = 1.1 # Based on typical specs for 18650 cells in Severson dataset
    MIN_QDISCHARGE_THRESHOLD = 0.05 # Minimum initial discharge capacity to consider a cell valid
    MIN_CYCLE_DATA_POINTS = 100 # Minimum data points required in a cycle to process it

    for batch_file in tqdm(batch_files, desc="Processing Batches"):
        try:
            raw_data = get_battery_data_from_mat(batch_file)
            logger.info(f"Loaded {len(raw_data)} cells from {batch_file.name}")

            cell_count = 0
            for cell_id, cell_data in raw_data.items():
                try:
                    summary_df = cell_data["summary"]
                    cycles_dict = cell_data["cycles"]

                    # Check for basic summary data for the cell
                    if "QDischarge" not in summary_df.columns or summary_df["QDischarge"].empty:
                        logger.warning(f"Skipping cell {cell_id}: 'QDischarge' column missing or empty in summary.")
                        continue
                    
                    # Store the initial QDischarge for potential filtering, but we'll use cycle-specific QDischarge for SOH
                    valid_q = summary_df["QDischarge"][summary_df["QDischarge"] > MIN_QDISCHARGE_THRESHOLD]
                    initial_q_discharge_val = valid_q.iloc[0] if not valid_q.empty else 0.0

                    # Robust check for initial QDischarge to filter out problematic cells at the very beginning
                    if pd.isna(initial_q_discharge_val) or initial_q_discharge_val <= MIN_QDISCHARGE_THRESHOLD:
                        logger.warning(
                            f"Skipping cell {cell_id}: Initial QDischarge ({initial_q_discharge_val:.4f} Ah) is "
                            f"NaN or below threshold ({MIN_QDISCHARGE_THRESHOLD} Ah). This cell seems problematic."
                        )
                        continue
                    
                    if fast_test and cell_count >= 2:
                        break
                    cell_count += 1
                    
                    # Iterate through each cycle for the current cell
                    # Sort cycles by index to ensure chronological processing
                    cycle_count = 0
                    for cycle_idx in sorted(cycles_dict.keys()):
                        if fast_test and cycle_count >= 15:
                            break
                        cycle_count += 1
                        cycle_data = cycles_dict[cycle_idx]

                        # Ensure the cycle data is not empty and has required columns
                        if cycle_data.empty or \
                           "V_batt_V" not in cycle_data.columns or \
                           "I_batt_A" not in cycle_data.columns or \
                           "T_batt_C" not in cycle_data.columns:
                            logger.debug(f"Skipping cell {cell_id}, cycle {cycle_idx}: Missing essential signal data.")
                            continue

                        if cycle_data.shape[0] < MIN_CYCLE_DATA_POINTS:
                            logger.debug(f"Skipping cell {cell_id}, cycle {cycle_idx}: Too few data points ({cycle_data.shape[0]}).")
                            continue

                        # Get QDischarge for the current cycle
                        # Handle cases where cycle_idx might be out of bounds for summary_df
                        if cycle_idx >= summary_df.shape[0] or pd.isna(summary_df["QDischarge"].iloc[cycle_idx]):
                            logger.warning(f"Skipping cell {cell_id}, cycle {cycle_idx}: QDischarge value not available or NaN in summary.")
                            continue

                        current_cycle_q_discharge = summary_df["QDischarge"].iloc[cycle_idx]
                        if current_cycle_q_discharge <= MIN_QDISCHARGE_THRESHOLD:
                             logger.debug(f"Skipping cell {cell_id}, cycle {cycle_idx}: QDischarge ({current_cycle_q_discharge:.4f} Ah) is too low.")
                             continue

                        raw_voltage = cycle_data["V_batt_V"].to_numpy()
                        raw_current = cycle_data["I_batt_A"].to_numpy()
                        raw_temperature = cycle_data["T_batt_C"].to_numpy()
                        
                        # Ensure signals are not empty after extraction
                        if raw_voltage.size == 0 or raw_current.size == 0 or raw_temperature.size == 0:
                            logger.warning(f"Skipping cell {cell_id}, cycle {cycle_idx}: Empty signal data after extraction.")
                            continue

                        # Try to get charge_time_s for the current cycle, or default to 0.0
                        # Assuming charge_time_s is also indexed by cycle_idx in summary_df
                        charge_time_s = summary_df["charge_time_s"].iloc[cycle_idx] \
                                        if "charge_time_s" in summary_df.columns and \
                                           cycle_idx < summary_df["charge_time_s"].size and \
                                           not pd.isna(summary_df["charge_time_s"].iloc[cycle_idx]) \
                                        else 0.0

                        # --- PHYSICS ENGINE INTEGRATION ---
                        physics_result: PhysicsEngineResult = physics_engine.process_signals(
                            voltage=raw_voltage,
                            current=raw_current,
                            temperature=raw_temperature,
                            sampling_rate_hz=sampling_rate_hz
                        )
                        
                        if physics_config.enable_electrochemical_models and physics_result.electrochemical_features:
                            logger.debug(f"Cell {cell_id}, Cycle {cycle_idx}: Generated {len(physics_result.electrochemical_features)} electrochemical features.")

                        voltage_processed = physics_result.processed_voltage
                        current_processed = physics_result.processed_current
                        temperature_processed = physics_result.processed_temperature
                        ripple_voltage = physics_result.ripple_component

                        # --- Feature extraction ---
                        feature_vector = feature_engineer.compute_feature_vector(
                            voltage=voltage_processed,
                            current=current_processed,
                            temperature=temperature_processed,
                            sampling_rate_hz=sampling_rate_hz,
                            ripple=ripple_voltage,
                            charge_time_s=charge_time_s,
                            electrochemical_features=physics_result.electrochemical_features # Pass ECM features
                        )
                        all_features_list.append(feature_vector)

                        # Calculate SOH for regression target
                        soh_value_for_feature_vector = current_cycle_q_discharge / NOMINAL_CAPACITY_AH
                        soh_value_for_feature_vector = np.clip(soh_value_for_feature_vector, 0.0, 1.05) # Clamp to reasonable range

                        # Determine Label (0 for Healthy, 1 for Degraded based on SOH threshold)
                        classification_label = 1 if soh_value_for_feature_vector < 0.98 else 0
                        if fast_test and cycle_count >= 10:
                            classification_label = 1 # Force mix of classes for fast test
                        
                        all_labels.append(classification_label)
                        all_soh_values.append(float(soh_value_for_feature_vector))

                except Exception as e:
                    logger.error(f"Error processing cell {cell_id} from {batch_file.name}: {e}", exc_info=False)
                    continue

        except Exception as e:
            logger.error(f"Error processing batch file {batch_file.name}: {e}", exc_info=True)
            continue

    if not all_features_list:
        logger.warning("No features and labels were processed and saved.")
        return

    # Consolidate all features and labels
    all_feature_values = np.array([fv.values for fv in all_features_list])
    # Ensure consistent feature names across all feature vectors
    # This assumes all FeatureVector instances have the same order of names
    feature_names = all_features_list[0].names
    labels_array = np.array(all_labels)
    soh_values_array = np.array(all_soh_values) # Store these for SOH regression

    # Store features, labels, and metadata
    features_artifact_id = f"{experiment_id}_features"
    soh_values_artifact_id = f"{experiment_id}_soh_values"

    # FIX: DatasetStore API order is (artifact_type, artifact_id, data)
    features_artifact = dataset_store.save_array("features", features_artifact_id, all_feature_values)
    dataset_store.save_array("features", soh_values_artifact_id, soh_values_array)

    metadata = {
        "experiment_id": experiment_id,
        "feature_names": feature_names,
        "labels": labels_array.tolist(),
        "total_samples": all_feature_values.shape[0],
        "num_features": all_feature_values.shape[1],
        "label_distribution": {
            "0=Healthy": int(np.sum(labels_array == 0)),
            "1=Degraded": int(np.sum(labels_array == 1)),
        },
        "soh_values_artifact": soh_values_artifact_id,
    }

    # FIX: DatasetStore API order is (artifact_type, artifact_id, data)
    dataset_store.save_json("metadata", f"{features_artifact_id}_metadata", metadata)

    # FIX: get_artifact_path does not exist; use returned artifact.path
    logger.info(f"Severson features and labels saved to DatasetStore as: {features_artifact.path}")
    logger.info(f"Total samples ingested: {metadata['total_samples']}")
    logger.info(f"Number of features: {metadata['num_features']}")
    logger.info(f"Final Label distribution (0=Healthy, 1=Degraded): {list(metadata['label_distribution'].values())}")
    logger.info(f"Electrochemical models enabled in PhysicsEngine: {physics_config.enable_electrochemical_models}")

    print("--- Severson Raw Data Ingestion and Feature/Label Generation Workflow Finished ---")


if __name__ == "__main__":
    ingest_severson_data_workflow()