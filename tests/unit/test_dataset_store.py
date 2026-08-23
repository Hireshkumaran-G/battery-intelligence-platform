import json
import pickle
import numpy as np
import pytest
from pathlib import Path

from bip import DatasetStore, DatasetArtifact, ExperimentRecord

class CustomObj:
    def __init__(self, x): self.x = x
    def __eq__(self, other): return self.x == other.x


@pytest.fixture
def store(tmp_path):
    """Fixture for a DatasetStore using a temporary directory."""
    return DatasetStore(tmp_path)

@pytest.mark.unit
def test_dataset_store_init(tmp_path):
    """Test DatasetStore creates the expected directory structure."""
    store = DatasetStore(tmp_path)
    assert (tmp_path / "raw").is_dir()
    assert (tmp_path / "processed").is_dir()
    assert (tmp_path / "features").is_dir()
    assert (tmp_path / "labels").is_dir()
    assert (tmp_path / "metadata").is_dir()
    assert (tmp_path / "experiments").is_dir()
    assert (tmp_path / "cache").is_dir()
    assert (tmp_path / "metadata" / "index.json").exists()
    assert (tmp_path / "experiments" / "index.json").exists()

@pytest.mark.unit
def test_save_load_array(store):
    """Test saving and loading a NumPy array artifact."""
    data = np.array([1.0, 2.0, 3.0])
    artifact_id = "test_array"
    
    artifact = store.save_array("features", artifact_id, data, metadata={"key": "val"})
    
    assert artifact.artifact_id == artifact_id
    assert artifact.artifact_type == "features"
    assert Path(artifact.path).exists()
    assert artifact.metadata == {"key": "val"}
    
    loaded = store.load_array("features", artifact_id)
    np.testing.assert_array_equal(loaded, data)

@pytest.mark.unit
def test_save_load_json(store):
    """Test saving and loading a JSON artifact."""
    data = {"name": "test", "values": [1, 2, 3]}
    artifact_id = "test_json"
    
    artifact = store.save_json("metadata", artifact_id, data)
    
    assert artifact.artifact_type == "metadata"
    assert Path(artifact.path).exists()
    
    loaded = store.load_json("metadata", artifact_id)
    assert loaded == data

@pytest.mark.unit
def test_save_load_pickle(store):
    """Test saving and loading a pickle artifact."""
    data = CustomObj(42)
    artifact_id = "test_pickle"
    
    artifact = store.save_pickle("cache", artifact_id, data)
    
    assert artifact.artifact_type == "cache"
    assert Path(artifact.path).exists()
    
    loaded = store.load_pickle("cache", artifact_id)
    assert loaded == data

@pytest.mark.unit
def test_load_missing_artifact_raises_error(store):
    """Test loading a non-existent artifact raises FileNotFoundError."""
    with pytest.raises(FileNotFoundError):
        store.load_array("features", "missing")
    with pytest.raises(FileNotFoundError):
        store.load_json("metadata", "missing")
    with pytest.raises(FileNotFoundError):
        store.load_pickle("cache", "missing")

@pytest.mark.unit
def test_save_features(store):
    """Test saving a feature matrix with metadata."""
    feature_names = ["v_mean", "v_std"]
    matrix = np.array([[3.7, 0.1], [3.8, 0.2]])
    labels = [0, 1]
    experiment_id = "exp_001"
    
    artifact = store.save_features(experiment_id, feature_names, matrix, labels=labels)
    
    assert artifact.artifact_id == f"{experiment_id}_features"
    assert Path(artifact.path).exists()
    
    # Verify metadata was also saved
    metadata_artifact_id = f"{experiment_id}_features_metadata"
    metadata = store.load_json("metadata", metadata_artifact_id)
    assert metadata["feature_names"] == feature_names
    assert metadata["labels"] == labels
    assert metadata["experiment_id"] == experiment_id

@pytest.mark.unit
def test_save_raw_signal(store):
    """Test saving raw battery signal bundles."""
    voltage = [3.7, 3.71, 3.72]
    current = [0.5, 0.5, 0.5]
    sample_id = "cell_01_cycle_10"
    
    artifact = store.save_raw_signal(sample_id, voltage, current=current)
    
    assert artifact.artifact_id == sample_id
    assert Path(artifact.path).exists()
    
    data = store.load_json("raw", sample_id)
    assert data["sample_id"] == sample_id
    assert data["voltage"] == voltage
    assert data["current"] == current

@pytest.mark.unit
def test_create_experiment(store):
    """Test creating and tracking an experiment."""
    name = "SOH Classification Test"
    description = "Initial test of decision tree model."
    tags = ["SOH", "DecisionTree"]
    
    record = store.create_experiment(name, description, tags=tags)
    
    assert record.name == name
    assert record.description == description
    assert record.tags == tags
    assert len(record.experiment_id) == 16
    
    # Check index
    experiments = store.list_experiments()
    assert len(experiments) == 1
    assert experiments[0].experiment_id == record.experiment_id

@pytest.mark.unit
def test_list_artifacts(store):
    """Test listing artifacts in the store."""
    store.save_array("features", "f1", [1])
    store.save_array("features", "f2", [2])
    store.save_json("metadata", "m1", {"a": 1})
    
    all_artifacts = store.list_artifacts()
    assert len(all_artifacts) == 3
    
    feature_artifacts = store.list_artifacts(artifact_type="features")
    assert len(feature_artifacts) == 2
    assert all(a.artifact_type == "features" for a in feature_artifacts)

@pytest.mark.unit
def test_cache_and_load_value(store):
    """Test the low-level caching interface."""
    key = "model_123"
    value = {"weights": [0.1, 0.5], "bias": 0.01}
    
    path = store.cache_value(key, value)
    assert path.exists()
    
    loaded = store.load_cache(key)
    assert loaded == value

@pytest.mark.unit
def test_compute_dataset_hash(store, tmp_path):
    """Test computing a stable hash for artifact collections."""
    p1 = tmp_path / "file1.txt"
    p1.write_text("content1")
    p2 = tmp_path / "file2.txt"
    p2.write_text("content2")
    
    hash1 = store.compute_dataset_hash([p1, p2])
    hash2 = store.compute_dataset_hash([p2, p1]) # Order should not matter
    
    assert hash1 == hash2
    
    p1.write_text("content_changed")
    hash3 = store.compute_dataset_hash([p1, p2])
    assert hash1 != hash3