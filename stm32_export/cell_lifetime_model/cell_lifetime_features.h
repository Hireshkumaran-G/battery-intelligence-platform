#ifndef CELL_LIFETIME_FEATURES_H
#define CELL_LIFETIME_FEATURES_H

#define BIP_NUM_FEATURES 9

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
} BipFeatureIndex_e;

static const char* bip_feature_names[BIP_NUM_FEATURES] = {
    "D1_ripple",
    "D2_ripple",
    "snr_dB",
    "v_mean",
    "v_std",
    "v_min",
    "v_max",
    "tavg",
    "chargetime",
};

#endif // CELL_LIFETIME_FEATURES_H
