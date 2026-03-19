import asyncio
import threading
from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit

import Sensor.Temp as Temp
import Sensor.imu as imu
import Sensor.Motor as Motor
import Sensor.auxreader as auxreader
import Sensor.gps as gps


# Flask setup
app = Flask(__name__)
socketio = SocketIO(app, async_mode="threading")

# Track connected clients
clients = set()

# Sensor variables
#IMU
P = R = Y = 0
xaccel = yaccel = zaccel = 0
xmag = ymag = zmag = 0
#Temp
temp = Hum = 0
#Motor
Motorvoltage = Motorcurrent = 0
#Aux
Auxvoltage = Auxcurrent = 0
#GPS
Lat = Lon = Sc = 0

def get_sensor_data():
    return {
        "latitude": Lat,
        "longitude": Lon,
        "satellites": Sc,
        "auxVoltage": Auxvoltage,
        "auxCurrent": Auxcurrent,
        "motorVoltage": Motorvoltage,
        "motorCurrent": Motorcurrent,
        "xAccel": xaccel,
        "yAccel": yaccel,
        "zAccel": zaccel,
        "pitch": P,
        "roll": R,
        "yaw": Y,
        "temperature": temp,
        "humidity": Hum
    }


@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("connect")
def handle_connect():
    clients.add(request.sid)
    print("Client connected:", request.sid)
    print("Total clients:", len(clients))

# Send current telemetry to new client
    socketio.emit(
        "telemetry",
        get_sensor_data(),
        to=request.sid
    )


@socketio.on("disconnect")
def handle_disconnect():
    clients.discard(request.sid)

    print("Client disconnected:", request.sid)
    print("Total clients:", len(clients))

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
        xaccel, yaccel, zaccel = await asyncio.to_thread(imu.getPA)
        xmag, ymag, zmag = await asyncio.to_thread(imu.getMagnetometer)
        await asyncio.sleep(0.5)
        
async def motor_sensors():
    global Motorvoltage, Motorcurrent
    while True:
        Motorvoltage = await asyncio.to_thread(Motor.getMV)
        Motorcurrent = await asyncio.to_thread(Motor.getMC)
        await asyncio.sleep(0.5)
        
async def aux_sensors():
    global Auxvoltage, Auxcurrent
    while True:
        Auxvoltage = await asyncio.to_thread(auxreader.getAV)
        Auxcurrent = await asyncio.to_thread(auxreader.getAC)
        await asyncio.sleep(0.5)
        
async def gps_sensors():
    global Lat, Lon, Sc
    while True:
        Lat, Lon, Sc = await asyncio.to_thread(gps.getGPS)
        await asyncio.sleep(0.5)
        
async def broadcast_task():
    while True:
        data = get_sensor_data()
        socketio.emit("telemetry", data)  # OK from thread
        await asyncio.sleep(0.5)

async def main():
    await asyncio.gather(
        temp_sensors(),
        imu_sensors(),
        motor_sensors(),
        aux_sensors(),
        gps_sensors(),
        broadcast_task()
    )
def start_async_loop():
    asyncio.run(main())

if __name__ == "__main__":
    threading.Thread(target=start_async_loop).start()
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)