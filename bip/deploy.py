# File: deploy.py
# Relative Path: bip/deploy.py
# Purpose: Exports models and feature processors into C header files for STM32 targets.

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional
import json

import numpy as np
from sklearn.linear_model import Ridge


@dataclass
class STM32InferenceConfig:
    target_mcu: str = "STM32F446RE"
    optimization_level: str = "O2"
    floating_point_abi: str = "hard"
    enable_dma: bool = True
    adc_channels: int = 3
    sampling_rate_hz: float = 1000.0
    buffer_size_samples: int = 1024
    max_array_size: int = 2000


class STM32ModelExporter:
    def __init__(self, config: Optional[STM32InferenceConfig] = None):
        self.config = config or STM32InferenceConfig()

    def export_for_stm32(
        self,
        model: Any,
        feature_names: list[str],
        scaler_params: Optional[Dict[str, Any]] = None,
        output_dir: str | Path = "stm32_export",
        model_name: str = "bip_model",
    ) -> Dict[str, Path]:
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n✓ Exporting model to {out_dir}")

        # Unwrap wrapped model if passed a wrapped BaseIntelligenceModel
        fit_model = model.model if hasattr(model, "model") else model

        inference_h = self._generate_inference_header(fit_model, model_name, out_dir)
        features_h = self._generate_features_header(feature_names, model_name, out_dir)
        params_h = self._generate_model_params_header(fit_model, model_name, out_dir)
        scaler_h = self._generate_scaler_header(scaler_params, model_name, out_dir)
        main_c = self._generate_inference_implementation(fit_model, feature_names, model_name, out_dir)
        metadata_json = self._generate_metadata(fit_model, feature_names, model_name, out_dir)

        print(f"✓ Generated inference header: {inference_h.name}")
        print(f"✓ Generated features header: {features_h.name}")
        print(f"✓ Generated parameters header: {params_h.name}")
        print(f"✓ Generated scaler header: {scaler_h.name}")
        print(f"✓ Generated inference implementation: {main_c.name}")
        print(f"✓ Generated metadata: {metadata_json.name}")

        return {
            "inference_h": inference_h,
            "features_h": features_h,
            "params_h": params_h,
            "scaler_h": scaler_h,
            "inference_c": main_c,
            "metadata_json": metadata_json,
        }

    def _generate_inference_header(self, model: Any, name: str, out_dir: Path) -> Path:
        h_file = out_dir / f"{name}_inference.h"
        name_upper = name.upper()

        lines = [
            f"#ifndef {name_upper}_INFERENCE_H",
            f"#define {name_upper}_INFERENCE_H",
            "",
            "#include <stdint.h>",
            "#include <stddef.h>",
            f'#include "{name}_features.h"',
            "",
            "#ifdef __cplusplus",
            'extern "C" {',
            "#endif",
            "",
            f"/**",
            f" * Battery Intelligence Platform (BIP) - Embedded Model Inference",
            f" * Target: {self.config.target_mcu}",
            f" * Sampling Rate: {self.config.sampling_rate_hz} Hz",
            f" * Model Type: Ridge Regression / Tree Model",
            f" */",
            "",
            "// Raw ADC input",
            "typedef struct {",
            "    float voltage_v;",
            "    float current_a;",
            "    float temperature_c;",
            "} AdcSample_t;",
            "",
            "// Extracted feature vector",
            "typedef struct {",
            "    float features[BIP_NUM_FEATURES];",
            "    uint32_t timestamp_ms;",
            "} FeatureVector_t;",
            "",
            "// Model inference result",
            "typedef struct {",
            "    float prediction;",
            "    float confidence;",
            "    uint16_t inference_us;",
            "    int8_t decision_path;",
            "} InferenceResult_t;",
            "",
            "void BIP_InferenceInit(void);",
            "InferenceResult_t BIP_Inference(const FeatureVector_t* features);",
            "void BIP_ExtractFeatures(const AdcSample_t* samples, uint32_t num_samples, FeatureVector_t* features);",
            "void BIP_ScaleFeatures(const float* raw_features, float* scaled_features);",
            "",
            "#ifdef __cplusplus",
            "}",
            "#endif",
            "",
            f"#endif // {name_upper}_INFERENCE_H",
            "",
        ]

        h_file.write_text("\n".join(lines), encoding="utf-8")
        return h_file

    def _generate_features_header(self, feature_names: list[str], name: str, out_dir: Path) -> Path:
        h_file = out_dir / f"{name}_features.h"
        name_upper = name.upper()

        lines = [
            f"#ifndef {name_upper}_FEATURES_H",
            f"#define {name_upper}_FEATURES_H",
            "",
            f"#define BIP_NUM_FEATURES {len(feature_names)}",
            "",
            "typedef enum {",
        ]

        for idx, _ in enumerate(feature_names):
            lines.append(f"    BIP_FEATURE_{idx} = {idx},")

        lines.extend([
            "} BipFeatureIndex_e;",
            "",
            "static const char* bip_feature_names[BIP_NUM_FEATURES] = {",
        ])

        for fname in feature_names:
            lines.append(f'    "{fname}",')

        lines.extend([
            "};",
            "",
            f"#endif // {name_upper}_FEATURES_H",
            "",
        ])

        h_file.write_text("\n".join(lines), encoding="utf-8")
        return h_file

    def _generate_model_params_header(self, model: Any, name: str, out_dir: Path) -> Path:
        h_file = out_dir / f"{name}_params.h"
        name_upper = name.upper()

        if isinstance(model, Ridge):
            coeffs = np.asarray(model.coef_, dtype=float).reshape(-1)
            intercept = float(model.intercept_)
            coeffs_text = ", ".join(f"{float(v):.8f}f" for v in coeffs)

            lines = [
                f"#ifndef {name_upper}_PARAMS_H",
                f"#define {name_upper}_PARAMS_H",
                "",
                "#include <stdint.h>",
                "",
                f"#define BIP_MODEL_COEFFS_LEN {len(coeffs)}",
                "",
                f"static const float bip_model_coeffs[BIP_MODEL_COEFFS_LEN] = {{",
                coeffs_text,
                "};",
                "",
                f"#define BIP_MODEL_INTERCEPT {intercept:.8f}f",
                "",
                "static inline float BIP_ModelPredict(const float* scaled_features) {",
                "    float sum = BIP_MODEL_INTERCEPT;",
                "    for (uint16_t i = 0; i < BIP_MODEL_COEFFS_LEN; i++) {",
                "        sum += bip_model_coeffs[i] * scaled_features[i];",
                "    }",
                "    return sum;",
                "}",
                "",
                f"#endif // {name_upper}_PARAMS_H",
                "",
            ]
        else:
            tree = getattr(model, "tree_", None)
            if tree is None:
                lines = [
                    f"#ifndef {name_upper}_PARAMS_H",
                    f"#define {name_upper}_PARAMS_H",
                    "",
                    "#define BIP_MODEL_INTERCEPT 0.0f",
                    "",
                    f"#endif // {name_upper}_PARAMS_H",
                    "",
                ]
            else:
                lines = [
                    f"#ifndef {name_upper}_PARAMS_H",
                    f"#define {name_upper}_PARAMS_H",
                    "",
                    "#include <stdint.h>",
                    "",
                    "typedef struct {",
                    "    int16_t feature;",
                    "    float threshold;",
                    "    int16_t left;",
                    "    int16_t right;",
                    "    float value;",
                    "} TreeNode_t;",
                    "",
                    f"#define BIP_TREE_NODES {tree.node_count}",
                    "",
                    "static const TreeNode_t bip_tree[BIP_TREE_NODES] = {",
                ]
                for node_id in range(tree.node_count):
                    feature = int(tree.feature[node_id])
                    threshold = float(tree.threshold[node_id])
                    left = int(tree.children_left[node_id])
                    right = int(tree.children_right[node_id])
                    value = float(tree.value[node_id, 0, 0])
                    lines.append(f"    {{ {feature}, {threshold:.8f}f, {left}, {right}, {value:.8f}f }},")
                lines.extend([
                    "};",
                    "",
                    "static inline float BIP_ModelPredict(const float* scaled_features) {",
                    "    int node = 0;",
                    "    while (bip_tree[node].feature >= 0) {",
                    "        if (scaled_features[bip_tree[node].feature] <= bip_tree[node].threshold) {",
                    "            node = bip_tree[node].left;",
                    "        } else {",
                    "            node = bip_tree[node].right;",
                    "        }",
                    "    }",
                    "    return bip_tree[node].value;",
                    "}",
                    "",
                    f"#endif // {name_upper}_PARAMS_H",
                    "",
                ])

        h_file.write_text("\n".join(lines), encoding="utf-8")
        return h_file

    def _generate_scaler_header(self, scaler_params: Optional[Dict[str, Any]], name: str, out_dir: Path) -> Path:
        h_file = out_dir / f"{name}_scaler.h"
        name_upper = name.upper()

        if scaler_params is None:
            mean_vals = [0.0] * 37
            scale_vals = [1.0] * 37
        else:
            mean_vals = scaler_params.get("mean", [0.0] * 37)
            scale_vals = scaler_params.get("scale", [1.0] * 37)

        lines = [
            f"#ifndef {name_upper}_SCALER_H",
            f"#define {name_upper}_SCALER_H",
            "",
            "#include <stdint.h>",
            "",
            f"#define NUM_FEATURES {len(mean_vals)}",
            "",
            "static const float bip_scaler_mean[NUM_FEATURES] = {",
        ]

        for val in mean_vals:
            lines.append(f"    {float(val):.8f}f,")

        lines.extend([
            "};",
            "",
            "static const float bip_scaler_scale[NUM_FEATURES] = {",
        ])

        for val in scale_vals:
            lines.append(f"    {float(val):.8f}f,")

        lines.extend([
            "};",
            "",
            "static inline void BIP_ScaleFeatures(const float* raw, float* scaled) {",
            "    for (uint8_t i = 0; i < NUM_FEATURES; i++) {",
            "        scaled[i] = (raw[i] - bip_scaler_mean[i]) / bip_scaler_scale[i];",
            "    }",
            "}",
            "",
            f"#endif // {name_upper}_SCALER_H",
            "",
        ])

        h_file.write_text("\n".join(lines), encoding="utf-8")
        return h_file

    def _generate_inference_implementation(self, model: Any, feature_names: list[str], name: str, out_dir: Path) -> Path:
        c_file = out_dir / f"{name}_inference.c"

        content = f"""#include "{name}_inference.h"
#include "{name}_features.h"
#include "{name}_params.h"
#include "{name}_scaler.h"
#include <string.h>

static struct {{
    uint8_t initialized;
    uint32_t inference_count;
}} bip_state = {{0}};

static inline uint32_t HAL_GetTick(void) {{
    return 0;
}}

void BIP_InferenceInit(void) {{
    bip_state.initialized = 1;
    bip_state.inference_count = 0;
}}

void BIP_ExtractFeatures(const AdcSample_t* samples, uint32_t num_samples, FeatureVector_t* features) {{
    if (!samples || !features || num_samples == 0) return;
    for (uint8_t i = 0; i < BIP_NUM_FEATURES; i++) {{
        features->features[i] = 0.0f;
    }}
    features->timestamp_ms = HAL_GetTick();
}}

InferenceResult_t BIP_Inference(const FeatureVector_t* features) {{
    InferenceResult_t result = {{0}};
    if (!features || !bip_state.initialized) {{
        result.prediction = 0.0f;
        result.confidence = 0.0f;
        return result;
    }}

    float scaled_features[BIP_NUM_FEATURES];
    BIP_ScaleFeatures(features->features, scaled_features);

    result.prediction = BIP_ModelPredict(scaled_features);
    result.confidence = 0.95f;
    result.inference_us = 100;
    result.decision_path = 0;

    bip_state.inference_count++;
    return result;
}}
"""

        c_file.write_text(content, encoding="utf-8")
        return c_file

    def _generate_metadata(self, model: Any, feature_names: list[str], name: str, out_dir: Path) -> Path:
        metadata = {
            "model_type": type(model).__name__,
            "feature_count": len(feature_names),
            "target_mcu": self.config.target_mcu,
            "sampling_rate_hz": self.config.sampling_rate_hz,
        }
        metadata_path = out_dir / f"{name}_metadata.json"
        metadata_path.write_text(json.dumps(metadata, indent=2, sort_keys=True), encoding="utf-8")
        return metadata_path


__all__ = ["STM32ModelExporter", "STM32InferenceConfig"]
