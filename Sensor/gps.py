import random
def getGPS():
    try:
        random_numbers = [float(random.randint(1, 100)) for _ in range(3)]
        Lat = random_numbers[0]
        Lon = random_numbers[1]
        Sc = random_numbers[2]
        return Lat, Lon, Sc
    except Exception as e:
        print(f"Error getting IMU data: {e}")
        return 0
