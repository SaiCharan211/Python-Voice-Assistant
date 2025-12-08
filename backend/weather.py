import requests
import datetime


def get_coordinates(city):
    try:
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1"
        data=requests.get(url,timeout=5).json()

        if 'results' not in data:
            return None, None 
        lat=data['results'][0]['latitude']
        lon=data['results'][0]['longitude']
        print(f"Coordinates found: Lat={lat}, Lon={lon}")
        return lat,lon 
        
    except:
        return None, None
    

def get_current_weather(city):
    lat,lon=get_coordinates(city)
    if lat is None:
        return "City Not Found"
    
    try:
        url= f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        data=requests.get(url,timeout=5).json()
        w=data['current_weather']
        return f"{city} temperature: {w['temperature']}°C, wind: {w['windspeed']} km/h"
    except:
        return 'Unable to fetch weather'


def get_forecast(city):
    lat,lon= get_coordinates(city)
    if lat is None:
        return "City not found"
    try:
        url= f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto"
        data= requests.get(url,timeout=5).json()
        dates=data["daily"]["time"]
        max_t=data["daily"]["temperature_2m_max"]
        min_t=data["daily"]["temperature_2m_min"]
        forecast= "7-day forecast:\n"
        
        for i in range(7):
            day=datetime.datetime.strptime(dates[i], "%Y-%m-%d").strftime("%A")
            forecast += f"{day}: Max {max_t[i]}°C, Min {min_t[i]}°C\n"
        return forecast 
        
    except:
        return "Unable to fetch forecast"

def get_air_quality(city):
    lat,lon=get_coordinates(city)
    if lat is None:
        return "City Not Found"
    try:
        url=f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&hourly=pm10,pm2_5,carbon_monoxide"
        data=requests.get(url,timeout=5).json()
        air=data["hourly"]
        return f"Air quality in {city}: PM10 {air['pm10'][0]}, PM2.5 {air['pm2_5'][0]}, CO {air['carbon_monoxide'][0]}"
    except:
        return "Unable to fetch air quality"
    










