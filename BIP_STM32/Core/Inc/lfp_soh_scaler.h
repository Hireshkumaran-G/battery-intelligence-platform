#ifndef LFP_SOH_SCALER_H
#define LFP_SOH_SCALER_H

#include <stdint.h>

#define NUM_FEATURES 18

static const float bip_scaler_mean[NUM_FEATURES] __attribute__((unused)) = {
    2.93601297f,
    0.26979157f,
    2.20199265f,
    3.24411493f,
    -1.25771077f,
    0.39187516f,
    -3.99839146f,
    0.00827545f,
    32.28216076f,
    1.29810675f,
    14.97070610f,
    0.00000000f,
    0.03406245f,
    0.01029713f,
    0.00234392f,
    0.00356844f,
    2892.34142739f,
    2.67543851f,
};

static const float bip_scaler_scale[NUM_FEATURES] __attribute__((unused)) = {
    0.03725504f,
    0.02956872f,
    0.07444143f,
    0.01242116f,
    0.11519569f,
    0.33636143f,
    0.02336976f,
    0.05300363f,
    1.38609583f,
    0.47315044f,
    7.68741776f,
    1.00000000f,
    0.00317601f,
    0.00082174f,
    0.00048660f,
    0.00009626f,
    664.44829695f,
    0.11819578f,
};

static inline void BIP_ScaleFeatures(const float* raw, float* scaled) {
    for (uint8_t i = 0; i < NUM_FEATURES; i++) {
        scaled[i] = (raw[i] - bip_scaler_mean[i]) / bip_scaler_scale[i];
    }
}

#endif // LFP_SOH_SCALER_H
