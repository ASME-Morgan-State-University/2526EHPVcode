import random
def getTemperature():
    try:
        return int(random.random() * 100) % 50 # Celcius
    except Exception as e:
        print(f"Error getting temperature: {e}")
        return 0
    
def getHumidity():
    try:
        return int(random.random() * 100) % 100 #%
    except Exception as e: 
        print(f"Error getting temperature: {e}")
        return 0
