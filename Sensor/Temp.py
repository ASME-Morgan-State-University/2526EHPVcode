




import pigpio
import time
import random

class AHT21:
    _i2cAddr = 0x38

    def __init__(self):
        self.pi = pigpio.pi()
        self.handle = self.pi.i2c_open(self._i2cAddr)
        assert(self.handle)

        self._calibrate()

    def _write(self, data):
        self.pi.i2c_write_device(self.handle, bytearray(data))

    def _read(self, reg, len):
        return self.pi.i2c_read_i2c_block_data(self.handle, reg, len)[1]

    def _calibrate(self):
        cal_cmd = [0xbe, 0x08, 0x00]
        self._write(cal_cmd)
        #todo delay perf counter?? need 50 us
        time.sleep(0.01)
        self._write([0x71]) # get status register
        res = self._read(self._i2cAddr, 1)
        if not res[0] & 0x68 == 0x08:
            print("Error calibrating.")
            return False
        else:
            print("Calibrating ok.")
            return True

    def Read(self):
        """Returns tuple (temp, humidity). Blocking delay at readout. """
        read_cmd = [0xac, 0x33, 0x00]
        self._write(read_cmd)
        #todo delay perf counter?? need 80ms 
        time.sleep(0.1)

        res = self._read(self._i2cAddr, 6)

        calc_hum = ((res[1] << 16) | (res[2] << 8) | res[3]) >> 4;
        calc_temp = ((res[3] & 0x0F) << 16) | (res[4] << 8) | res[5];

        rh = calc_hum * 100 / 1048576;
        temp = calc_temp * 200 / 1048576 - 50;

        return (temp, rh)

aht = AHT21()
aht._calibrate()

def getTemperature():
    try:
        return aht.Read()[0] # Celcius
    except Exception as e:
        print(f"Error getting temperature: {e}")
        return 0
    
def getHumidity():
    try:
        return aht.Read(0)[1] #%
    except Exception as e: 
        print(f"Error getting temperature: {e}")
        return 0

for i in range(50):
	getTemperature()
	getHumidity()
