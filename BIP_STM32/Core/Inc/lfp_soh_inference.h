#ifndef LFP_SOH_INFERENCE_H
#define LFP_SOH_INFERENCE_H

#include <stdint.h>
#include <stddef.h>
#include "lfp_soh_features.h"
#include "lfp_soh_scaler.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Battery Intelligence Platform (BIP) - Embedded Model Inference
 * Target: STM32F446RE
 * Sampling Rate: 1000.0 Hz
 * Model Type: Ridge Regression / Tree Model
 */

// Raw ADC input
typedef struct {
    float voltage_v;
    float current_a;
    float temperature_c;
} AdcSample_t;

// Extracted feature vector
typedef struct {
    float features[BIP_NUM_FEATURES];
    uint32_t timestamp_ms;
} FeatureVector_t;

// Model inference result
typedef struct {
    float prediction;
    float confidence;
    uint16_t inference_us;
    int8_t decision_path;
} InferenceResult_t;

void BIP_InferenceInit(void);
InferenceResult_t BIP_Inference(const FeatureVector_t* features);
void BIP_ExtractFeatures(const AdcSample_t* samples, uint32_t num_samples, FeatureVector_t* features);

#ifdef __cplusplus
}
#endif

#endif // LFP_SOH_INFERENCE_H
