# Dataset Instructions

This directory contains raw battery cycling datasets used by the Battery Intelligence Platform.

## ⚠️ Datasets are NOT included in this repository (too large for Git)

You must download and place the following files manually:

---

## 1. LFP — Severson et al. (Stanford/MIT)
**Path**: `data/raw/severson_mat/`

Download `batch_1.mat` and `batch_2.mat` from:
> https://data.matr.io/1/projects/5c48dd2bc625d700019f3204

Place them as:
```
data/raw/severson_mat/batch_1.mat
data/raw/severson_mat/batch_2.mat
```

---

## 2. NMC — Oxford Battery Degradation Dataset
**Path**: `data/raw/`

Download `Oxford_Battery_Degradation_Dataset_1.mat` from:
> https://ora.ox.ac.uk/objects/uuid:03ba4b01-cfed-46d3-9b1a-7d4a7bdf6fac

Place it as:
```
data/raw/Oxford_Battery_Degradation_Dataset_1.mat
```

---

## 3. LCO — NASA Ames Prognostics Battery Dataset
**Path**: `data/raw/`

The `build_master_dataset.py` script **auto-downloads** these files on first run.
Alternatively, download manually from:
> https://www.nasa.gov/intelligent-systems-division/discovery-and-systems-health/pcoe/pcoe-data-set-repository/

Files needed: `B0005.mat`, `B0006.mat`, `B0007.mat`, `B0018.mat`

Place them as:
```
data/raw/B0005.mat
data/raw/B0006.mat
data/raw/B0007.mat
data/raw/B0018.mat
```

---

Once all files are in place, run:
```bash
python scripts/build_master_dataset.py
```
