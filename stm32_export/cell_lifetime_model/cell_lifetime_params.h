#ifndef CELL_LIFETIME_PARAMS_H
#define CELL_LIFETIME_PARAMS_H

#include <stdint.h>

typedef struct {
    int16_t feature;
    float threshold;
    int16_t left;
    int16_t right;
    float value;
} TreeNode_t;

#define BIP_TREE_NODES 1

static const TreeNode_t bip_tree[BIP_TREE_NODES] = {
    { -2, -2.00000000f, -1, -1, 1.00000000f },
};

static inline float BIP_ModelPredict(const float* scaled_features) {
    int node = 0;
    while (bip_tree[node].feature >= 0) {
        if (scaled_features[bip_tree[node].feature] <= bip_tree[node].threshold) {
            node = bip_tree[node].left;
        } else {
            node = bip_tree[node].right;
        }
    }
    return bip_tree[node].value;
}

#endif // CELL_LIFETIME_PARAMS_H
