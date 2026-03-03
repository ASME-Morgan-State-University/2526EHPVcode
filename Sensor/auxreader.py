import random
def getAuxVoltag():
    try:
        return int(random.random() * 100) % 100 #%
    except Exception as e:
        print(f"Error setting motor speed: {e}")
        return 0   
def getAuxCurrent():
    try:
        return int(random.random() * 100) % 100 #%
    except Exception as e:
        print(f"Error setting motor speed: {e}")
        return 0