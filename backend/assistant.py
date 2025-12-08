from weather import get_current_weather, get_forecast, get_air_quality
import pyjokes
import datetime
import webbrowser
import os
import subprocess
import string
import threading
import ctypes

print(">>> assistant.py IMPORTS FINISHED")

def run_in_thread(func):
    thread = threading.Thread(target=func)
    thread.daemon = True
    thread.start()


def process_query(query):
    query = query.lower().translate(str.maketrans("", "", string.punctuation)).strip()

    if "time" in query:
        now = datetime.datetime.now().strftime("%I:%M %p")
        return f"The time is {now}"

    if "weather in" in query:
        city = query.replace("weather in", "").strip()
        return get_current_weather(city)

    if "forecast in" in query:
        city = query.replace("forecast in", "").strip()
        return get_forecast(city)

    if "air quality in" in query:
        city = query.replace("air quality in", "").strip()
        return get_air_quality(city)

    if "joke" in query:
        return pyjokes.get_joke()

    
    if "open youtube" in query:
        run_in_thread(lambda: webbrowser.open("https://www.youtube.com"))
        return "Opening YouTube"

    if "open google" in query:
        run_in_thread(lambda: webbrowser.open("https://www.google.com"))
        return "Opening Google"

    if "open facebook" in query:
        run_in_thread(lambda: webbrowser.open("https://www.facebook.com"))
        return "Opening Facebook"

    if "open instagram" in query:
        run_in_thread(lambda: webbrowser.open("https://www.instagram.com"))
        return "Opening Instagram"


    if "open chrome" in query:
        run_in_thread(lambda: os.system(r'start chrome'))
        return "Opening Chrome"

    if "open vscode" in query or "open vs code" in query:
        run_in_thread(lambda: os.system('code'))
        return "Opening VS Code"

    if "open notepad" in query:
        run_in_thread(lambda: os.system("notepad.exe"))
        return "Opening Notepad"

    if "open calculator" in query:
        run_in_thread(lambda: os.system("calc.exe"))
        return "Opening Calculator"

    
    if "play music" in query or "start music" in query:
        music_folder = os.path.expanduser("~/Music")
        run_in_thread(lambda: os.system(f'start "" "{music_folder}"'))
        return "Playing music folder"

    
    if "open downloads" in query:
        path = os.path.expanduser("~/Downloads")
        run_in_thread(lambda: subprocess.Popen(f'explorer "{path}"'))
        return "Opening Downloads folder"

    if "open documents" in query:
        path = os.path.expanduser("~/Documents")
        run_in_thread(lambda: subprocess.Popen(f'explorer "{path}"'))
        return "Opening Documents folder"


    if "shutdown" in query:
        run_in_thread(lambda: os.system("shutdown /s /t 3"))
        return "Shutting down your computer"

    if "restart" in query:
        run_in_thread(lambda: os.system("shutdown /r /t 3"))
        return "Restarting your computer"

    if "lock computer" in query or "lock pc" in query:
        run_in_thread(lambda: ctypes.windll.user32.LockWorkStation())
        return "Locking your computer"


    if "increase brightness" in query:
        run_in_thread(lambda: os.system("powershell (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, 100)"))
        return "Increasing brightness"

    if "decrease brightness" in query:
        run_in_thread(lambda: os.system("powershell (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, 30)"))
        return "Decreasing brightness"


    if "increase volume" in query:
        run_in_thread(lambda: os.system("nircmd.exe changesysvolume 5000"))
        return "Increasing volume"

    if "decrease volume" in query:
        run_in_thread(lambda: os.system("nircmd.exe changesysvolume -5000"))
        return "Decreasing volume"

    if "mute" in query:
        run_in_thread(lambda: os.system("nircmd.exe mutesysvolume 1"))
        return "Muting volume"

    if "unmute" in query:
        run_in_thread(lambda: os.system("nircmd.exe mutesysvolume 0"))
        return "Unmuting volume"

    return "I did not understand that command."
