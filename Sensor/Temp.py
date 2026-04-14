#!/usr/bin/env python3
# VVVV Install Theses VVVV
# sudo apt install python3-smbus python3-pip i2c-tools
# pip3 install smbus2
"""
AHT21 Temperature & Humidity Reader for Raspberry Pi
Date: 2026-03-23
"""

import time
import smbus2
import sys

# I2C address for AHT21
AHT21_I2C_ADDR = 0x38

# Commands
AHT21_CMD_INIT = [0xBE, 0x08, 0x00]
AHT21_CMD_TRIGGER = [0xAC, 0x33, 0x00]
AHT21_CMD_SOFTRESET = [0xBA]

def aht21_init(bus):
    """Initialize the AHT21 sensor."""
    try:
        bus.write_i2c_block_data(AHT21_I2C_ADDR, AHT21_CMD_INIT[0], AHT21_CMD_INIT[1:])
        time.sleep(0.05)  # Wait for init
    except Exception as e:
        sys.exit(f"Error initializing AHT21: {e}")

def aht21_soft_reset(bus):
    """Soft reset the AHT21 sensor."""
    try:
        bus.write_byte(AHT21_I2C_ADDR, AHT21_CMD_SOFTRESET[0])
        time.sleep(0.02)
    except Exception as e:
        sys.exit(f"Error resetting AHT21: {e}")

def getHumidity(bus):
    """Read humidity from AHT21."""
    try:
        # Trigger measurement
        bus.write_i2c_block_data(AHT21_I2C_ADDR, AHT21_CMD_TRIGGER[0], AHT21_CMD_TRIGGER[1:])
        time.sleep(0.08)  # Wait for measurement

        # Read 6 bytes of data
        data = bus.read_i2c_block_data(AHT21_I2C_ADDR, 0x00, 6)

        # Parse humidity (20 bits)
        humidity_raw = ((data[1] << 12) | (data[2] << 4) | (data[3] >> 4))
        humidity = (humidity_raw / 1048576.0) * 100

        return round(humidity, 4)

    except Exception as e:
        sys.exit(f"Error reading AHT21: {e}")

def getTemperature(bus):
    """Read temperature from AHT21."""
    try:
        # Trigger measurement
        bus.write_i2c_block_data(AHT21_I2C_ADDR, AHT21_CMD_TRIGGER[0], AHT21_CMD_TRIGGER[1:])
        time.sleep(0.08)  # Wait for measurement

        # Read 6 bytes of data
        data = bus.read_i2c_block_data(AHT21_I2C_ADDR, 0x00, 6)

        # Parse temperature (20 bits)
        temp_raw = (((data[3] & 0x0F) << 16) | (data[4] << 8) | data[5])
        temperature = ((temp_raw / 1048576.0) * 200) - 50

        return round(temperature, 2)

    except Exception as e:
        sys.exit(f"Error reading AHT21: {e}")

def main():
    try:
        bus = smbus2.SMBus(1)  # I2C bus 1 on Raspberry Pi
    except FileNotFoundError:
        sys.exit("I2C bus not found. Enable I2C in raspi-config.")

    aht21_soft_reset(bus)
    aht21_init(bus)

    try:
        while True:
            temp = getTemperature(bus)
            hum = getHumidity(bus)
            print(f"{temp}  {hum}")
            time.sleep(2)
    except KeyboardInterrupt:
        print("\nExiting...")
    finally:
        bus.close()

if __name__ == "__main__":
    main()
