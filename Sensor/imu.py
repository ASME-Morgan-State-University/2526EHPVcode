import FaBo9Axis_MPU9250
import time
import sys

mpu9250 = FaBo9Axis_MPU9250.MPU9250()
def getPA():
  try:
    while True:
        accel = mpu9250.readAccel()
        xaccel =(accel['x'])
        yaccel =(accel['y'])
        zaccel = (accel['z'])
        return xaccel , yaccel, zaccel
  except KeyboardInterrupt:
    sys.exit()

def getAttitude():
  try:
    while True:
        gyro = mpu9250.readGyro()
        P = gyro['x']
        Y = gyro['y']
        R = gyro['z']
        return P, Y , R
  except KeyboardInterrupt:
    sys.exit()
def getMagetometer():
  try:
    while True:
      mag = mpu9250.readMagnet()
      xmag = (mag['x'])
      ymag = (mag['y'])
      zmag = (mag['z'])
      return xmag,ymag, zmag
  except KeyboardInterrupt:
    sys.exit()

while True:
  getPA()
  getAttitude()
  getMagetometer()
  time.sleep(0.1)
