# File: store.py
# Relative Path: bip/store.py
# Purpose: Provides a local dataset and feature store for raw data, processed data, features, labels, metadata, experiment information, versioning, and caching.

from __future__ import annotations

import hashlib
import json
import pickle
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Union

import numpy as np


def _utc_now_iso() -> str:
    """Return the current UTC timestamp in ISO-8601 format."""
    return datetime.now(timezone.utc).isoformat()


def _stable_json_dumps(data: Any) -> str:
    """Serialize data deterministically for hashing and metadata storage."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def _ensure_dir(path: Path) -> None:
    """Create a directory and its parents if needed."""
    path.mkdir(parents=True, exist_ok=True)


def _to_serializable_array(array: Sequence[float] | np.ndarray) -> List[float]:
    """Convert a numeric sequence into a JSON-serializable list of floats."""
    return np.asarray(array, dtype=float).reshape(-1).astype(float).tolist()


def _hash_bytes(data: bytes) -> str:
    """Compute a SHA-256 hash for arbitrary bytes."""
    return hashlib.sha256(data).hexdigest()


def _hash_text(text: str) -> str:
    """Compute a SHA-256 hash for text."""
    return _hash_bytes(text.encode("utf-8"))


@dataclass(frozen=True)
class DatasetArtifact:
    """Metadata for a stored dataset artifact."""

    artifact_id: str
    artifact_type: str
    path: str
    created_at: str
    data_hash: str
    size_bytes: int
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ExperimentRecord:
    """Metadata for a tracked experiment."""

    experiment_id: str
    name: str
    created_at: str
    description: str
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class DatasetStore:
    """
    Local repository for BIP datasets, features, labels, and experiment metadata.

    The store is filesystem-backed and deterministic. It can be used in research,
    benchmarking, and deployment pipelines without requiring a database.
    """

    def __init__(self, root_dir: Union[str, Path]):
        """Initialize the store and create the required directory structure."""
        self.root_dir = Path(root_dir)
        self.raw_dir = self.root_dir / "raw"
        self.processed_dir = self.root_dir / "processed"
        self.features_dir = self.root_dir / "features"
        self.labels_dir = self.root_dir / "labels"
        self.metadata_dir = self.root_dir / "metadata"
        self.experiments_dir = self.root_dir / "experiments"
        self.cache_dir = self.root_dir / "cache"
        self.index_path = self.metadata_dir / "index.json"
        self.experiments_index_path = self.experiments_dir / "index.json"

        for directory in (
            self.root_dir,
            self.raw_dir,
            self.processed_dir,
            self.features_dir,
            self.labels_dir,
            self.metadata_dir,
            self.experiments_dir,
            self.cache_dir,
        ):
            _ensure_dir(directory)

        if not self.index_path.exists():
            self._write_json(self.index_path, {"artifacts": []})
        if not self.experiments_index_path.exists():
            self._write_json(self.experiments_index_path, {"experiments": []})

    def _write_json(self, path: Path, data: Dict[str, Any]) -> None:
        """Write JSON data to disk."""
        _ensure_dir(path.parent)
        path.write_text(_stable_json_dumps(data), encoding="utf-8")

    def _read_json(self, path: Path) -> Dict[str, Any]:
        """Read JSON data from disk."""
        if not path.exists():
            return {}
        return json.loads(path.read_text(encoding="utf-8"))

    def _append_index(self, index_path: Path, key: str, record: Dict[str, Any]) -> None:
        """Append a record to a JSON index file."""
        index = self._read_json(index_path)
        items = index.get(key, [])
        items.append(record)
        index[key] = items
        self._write_json(index_path, index)

    def _artifact_path(self, artifact_type: str, artifact_id: str, suffix: str) -> Path:
        """Build a deterministic artifact path."""
        directory = getattr(self, f"{artifact_type}_dir")
        return directory / f"{artifact_id}{suffix}"

    def _register_artifact(
        self,
        artifact_id: str,
        artifact_type: str,
        path: Path,
        data_hash: str,
        size_bytes: int,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> DatasetArtifact:
        """Register a stored artifact in the index."""
        record = DatasetArtifact(
            artifact_id=artifact_id,
            artifact_type=artifact_type,
            path=str(path),
            created_at=_utc_now_iso(),
            data_hash=data_hash,
            size_bytes=size_bytes,
            metadata=metadata or {},
        )
        self._append_index(self.index_path, "artifacts", asdict(record))
        return record

    def save_array(
        self,
        artifact_type: str,
        artifact_id: str,
        array: Sequence[float] | np.ndarray,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> DatasetArtifact:
        """Save a numeric array as a NumPy binary file."""
        values = np.asarray(array)
        suffix = ".npy"
        path = self._artifact_path(artifact_type, artifact_id, suffix)
        _ensure_dir(path.parent)
        np.save(path, values, allow_pickle=False)
        payload = path.read_bytes()
        return self._register_artifact(
            artifact_id=artifact_id,
            artifact_type=artifact_type,
            path=path,
            data_hash=_hash_bytes(payload),
            size_bytes=path.stat().st_size,
            metadata=metadata,
        )

    def save_json(
        self,
        artifact_type: str,
        artifact_id: str,
        data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> DatasetArtifact:
        """Save structured data as JSON."""
        suffix = ".json"
        path = self._artifact_path(artifact_type, artifact_id, suffix)
        _ensure_dir(path.parent)
        serialized = _stable_json_dumps(data)
        path.write_text(serialized, encoding="utf-8")
        return self._register_artifact(
            artifact_id=artifact_id,
            artifact_type=artifact_type,
            path=path,
            data_hash=_hash_text(serialized),
            size_bytes=path.stat().st_size,
            metadata=metadata,
        )

    def save_pickle(
        self,
        artifact_type: str,
        artifact_id: str,
        data: Any,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> DatasetArtifact:
        """Save arbitrary Python objects using pickle."""
        suffix = ".pkl"
        path = self._artifact_path(artifact_type, artifact_id, suffix)
        _ensure_dir(path.parent)
        with path.open("wb") as handle:
            pickle.dump(data, handle, protocol=pickle.HIGHEST_PROTOCOL)
        return self._register_artifact(
            artifact_id=artifact_id,
            artifact_type=artifact_type,
            path=path,
            data_hash=_hash_bytes(path.read_bytes()),
            size_bytes=path.stat().st_size,
            metadata=metadata,
        )

    def load_array(self, artifact_type: str, artifact_id: str) -> np.ndarray:
        """Load a stored NumPy array artifact."""
        path_npy = self._artifact_path(artifact_type, artifact_id, ".npy")
        if not path_npy.exists():
            raise FileNotFoundError(f"Array artifact not found: {path_npy}")
        return np.load(path_npy, allow_pickle=False)

    def load_json(self, artifact_type: str, artifact_id: str) -> Dict[str, Any]:
        """Load a stored JSON artifact."""
        path_json = self._artifact_path(artifact_type, artifact_id, ".json")
        if not path_json.exists():
            raise FileNotFoundError(f"JSON artifact not found: {path_json}")
        return json.loads(path_json.read_text(encoding="utf-8"))

    def load_pickle(self, artifact_type: str, artifact_id: str) -> Any:
        """Load a stored pickle artifact."""
        path_pkl = self._artifact_path(artifact_type, artifact_id, ".pkl")
        if not path_pkl.exists():
            raise FileNotFoundError(f"Pickle artifact not found: {path_pkl}")
        with path_pkl.open("rb") as handle:
            return pickle.load(handle)

    def save_features(
        self,
        experiment_id: str,
        feature_names: Sequence[str],
        feature_matrix: Sequence[Sequence[float]] | np.ndarray,
        labels: Optional[Sequence[Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> DatasetArtifact:
        """Save a feature matrix and its associated metadata."""
        matrix = np.asarray(feature_matrix, dtype=float)
        payload = {
            "experiment_id": experiment_id,
            "feature_names": list(feature_names),
            "feature_matrix_shape": list(matrix.shape),
            "labels": list(labels) if labels is not None else None,
            "metadata": metadata or {},
        }
        artifact_id = f"{experiment_id}_features"
        artifact = self.save_array("features", artifact_id, matrix, metadata=payload)
        self.save_json("metadata", f"{artifact_id}_metadata", payload)
        return artifact

    def save_raw_signal(
        self,
        sample_id: str,
        voltage: Sequence[float] | np.ndarray,
        current: Optional[Sequence[float] | np.ndarray] = None,
        temperature: Optional[Sequence[float] | np.ndarray] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> DatasetArtifact:
        """Save a raw battery signal bundle as a JSON artifact."""
        payload = {
            "sample_id": sample_id,
            "voltage": _to_serializable_array(voltage),
            "current": _to_serializable_array(current) if current is not None else None,
            "temperature": _to_serializable_array(temperature) if temperature is not None else None,
            "metadata": metadata or {},
            "created_at": _utc_now_iso(),
        }
        return self.save_json("raw", sample_id, payload, metadata=metadata)

    def create_experiment(
        self,
        name: str,
        description: str,
        tags: Optional[Sequence[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ExperimentRecord:
        """Create and register a new experiment record."""
        base = {
            "name": name,
            "description": description,
            "tags": list(tags) if tags is not None else [],
            "metadata": metadata or {},
            "created_at": _utc_now_iso(),
        }
        experiment_id = _hash_text(_stable_json_dumps(base))[:16]
        record = ExperimentRecord(
            experiment_id=experiment_id,
            name=name,
            created_at=base["created_at"],
            description=description,
            tags=base["tags"],
            metadata=base["metadata"],
        )
        self._append_index(self.experiments_index_path, "experiments", asdict(record))
        self._write_json(self.experiments_dir / f"{experiment_id}.json", asdict(record))
        return record

    def list_artifacts(self, artifact_type: Optional[str] = None) -> List[DatasetArtifact]:
        """List all registered artifacts, optionally filtered by artifact type."""
        index = self._read_json(self.index_path)
        items = index.get("artifacts", [])
        artifacts = [DatasetArtifact(**item) for item in items]
        if artifact_type is None:
            return artifacts
        return [artifact for artifact in artifacts if artifact.artifact_type == artifact_type]

    def list_experiments(self) -> List[ExperimentRecord]:
        """List all registered experiments."""
        index = self._read_json(self.experiments_index_path)
        items = index.get("experiments", [])
        return [ExperimentRecord(**item) for item in items]

    def cache_value(self, key: str, value: Any) -> Path:
        """Cache a Python object under a stable key."""
        path = self.cache_dir / f"{key}.pkl"
        with path.open("wb") as handle:
            pickle.dump(value, handle, protocol=pickle.HIGHEST_PROTOCOL)
        return path

    def load_cache(self, key: str) -> Any:
        """Load a cached Python object."""
        path = self.cache_dir / f"{key}.pkl"
        if not path.exists():
            raise FileNotFoundError(f"Cache entry not found: {path}")
        with path.open("rb") as handle:
            return pickle.load(handle)

    def compute_dataset_hash(self, artifact_paths: Iterable[Path]) -> str:
        """Compute a stable hash for a collection of artifact files."""
        digest = hashlib.sha256()
        for path in sorted(Path(p) for p in artifact_paths):
            if not path.exists():
                continue
            digest.update(path.name.encode("utf-8"))
            digest.update(path.read_bytes())
        return digest.hexdigest()

    def get_experiment_by_name(self, name: str) -> Optional[ExperimentRecord]:
        """Retrieves an experiment record by its name."""
        index_data = self._read_json(self.experiments_index_path)
        for exp_dict in index_data.get("experiments", []):
            record = ExperimentRecord(**exp_dict)
            if record.name == name:
                return record
        return None
