#include "lfp_soh_inference.h"
#include "lfp_soh_features.h"
#include "lfp_soh_params.h"
#include "lfp_soh_scaler.h"
#include <string.h>
#include "main.h"

static struct {
    uint8_t initialized;
    uint32_t inference_count;
} bip_state = {0};

void BIP_InferenceInit(void) {
    bip_state.initialized = 1;
    bip_state.inference_count = 0;
}

void BIP_ExtractFeatures(const AdcSample_t* samples, uint32_t num_samples, FeatureVector_t* features) {
    if (!samples || !features || num_samples == 0) return;
    for (uint8_t i = 0; i < BIP_NUM_FEATURES; i++) {
        features->features[i] = 0.0f;
    }
    features->timestamp_ms = HAL_GetTick();
}

InferenceResult_t BIP_Inference(const FeatureVector_t* features) {
    InferenceResult_t result = {0};
    if (!features || !bip_state.initialized) {
        result.prediction = 0.0f;
        result.confidence = 0.0f;
        return result;
    }

    float scaled_features[BIP_NUM_FEATURES];
    BIP_ScaleFeatures(features->features, scaled_features);

    result.prediction = BIP_ModelPredict(scaled_features);
    result.confidence = 0.95f;
    result.inference_us = 100;
    result.decision_path = 0;

    bip_state.inference_count++;
    return result;
}
