#ifndef NMC_SOH_SCALER_H
#define NMC_SOH_SCALER_H

#include <stdint.h>

#define NUM_FEATURES 18

static const float bip_scaler_mean[NUM_FEATURES] = {
    3.75765878f,
    0.13714072f,
    3.45814819f,
    4.02799564f,
    -0.02870850f,
    -0.68408493f,
    -0.74000000f,
    0.00000000f,
    40.76428839f,
    0.47267898f,
    2481.25786017f,
    3600.00000000f,
    0.00510552f,
    0.00563997f,
    0.00027841f,
    0.00040530f,
    58861.61107153f,
    2.91734571f,
};

static const float bip_scaler_scale[NUM_FEATURES] = {
    0.00576722f,
    0.00470400f,
    0.01642224f,
    0.01298496f,
    0.06492467f,
    0.12247792f,
    1.00000000f,
    0.00000000f,
    1.81912566f,
    0.11016483f,
    192.45503791f,
    1.00000000f,
    0.00116416f,
    0.00024661f,
    0.00001993f,
    0.00003163f,
    12897.44726374f,
    0.08266710f,
};

static inline void BIP_ScaleFeatures(const float* raw, float* scaled) {
    for (uint8_t i = 0; i < NUM_FEATURES; i++) {
        scaled[i] = (raw[i] - bip_scaler_mean[i]) / bip_scaler_scale[i];
    }
}

#endif // NMC_SOH_SCALER_H
