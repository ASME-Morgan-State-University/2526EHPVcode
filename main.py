import asyncio
from flask import Flask, render_template
from flask_socketio import SocketIO

import Sensor.Temp as Temp
import Sensor.imu as imu
import Sensor.Motor as Motorteam
import Sensor.auxreader as auxreader

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Sensor variables
P = R = Y = 0
xaccel = yaccel = zaccel = 0
xmag = ymag = zmag = 0
temp = Hum = 0
Motorvoltage = Motorcurrent = 0
Auxvoltage = Auxcurrent = 0
Lat = Lon = Sc = 0 # Placeholder for GPS data



@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def connect():
    print("Client connected")

@socketio.on('disconnect')
def disconnect():
    print("Client disconnected")

async def broadcast_sensor_data():
    """Send sensor data to all clients every 100ms"""
    global temp, Hum, P, R, Y, xaccel, yaccel, zaccel, xmag, ymag, zmag
    global Motorvoltage, Motorcurrent, Auxvoltage, Auxcurrent

    while True:
        socketio.emit("sensor_data", {
            "temperature": temp,
            "humidity": Hum,
            "pitch": P,
            "roll": R,
            "yaw": Y,
            "xAccel": xaccel,
            "yAccel": yaccel,
            "zAccel": zaccel,
            "xMag": xmag,
            "yMag": ymag,
            "zMag": zmag,
            "motorVoltage": Motorvoltage,
            "motorCurrent": Motorcurrent,
            "auxVoltage": Auxvoltage,
            "auxCurrent": Auxcurrent,
            "Latitude": Lat,  # Placeholder for GPS data
            "Longitude": Lon, # Placeholder for GPS data
            "satellites": SC,
        })
        await asyncio.sleep(0.1)  # 100ms

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
        xmag, ymag, zmag = await asyncio.to_thread(imu.getMag)
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


async def main():
    await asyncio.gather(
        temp_sensors(),
        imu_sensors(),
        motor_sensors(),
        aux_sensors(),
        broadcast_sensor_data()
    )

if __name__ == "__main__":
    socketio.start_background_task(main)
    socketio.run(app, host="0.0.0.0", port=5000)