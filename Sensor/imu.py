import random
def getPA():
    try:
        random_numbers = [float(random.randint(1, 100)) for _ in range(3)]
        xaccel = random_numbers[0]
        yaccel = random_numbers[1]
        zaccel = random_numbers[2]
        return xaccel, yaccel, zaccel
    except Exception as e:
        print(f"Error getting IMU data: {e}")
        return 0

def getAttitude():
    try:
        random_numbers = [float(random.randint(1, 100)) for _ in range(3)]
        P= random_numbers[0]
        Y = random_numbers[1]
        R = random_numbers[2]
        return P, Y, R
    except Exception as e:
        print(f"Error getting IMU data: {e}")
        return 0

def getMagnetometer():
 try:
        random_numbers = [float(random.randint(1, 100)) for _ in range(3)]
        xmag = random_numbers[0]
        ymag = random_numbers[1]
        zmag = random_numbers[2]
        return xmag, ymag, zmag
 except Exception as e:
        print(f"Error getting IMU data: {e}")
        return 0
    