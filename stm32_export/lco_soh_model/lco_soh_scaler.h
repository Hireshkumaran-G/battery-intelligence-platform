#ifndef LCO_SOH_SCALER_H
#define LCO_SOH_SCALER_H

#include <stdint.h>

#define NUM_FEATURES 18

static const float bip_scaler_mean[NUM_FEATURES] = {
    3.51843253f,
    0.13682969f,
    3.25774606f,
    3.79981107f,
    0.27185877f,
    -0.83992823f,
    -2.00505164f,
    0.00158149f,
    32.00948840f,
    2.59083492f,
    2852.29585535f,
    10366.34457547f,
    0.00365645f,
    0.00536610f,
    0.00025603f,
    0.00490739f,
    442.74078533f,
    2.69675573f,
};

static const float bip_scaler_scale[NUM_FEATURES] = {
    0.05713596f,
    0.01092567f,
    0.08741532f,
    0.04006088f,
    0.08593021f,
    0.05545128f,
    0.00940018f,
    0.00037907f,
    0.85939312f,
    0.32376062f,
    358.47119733f,
    957.03697770f,
    0.00085230f,
    0.00052000f,
    0.00004315f,
    0.00112430f,
    154.51104444f,
    0.08230000f,
};

static inline void BIP_ScaleFeatures(const float* raw, float* scaled) {
    for (uint8_t i = 0; i < NUM_FEATURES; i++) {
        scaled[i] = (raw[i] - bip_scaler_mean[i]) / bip_scaler_scale[i];
    }
}

#endif // LCO_SOH_SCALER_H
