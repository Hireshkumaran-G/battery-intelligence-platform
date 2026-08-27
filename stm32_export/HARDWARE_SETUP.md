# Exact Hardware Wiring & Setup Guide for Your Components

This guide is custom-tailored for your **exact 6-component list** so you can wire your hardware in 5 minutes and submit your project successfully tomorrow!

---

## 1. Component Checklist & Purpose

| Component | Quantity | Purpose in Circuit |
| :--- | :---: | :--- |
| **STM32F446RE Nucleo Board** | 1 | Microcontroller & ST-LINK USB Power/Telemetry Interface |
| **18650 Li-ion Battery Cell** | 1 | Battery under test ($3.0\text{V} - 4.2\text{V}$) |
| **27 kΩ Resistor** | 1 | Voltage Divider Upper Arm ($R_1$) connected between Batt(+) and PA0 |
| **10 kΩ Resistor** | 1 | Voltage Divider Lower Arm ($R_2$) connected between PA0 and GND |
| **100 nF Ceramic Capacitor** | 1 | Anti-aliasing noise filter connected in parallel across 10 kΩ resistor (PA0 to GND) |
| **10 Ω, 5W Power Resistor** | 1 | Discharge Load Resistor connected across 18650 Cell |

---

## 2. Complete Breadboard & Pin Wiring Diagram

Connect your components exactly as shown below:

```text
                  +-----------------------------------+
                  |   18650 Li-ion Battery (3.0-4.2V) |
                  +-----------------+-----------------+
                                    |
            +-----------------------+-----------------------+
            | (+) Positive                                  | (-) Negative
            v                                               v
  +--------------------+                           +-------------------+
  | 10 Ω, 5W Power Res |                           | Common GND Rail   |
  | (Discharge Load)   |                           +---------+---------+
  +---------+----------+                                     |
            | (GND Return)                                   |
            v                                                |
  +----------------------------------------------------------+
  |
  |   VOLTAGE DIVIDER + NOISE FILTER CIRCUIT:
  |
  +----> [ 27 kΩ Resistor ] 
                  |
                  +---> Connect to STM32 Pin [PA0] (ADC1_IN0 Input)
                  |
                  +---> [ 10 kΩ Resistor ] -------> Connect to STM32 [GND]
                  |
                  +---> [ 100 nF Capacitor ] -----> Connect to STM32 [GND]
```

### Pin-by-Pin Junction Table

1. **18650 Battery (+)** $\to$ Connect to **Side 1 of 27 kΩ Resistor** AND **Side 1 of 10 Ω Power Resistor**.
2. **18650 Battery (-)** $\to$ Connect to **STM32 GND Pin** AND **Side 2 of 10 Ω Power Resistor**.
3. **STM32 PA0 Pin** $\to$ Connect to **Junction between 27 kΩ and 10 kΩ Resistor** AND **Leg 1 of 100 nF Capacitor**.
4. **STM32 GND Pin** $\to$ Connect to **Side 2 of 10 kΩ Resistor** AND **Leg 2 of 100 nF Capacitor**.
5. **Laptop USB Cable** $\to$ Plug into **Top ST-LINK USB Port (CN1)** on Nucleo board.

---

## 3. Voltage & Current Math Verification

* **Voltage Divider Ratio**:
  $$V_{\text{PA0}} = V_{\text{batt}} \times \frac{10\text{ k}\Omega}{27\text{ k}\Omega + 10\text{ k}\Omega} = V_{\text{batt}} \times \frac{10}{37} \approx 0.27027 \times V_{\text{batt}}$$
  * At **$4.2\text{V}$ (Fully Charged)** $\to V_{\text{PA0}} = 1.135\text{V}$ (100% safe for STM32 3.3V ADC!).
  * Firmware correction multiplier: $V_{\text{batt}} = V_{\text{PA0}} \times 3.7000$.

* **Discharge Current (Ohm's Law across 10 Ω Load Resistor)**:
  $$I_{\text{batt}} = \frac{V_{\text{batt}}}{10.0\ \Omega}$$
  * At $4.2\text{V} \implies I_{\text{batt}} = 0.42\text{A} = 420\text{ mA}$.
  * Power dissipated: $P = \frac{4.2^2}{10} = 1.76\text{ W}$ (Safe for 5W rated resistor).

---

## 4. Exact STM32CubeMX Configuration Steps

Follow these exact steps for single-channel sampling with your 6 components:

### Step 1: Create Project
1. Open **STM32CubeIDE** $\to$ **File** $\to$ **New** $\to$ **STM32 Project**.
2. Select **Board Selector** tab $\to$ Search **NUCLEO-F446RE** $\to$ Click **Next**.
3. Project Name: `bip_stm32f446_tinyml` $\to$ Language: `C` $\to$ Finish. Select **YES** when asked to initialize default peripherals.

### Step 2: System Clock
1. Open **Clock Configuration** tab.
2. In the **HCLK (MHz)** box, type `180` and press **Enter**.

### Step 3: Configure USART2 (Serial Telemetry over USB)
1. Left panel $\to$ **Connectivity** $\to$ **USART2**.
2. **Mode**: Set to `Asynchronous`.
3. In **Parameter Settings**: Baud Rate = `115200`, Word Length = `8 Bits`, Parity = `None`, Stop Bits = `1`.

### Step 4: Configure TIM2 (1 kHz Trigger Generator)
1. Left panel $\to$ **Timers** $\to$ **TIM2**.
2. **Clock Source**: `Internal Clock`.
3. **Parameter Settings**:
   * **Prescaler**: `179`
   * **Counter Period (ARR)**: `999`
   * **Trigger Event Selection TRGO**: Select **Update Event**.

### Step 5: Configure ADC1 (PA0 Single Channel Voltage Sampling)
1. Left panel $\to$ **Analog** $\to$ **ADC1**.
2. Under **Mode**: Check **IN0** (PA0).
3. Under **Parameter Settings**:
   * **Clock Prescaler**: `PCLK2 divided by 4`
   * **Resolution**: `12 bits`
   * **Scan Conversion Mode**: `Disabled` *(Single channel)*
   * **Continuous Conversion Mode**: `Disabled`
   * **DMA Continuous Requests**: `Enabled`
   * **External Trigger Conversion Source**: `Timer 2 Trigger Out event`
   * **External Trigger Conversion Edge**: `Trigger detection on rising edge`
   * **Rank 1**: Channel `Channel 0`, Sampling Time = `84 Cycles`

### Step 6: Configure DMA2 Stream for ADC1
1. Inside **ADC1 Configuration** $\to$ Click **DMA Settings** tab.
2. Click **Add** $\to$ Select **ADC1**.
3. Set parameters:
   * **Mode**: **`Circular`**
   * **Data Width**: Set both **Peripheral** and **Memory** to **`Half Word`** (16 bits).

### Step 7: Generate Code
1. Click **File** $\to$ **Save** (`Ctrl+S`). Click **Project** $\to$ **Generate Code**.

---

## 5. Copy Files & Run

1. Copy `stm32_export/stm32f446re_bms_config.h` and `stm32_export/lfp_soh_model/*.h` into your project's `Core/Inc/`.
2. Copy `stm32_export/lfp_soh_model/*.c` and `stm32_export/stm32f446re_main_example.c` into your project's `Core/Src/`.
3. Replace your `Core/Src/main.c` content with `stm32f446re_main_example.c`.
4. Click **Build** (`Ctrl+B`) and **Run** (`Ctrl+F11`).
5. Open any Serial Monitor at **115200 Baud** to see real-time TinyML predictions!

```json
{"status": "OK", "v_batt": 4.120, "i_batt": 0.412, "soh": 0.9842, "kurtosis": 3.1245, "calc_ms": 2}
```
