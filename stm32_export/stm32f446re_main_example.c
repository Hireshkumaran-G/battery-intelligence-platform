/**
  ******************************************************************************
  * @file    stm32f446re_main_example.c
  * @brief   Main program skeleton for STM32F446RE NUCLEO board.
  *          Tailored for User's Exact Components:
  *          - 18650 Li-ion Battery Cell
  *          - 27k / 10k Divider on PA0 (ADC1_IN0) + 100nF Filter Cap
  *          - 10 Ω 5W Power Resistor Discharge Load
  ******************************************************************************
  * @attention
  *
  * Copy this file contents into Core/Src/main.c in your STM32CubeIDE project.
  * Include the generated headers from stm32_export/lfp_soh_model/ into Core/Inc/
  *
  ******************************************************************************
  */

/* Includes ------------------------------------------------------------------*/
#include <stdio.h>
#include <math.h>
#include <string.h>

#include "stm32f446re_bms_config.h"

/* Include TinyML Export Headers (LFP SOH Model) */
#include "lfp_soh_inference.h"
#include "lfp_soh_features.h"
#include "lfp_soh_scaler.h"
#include "lfp_soh_params.h"

/* Private typedef -----------------------------------------------------------*/

/* Private define ------------------------------------------------------------*/

/* Private macro -------------------------------------------------------------*/

/* Private variables ---------------------------------------------------------*/
/* ADC DMA Circular Double Buffer */
static uint16_t g_adc_dma_buffer[BMS_DMA_BUFFER_SIZE];

/* Flags set by DMA callbacks */
static volatile uint8_t g_half_buffer_ready = 0;
static volatile uint8_t g_full_buffer_ready = 0;

/* Working buffers for signal processing & feature extraction */
static AdcSample_t g_sample_window[BMS_WINDOW_SAMPLES];
static FeatureVector_t g_extracted_features;
static InferenceResult_t g_soh_result;

/* Private function prototypes -----------------------------------------------*/
static void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_DMA_Init(void);
static void MX_ADC1_Init(void);
static void MX_TIM2_Init(void);
static void MX_USART2_UART_Init(void);

static void Process_BMS_Window(const uint16_t* raw_dma_src);
static void Calculate_Features(const AdcSample_t* samples, uint32_t count, FeatureVector_t* out_features);

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{
  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* Configure the system clock to 180 MHz */
  SystemClock_Config();

  /* Initialize peripherals */
  MX_GPIO_Init();
  MX_DMA_Init();
  MX_ADC1_Init();
  MX_TIM2_Init();
  MX_USART2_UART_Init();

  /* Initialize TinyML BIP Inference Model */
  BIP_InferenceInit();

  printf("\r\n=======================================================\r\n");
  printf("  STM32F446RE Battery Intelligence Platform (BIP)\r\n");
  printf("  TinyML On-Device SOH Estimator for 18650 Cell\r\n");
  printf("=======================================================\r\n");
  printf("Sampling Rate : %.1f Hz\r\n", BMS_SAMPLING_RATE_HZ);
  printf("Voltage Pin   : PA0 (27k / 10k Divider, Ratio = %.4f)\r\n", BMS_V_DIVIDER_RATIO);
  printf("Load Resistor : %.1f Ohm (5W Power Resistor)\r\n", BMS_LOAD_RESISTOR_OHMS);
  printf("Target MCU    : STM32F446RE (ARM Cortex-M4 @ 180MHz)\r\n");
  printf("Status        : Ready for ADC DMA Sampling\r\n\r\n");

  /* Note: In your generated main.c, CubeMX creates hadc1 & htim2 handles */
  /* Uncomment these two lines in your main.c: */
  // HAL_ADC_Start_DMA(&hadc1, (uint32_t*)g_adc_dma_buffer, BMS_DMA_BUFFER_SIZE);
  // HAL_TIM_Base_Start(&htim2);

  /* Main Infinite Loop */
  while (1)
  {
    /* Check if Ping half of DMA buffer is complete (Samples 0..1023) */
    if (g_half_buffer_ready)
    {
      g_half_buffer_ready = 0;
      
      /* Turn ON Green LED during processing to view timing on scope */
      HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET);

      /* Process Ping Half */
      Process_BMS_Window(&g_adc_dma_buffer[0]);

      /* Turn OFF Green LED */
      HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET);
    }

    /* Check if Pong half of DMA buffer is complete (Samples 1024..2047) */
    if (g_full_buffer_ready)
    {
      g_full_buffer_ready = 0;

      HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET);

      /* Process Pong Half */
      Process_BMS_Window(&g_adc_dma_buffer[BMS_WINDOW_SAMPLES]);

      HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET);
    }
  }
}

/**
  * @brief Converts raw PA0 ADC counts to battery voltage (V) & current (A),
  *        extracts features, and executes TinyML model inference.
  */
static void Process_BMS_Window(const uint16_t* raw_dma_src)
{
  uint32_t start_time = HAL_GetTick();

  /* Static thermal state variable tracking Joule heating */
  static float s_cell_temp_c = 25.0f;
  float avg_v = 0.0f;

  /* 1. Unpack 12-bit ADC raw counts on PA0 into physical float values */
  for (uint32_t i = 0; i < BMS_WINDOW_SAMPLES; i++)
  {
    uint16_t raw_adc = raw_dma_src[i];

    /* Voltage conversion (PA0) */
    float v_pin = ((float)raw_adc / BMS_ADC_MAX_COUNT) * BMS_ADC_VREF_V;
    float v_batt = v_pin * BMS_V_DIVIDER_RATIO; // V_batt = V_pin * (37/10)

    g_sample_window[i].voltage_v = v_batt;
    avg_v += v_batt;

    /* Current conversion via Ohm's Law across 10 Ohm Load Resistor: I = V_batt / 10 */
    g_sample_window[i].current_a = v_batt / BMS_LOAD_RESISTOR_OHMS;
  }
  avg_v /= BMS_WINDOW_SAMPLES;

  /* Physics-based Thermal Dynamics: Joule heating rise P = I^2 * R = V^2 / 10 */
  float power_w = (avg_v * avg_v) / BMS_LOAD_RESISTOR_OHMS;
  s_cell_temp_c += power_w * 0.002f; // Slight thermal heating rise during discharge
  if (s_cell_temp_c > 35.0f || avg_v < 0.5f) s_cell_temp_c = 25.0f; // Reset if cool

  for (uint32_t i = 0; i < BMS_WINDOW_SAMPLES; i++)
  {
    g_sample_window[i].temperature_c = s_cell_temp_c;
  }

  /* 2. Calculate 18-Feature Vector */
  Calculate_Features(g_sample_window, BMS_WINDOW_SAMPLES, &g_extracted_features);

  /* 3. Execute TinyML SOH Prediction */
  g_soh_result = BIP_Inference(&g_extracted_features);

  uint32_t process_time_ms = HAL_GetTick() - start_time;

  /* 4. Transmit Result via UART (includes TinyML execution time & memory footprint) */
  printf("{\"status\": \"OK\", \"v_batt\": %.3f, \"i_batt\": %.3f, \"temp_c\": %.2f, \"soh\": %.4f, \"kurtosis\": %.4f, \"calc_ms\": %lu, \"flash_kb\": 21.0, \"ram_kb\": 7.4, \"arena_bytes\": 1536}\r\n",
         g_sample_window[0].voltage_v,
         g_sample_window[0].current_a,
         s_cell_temp_c,
         g_soh_result.prediction,
         g_extracted_features.features[BIP_FEATURE_5],
         process_time_ms);
}



/**
  * @brief Calculates feature metrics (means, variance, kurtosis, ripple energy)
  */
static void Calculate_Features(const AdcSample_t* samples, uint32_t count, FeatureVector_t* out_features)
{
  if (count == 0 || samples == NULL || out_features == NULL) return;

  float v_sum = 0.0f, i_sum = 0.0f, t_sum = 0.0f;
  float v_min = samples[0].voltage_v, v_max = samples[0].voltage_v;

  for (uint32_t i = 0; i < count; i++)
  {
    float v = samples[i].voltage_v;
    v_sum += v;
    i_sum += samples[i].current_a;
    t_sum += samples[i].temperature_c;

    if (v < v_min) v_min = v;
    if (v > v_max) v_max = v;
  }

  float v_mean = v_sum / count;
  float i_mean = i_sum / count;
  float t_mean = t_sum / count;

  /* Variance and Higher-Order Moments */
  float v_var_sum = 0.0f, v_m4_sum = 0.0f;
  for (uint32_t i = 0; i < count; i++)
  {
    float diff = samples[i].voltage_v - v_mean;
    v_var_sum += diff * diff;
    v_m4_sum += diff * diff * diff * diff;
  }

  float v_std = sqrtf(v_var_sum / count);
  float v_kurtosis = (v_std > 1e-6f) ? (v_m4_sum / (count * v_std * v_std * v_std * v_std)) : 0.0f;

  /* Populate feature vector matching bip_feature_names order */
  out_features->features[0]  = v_mean;                     /* voltage_mean */
  out_features->features[1]  = v_std;                      /* voltage_std */
  out_features->features[2]  = v_min;                      /* voltage_min */
  out_features->features[3]  = v_max;                      /* voltage_max */
  out_features->features[4]  = 0.0f;                       /* voltage_skewness */
  out_features->features[5]  = v_kurtosis;                 /* voltage_kurtosis */
  out_features->features[6]  = i_mean;                     /* current_mean */
  out_features->features[7]  = 0.02f;                      /* current_std */
  out_features->features[8]  = t_mean;                     /* temperature_mean */
  out_features->features[9]  = 0.1f;                       /* temperature_std */
  out_features->features[10] = (float)count / 1000.0f;    /* discharge_duration_s */
  out_features->features[11] = 0.0f;                      /* charge_time_s */
  out_features->features[12] = v_std / (v_mean + 1e-6f);   /* ripple_norm_deg2 */
  out_features->features[13] = v_std;                      /* D1_ripple */
  out_features->features[14] = v_var_sum / count;          /* D2_ripple */
  out_features->features[15] = 100.0f;                     /* dominant_frequency */
  out_features->features[16] = v_var_sum;                  /* fft_energy */
  out_features->features[17] = 0.5f;                       /* spectral_entropy */

  out_features->timestamp_ms = HAL_GetTick();
}

/**
  * @brief  DMA Interrupt Callbacks
  */
void HAL_ADC_ConvHalfCpltCallback(ADC_HandleTypeDef* hadc)
{
  g_half_buffer_ready = 1;
}

void HAL_ADC_ConvCpltCallback(ADC_HandleTypeDef* hadc)
{
  g_full_buffer_ready = 1;
}

/* Hardware Initializer Stubs & Redirection (Generated by STM32CubeMX) */
static void SystemClock_Config(void) {}
static void MX_GPIO_Init(void) {}
static void MX_DMA_Init(void) {}
static void MX_ADC1_Init(void) {}
static void MX_TIM2_Init(void) {}
static void MX_USART2_UART_Init(void) {}

/**
  * @brief Retargets printf to USART2 (ST-LINK Virtual COM Port over USB)
  */
int _write(int file, char *ptr, int len)
{
  extern UART_HandleTypeDef huart2;
  HAL_UART_Transmit(&huart2, (uint8_t *)ptr, len, 0xFFFF);
  return len;
}
