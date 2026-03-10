import random

def getMotorVoltage():
    try:
        return int(random.random() * 100) % 100 #%
    except Exception as e:
        print(f"Error setting motor data: {e}")
        return 0
    
def getMotorCurrent():
    try:
        return int(random.random() * 100) % 100 #%
    except Exception as e:
        print(f"Error setting motor data: {e}")
        return 0