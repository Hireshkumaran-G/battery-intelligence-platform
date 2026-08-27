/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body for Battery Intelligence Platform (BIP)
  *                   TinyML On-Device SOH Estimator for 18650 Li-ion Cell
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2026 STMicroelectronics.
  * All rights reserved.
  *
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "adc.h"
#include "dma.h"
#include "tim.h"
#include "usart.h"
#include "gpio.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include <stdio.h>
#include <math.h>
#include <string.h>

#include "stm32f446re_bms_config.h"
#include "lfp_soh_inference.h"
#include "lfp_soh_features.h"
#include "lfp_soh_scaler.h"
#include "lfp_soh_params.h"
/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/

/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/

/* USER CODE BEGIN PV */
/* ADC DMA Circular Double Buffer */
static uint16_t g_adc_dma_buffer[BMS_DMA_BUFFER_SIZE];

/* Flags set by DMA callbacks */
static volatile uint8_t g_half_buffer_ready = 0;
static volatile uint8_t g_full_buffer_ready = 0;

/* Working buffers for signal processing & feature extraction */
static AdcSample_t g_sample_window[BMS_WINDOW_SAMPLES];
static FeatureVector_t g_extracted_features;
static InferenceResult_t g_soh_result;
/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
/* USER CODE BEGIN PFP */
static void Process_BMS_Window(const uint16_t* raw_dma_src);
static void Calculate_Features(const AdcSample_t* samples, uint32_t count, FeatureVector_t* out_features);
/* USER CODE END PFP */

/* Private user code --------------------------------------------------------- */
/* USER CODE BEGIN 0 */
/**
  * @brief Retargets printf to USART2 (ST-LINK Virtual COM Port over USB)
  */
int _write(int file, char *ptr, int len)
{
  HAL_UART_Transmit(&huart2, (uint8_t *)ptr, len, 0xFFFF);
  return len;
}

/**
  * @brief DMA Interrupt Callbacks
  */
void HAL_ADC_ConvHalfCpltCallback(ADC_HandleTypeDef* hadc)
{
  g_half_buffer_ready = 1;
}

void HAL_ADC_ConvCpltCallback(ADC_HandleTypeDef* hadc)
{
  g_full_buffer_ready = 1;
}
/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{

  /* USER CODE BEGIN 1 */

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* USER CODE BEGIN Init */

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_DMA_Init();
  MX_ADC1_Init();
  MX_USART2_UART_Init();
  MX_TIM2_Init();
  /* USER CODE BEGIN 2 */
  /* Initialize leds and buttons */
  BSP_LED_Init(LED2);
  BSP_PB_Init(BUTTON_USER, BUTTON_MODE_EXTI);

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
  printf("Status        : Ready for ADC DMA Continuous Sampling\r\n\r\n");

  /* Start ADC DMA continuous transfer */
  if (HAL_ADC_Start_DMA(&hadc1, (uint32_t*)g_adc_dma_buffer, BMS_DMA_BUFFER_SIZE) != HAL_OK)
  {
    Error_Handler();
  }

  /* Start TIM2 base timer (triggers ADC1 via TRGO at 1kHz) */
  if (HAL_TIM_Base_Start(&htim2) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */
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

      /* Turn ON Green LED during processing to view timing on scope */
      HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET);

      /* Process Pong Half */
      Process_BMS_Window(&g_adc_dma_buffer[BMS_WINDOW_SAMPLES]);

      /* Turn OFF Green LED */
      HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET);
    }
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
  }
  /* USER CODE END 3 */
}

/**
  * @brief Converts raw PA0 ADC counts to battery voltage (V) & current (A),
  *        extracts features, and executes TinyML model inference.
  */
static void Process_BMS_Window(const uint16_t* raw_dma_src)
{
  uint32_t start_time = HAL_GetTick();

  /* 1. Unpack 12-bit ADC raw counts on PA0 into physical float values */
  for (uint32_t i = 0; i < BMS_WINDOW_SAMPLES; i++)
  {
    uint16_t raw_adc = raw_dma_src[i];

    /* Voltage conversion (PA0) */
    float v_pin = ((float)raw_adc / BMS_ADC_MAX_COUNT) * BMS_ADC_VREF_V;
    float v_batt = v_pin * BMS_V_DIVIDER_RATIO; // V_batt = V_pin * 3.7000

    g_sample_window[i].voltage_v = v_batt;

    /* Current conversion via Ohm's Law across 10 Ohm Load Resistor: I = V_batt / 10 */
    g_sample_window[i].current_a = v_batt / BMS_LOAD_RESISTOR_OHMS;

    /* Default ambient temperature baseline (25 °C) */
    g_sample_window[i].temperature_c = BMS_DEFAULT_TEMP_C;
  }

  /* 2. Calculate 18-Feature Vector */
  Calculate_Features(g_sample_window, BMS_WINDOW_SAMPLES, &g_extracted_features);

  /* 3. Execute TinyML SOH Prediction */
  g_soh_result = BIP_Inference(&g_extracted_features);

  uint32_t process_time_ms = HAL_GetTick() - start_time;

  /* 4. Transmit Result via UART (JSON Telemetry) */
  printf("{\"status\": \"OK\", \"v_batt\": %.3f, \"i_batt\": %.3f, \"soh\": %.4f, \"kurtosis\": %.4f, \"calc_ms\": %lu}\r\n",
         g_sample_window[0].voltage_v,
         g_sample_window[0].current_a,
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
  * @brief System Clock Configuration
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  /** Configure the main internal regulator output voltage
  */
  __HAL_RCC_PWR_CLK_ENABLE();
  __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE1);

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSI;
  RCC_OscInitStruct.PLL.PLLM = 16;
  RCC_OscInitStruct.PLL.PLLN = 360;
  RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV2;
  RCC_OscInitStruct.PLL.PLLQ = 2;
  RCC_OscInitStruct.PLL.PLLR = 2;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Activate the Over-Drive mode
  */
  if (HAL_PWREx_EnableOverDrive() != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV4;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV2;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_5) != HAL_OK)
  {
    Error_Handler();
  }
}

/* USER CODE BEGIN 4 */

/* USER CODE END 4 */

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  /* USER CODE BEGIN Error_Handler_Debug */
  /* User can add his own implementation to report the HAL error return state */
  __disable_irq();
  while (1)
  {
  }
  /* USER CODE END Error_Handler_Debug */
}

#ifdef USE_FULL_ASSERT
void assert_failed(uint8_t *file, uint32_t line)
{
}
#endif /* USE_FULL_ASSERT */
