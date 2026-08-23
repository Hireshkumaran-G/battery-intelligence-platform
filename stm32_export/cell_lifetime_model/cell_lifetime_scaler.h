#ifndef CELL_LIFETIME_SCALER_H
#define CELL_LIFETIME_SCALER_H

#include <stdint.h>

#define NUM_FEATURES 9

static const float bip_scaler_mean[NUM_FEATURES] = {
    0.03575179f,
    0.01374228f,
    15.64255755f,
    3.11212956f,
    0.52114325f,
    1.99969077f,
    3.60031608f,
    32.17149695f,
    11.55134189f,
};

static const float bip_scaler_scale[NUM_FEATURES] = {
    0.00058252f,
    0.00100226f,
    0.09553220f,
    0.00551858f,
    0.00521752f,
    0.00008898f,
    0.00003692f,
    0.85191758f,
    1.07329288f,
};

static inline void BIP_ScaleFeatures(const float* raw, float* scaled) {
    for (uint8_t i = 0; i < NUM_FEATURES; i++) {
        scaled[i] = (raw[i] - bip_scaler_mean[i]) / bip_scaler_scale[i];
    }
}

#endif // CELL_LIFETIME_SCALER_H
