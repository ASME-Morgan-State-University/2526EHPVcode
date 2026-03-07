import asyncio
import Sensor.Temp as Temp
import Sensor.imu as imu
import Sensor.Motor as Motor
import Sensor.auxreader as auxreader
import Sensor.gps as gps


# Sensor variables
P = R = Y = 0
xaccel = yaccel = zaccel = 0
xmag = ymag = zmag = 0
temp = Hum = 0
Motorvoltage = Motorcurrent = 0
Auxvoltage = Auxcurrent = 0
Lat = Lon = Sc = 0
#
#
def get_sensor_data():
    return [
    Lat, Lon, Sc,  Auxvoltage,
    Auxcurrent,  Motorvoltage,
    Motorcurrent,xaccel, yaccel,
    zaccel,xmag, ymag, zmag,P,
    R, Y,temp, Hum,
    ]

# Sensor tasks
async def temp_sensors():
    global temp, Hum
    while True:
        temp = await asyncio.to_thread(Temp.getTemperature)
        Hum = await asyncio.to_thread(Temp.getHumidity)
        await asyncio.sleep(0.1)
async def imu_sensors():
    global P, R, Y, xaccel, yaccel, zaccel, xmag, ymag, zmag
    while True:
        P, Y, R = await asyncio.to_thread(imu.getAttitude)
        xaccel, yaccel, zaccel = await asyncio.to_thread(imu.getAccleartion)
        xmag, ymag, zmag = await asyncio.to_thread(imu.getMagnetometer)
        await asyncio.sleep(0.1)
async def motor_sensors():
    global Motorvoltage, Motorcurrent
    while True:
        Motorvoltage = await asyncio.to_thread(Motor.getMotorVoltag)
        Motorcurrent = await asyncio.to_thread(Motor.getMotorCurrent)
        await asyncio.sleep(0.1)
async def aux_sensors():
    global Auxvoltage, Auxcurrent
    while True:
        Auxvoltage = await asyncio.to_thread(auxreader.getAuxVoltag)
        Auxcurrent = await asyncio.to_thread(auxreader.getAuxCurrent)
        await asyncio.sleep(0.1)
async def gps_sensors():
    global Lat, Lon, Sc
    while True:
        Lat, Lon, Sc = await asyncio.to_thread(gps.getGPS)
        await asyncio.sleep(0.1)

# Printer task
async def printer():
    while True:
        print(*get_sensor_data())
        await asyncio.sleep(1)

async def main():
    await asyncio.gather(
        temp_sensors(),
        imu_sensors(),
        motor_sensors(),
        aux_sensors(),
        gps_sensors(),
        printer()
    )

if __name__ == "__main__":
    asyncio.run(main())
