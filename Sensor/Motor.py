import random

def getMotorVoltag():
    try:
        return int(random.random() * 100) % 100 #%
    except Exception as e:
        print(f"Error setting motor speed: {e}")
        return 0
    
def getMotorCurrent():
    try:
        return int(random.random() * 100) % 100 #%
    except Exception as e:
        print(f"Error setting motor speed: {e}")
        return 0