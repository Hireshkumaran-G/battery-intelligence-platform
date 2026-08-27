/**
  ******************************************************************************
  * @file    stm32f446re_bms_config.h
  * @brief   Hardware Configuration & Calibration for STM32F446RE
  *          Tailored for User's Exact Component List:
  *          - 18650 Li-ion Cell (3.0V - 4.2V)
  *          - 27 kΩ Resistor (R1, upper divider arm)
  *          - 10 kΩ Resistor (R2, lower divider arm)
  *          - 100 nF Ceramic Capacitor (Noise filter parallel to R2)
  *          - 10 Ω, 5W Power Resistor (Discharge Load)
  *          - STM32F446RE Nucleo board
  ******************************************************************************
  */

#ifndef STM32F446RE_BMS_CONFIG_H
#define STM32F446RE_BMS_CONFIG_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>

/* ============================================================================
 * 1. ADC & SAMPLING PARAMETERS
 * ============================================================================ */
#define BMS_SAMPLING_RATE_HZ     1000.0f  /* 1 kHz continuous sampling rate */
#define BMS_ADC_CHANNELS         1        /* PA0 (ADC1_IN0) Battery Voltage Sense */
#define BMS_WINDOW_SAMPLES       256      /* Samples per feature window (4 Hz update rate) */

#define BMS_DMA_BUFFER_SIZE      (BMS_WINDOW_SAMPLES * BMS_ADC_CHANNELS * 2) /* Ping-pong double buffer */

#define BMS_ADC_VREF_V           3.30f    /* MCU Analog Reference Voltage (3.3V) */
#define BMS_ADC_MAX_COUNT        4095.0f  /* 12-bit ADC max resolution count */

/* ============================================================================
 * 2. VOLTAGE DIVIDER CALIBRATION (PA0 / ADC1_IN0)
 * Circuit: Battery(+) -> R1 (27kΩ) -> [PA0 Pin] -> R2 (10kΩ) -> GND
 *          100nF Capacitor connected in parallel across R2 (PA0 to GND)
 * Multiplier: (27k + 10k) / 10k = 3.7000
 * Range: 4.2V Batt -> 1.135V at PA0 Pin (100% safe for 3.3V ADC)
 * ============================================================================ */
#define BMS_V_DIVIDER_R1_OHMS    27000.0f /* 27 kΩ Resistor */
#define BMS_V_DIVIDER_R2_OHMS    10000.0f /* 10 kΩ Resistor */
#define BMS_V_DIVIDER_RATIO      ((BMS_V_DIVIDER_R1_OHMS + BMS_V_DIVIDER_R2_OHMS) / BMS_V_DIVIDER_R2_OHMS) /* 3.7000f */

/* ============================================================================
 * 3. DISCHARGE LOAD CURRENT CALIBRATION
 * Circuit: 10 Ω, 5W Power Resistor connected across 18650 cell terminal
 * Discharge Current (Ohm's Law): I = V_batt / R_load
 * At 4.2V -> I = 0.42A (420 mA), Power = 1.76W (Safe for 5W resistor)
 * ============================================================================ */
#define BMS_LOAD_RESISTOR_OHMS   10.0f    /* 10 Ω, 5W Power Resistor */

/* Default Ambient Temperature Baseline */
#define BMS_DEFAULT_TEMP_C       25.0f    /* Room temperature in Celsius */

#ifdef __cplusplus
}
#endif

#endif /* STM32F446RE_BMS_CONFIG_H */
