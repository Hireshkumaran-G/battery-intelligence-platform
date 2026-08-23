#ifndef LCO_SOH_FEATURES_H
#define LCO_SOH_FEATURES_H

#define BIP_NUM_FEATURES 18

typedef enum {
    BIP_FEATURE_0 = 0,
    BIP_FEATURE_1 = 1,
    BIP_FEATURE_2 = 2,
    BIP_FEATURE_3 = 3,
    BIP_FEATURE_4 = 4,
    BIP_FEATURE_5 = 5,
    BIP_FEATURE_6 = 6,
    BIP_FEATURE_7 = 7,
    BIP_FEATURE_8 = 8,
    BIP_FEATURE_9 = 9,
    BIP_FEATURE_10 = 10,
    BIP_FEATURE_11 = 11,
    BIP_FEATURE_12 = 12,
    BIP_FEATURE_13 = 13,
    BIP_FEATURE_14 = 14,
    BIP_FEATURE_15 = 15,
    BIP_FEATURE_16 = 16,
    BIP_FEATURE_17 = 17,
} BipFeatureIndex_e;

static const char* bip_feature_names[BIP_NUM_FEATURES] = {
    "voltage_mean",
    "voltage_std",
    "voltage_min",
    "voltage_max",
    "voltage_skewness",
    "voltage_kurtosis",
    "current_mean",
    "current_std",
    "temperature_mean",
    "temperature_std",
    "discharge_duration_s",
    "charge_time_s",
    "ripple_norm_deg2",
    "D1_ripple",
    "D2_ripple",
    "dominant_frequency",
    "fft_energy",
    "spectral_entropy",
};

#endif // LCO_SOH_FEATURES_H
