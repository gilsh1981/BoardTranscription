#!/usr/bin/env python3
import asyncio
import websockets
import whisper
import os
import json
import sys
import tempfile
import subprocess
import shutil

import sys
print("RUNNING:", sys.argv[0])
print("__file__:", __file__)
import inspect
print("inspect file:", inspect.getfile(inspect.currentframe()))

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

print("DEBUG: BASE_DIR =", BASE_DIR)
print("DEBUG: UPLOAD_DIR =", UPLOAD_DIR)
print("DEBUG: תוכן BASE_DIR =", os.listdir(BASE_DIR))
print("DEBUG: קיים uploads?", os.path.exists(UPLOAD_DIR))

FFMPEG_PATH = shutil.which("ffmpeg") or r"C:\Users\gilsh\Downloads\Tools\ffmpeg-8.0-essentials_build\ffmpeg-8.0-essentials_build\bin\ffmpeg.exe"
print("DEBUG: FFMPEG_PATH =", FFMPEG_PATH)

print(">> טוען את מודל Whisper... (זה עלול לקחת כמה דקות בפעם הראשונה)")
model = whisper.load_model("small")
print("🚀 Whisper Hebrew WS Server מוכן!")
print(f">> מאזין על ws://0.0.0.0:2700 ...")

async def recognize(websocket):
    try:
        async for message in websocket:
            if isinstance(message, bytes):
                tmp_webm = None
                tmp_wav = None
                try:
                    # שמירה לקובץ זמני .webm
                    with tempfile.NamedTemporaryFile(suffix=".webm", dir=UPLOAD_DIR, delete=False) as f:
                        f.write(message)
                        tmp_webm = f.name
                    print(f"\n💾 נשמר קובץ WEBM: {tmp_webm}")

                    # הגדרת שם קובץ WAV - בטוח!
                    base_name = os.path.splitext(os.path.basename(tmp_webm))[0]
                    tmp_wav = os.path.join(UPLOAD_DIR, base_name + ".wav")

                    # DEBUG: Print כל נתיב
                    print(f"DEBUG: base_name = {base_name}")
                    print(f"DEBUG: tmp_webm = {tmp_webm}")
                    print(f"DEBUG: tmp_wav = {tmp_wav}")
                    print(f"DEBUG: האם קיים uploads? {os.path.exists(UPLOAD_DIR)}")
                    print(f"DEBUG: כל הקבצים ב-uploads: {os.listdir(UPLOAD_DIR)}")

                    # בדוק האם ffmpeg קיים
                    if not os.path.exists(FFMPEG_PATH):
                        raise FileNotFoundError(f"ffmpeg לא נמצא בנתיב: {FFMPEG_PATH}")

                    # המרה ל־.wav עם ffmpeg
                    ffmpeg_cmd = [
                        FFMPEG_PATH,
                        "-y",
                        "-i", tmp_webm,
                        "-ar", "16000",
                        "-ac", "1",
                        tmp_wav
                    ]
                    # הדפסה של כל אלמנט, כולל אינדקס!
                    for i, arg in enumerate(ffmpeg_cmd):
                        print(f"ffmpeg_cmd[{i}]: {arg}")
                    print(f"🛠️ מריץ: {' '.join(ffmpeg_cmd)}")
                    result = subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    print(f"🎧 הומר בהצלחה ל-WAV: {tmp_wav}")

                    # בדוק שהקובץ WAV נוצר
                    if not os.path.exists(tmp_wav):
                        raise FileNotFoundError(f"WAV לא נוצר: {tmp_wav}")
                    print(f"DEBUG: WAV קיים? {os.path.exists(tmp_wav)}")

                    # תמלול עם Whisper
                    whisper_result = model.transcribe(tmp_wav, language="he", fp16=False)
                    text = whisper_result.get("text", "").strip()

                    if text:
                        print(f"📝 תמלול: {text}")
                        await websocket.send(json.dumps({"partial": text}))
                    else:
                        print("⚠️ לא זוהה טקסט")
                except subprocess.CalledProcessError as e:
                    print("❌ שגיאת המרה (ffmpeg):", e)
                    print(e.stderr.decode("utf-8", errors="ignore"))
                except Exception as e:
                    print("❌ שגיאת תמלול:", e)
                finally:
                    # מחיקה
                    for f in [tmp_webm, tmp_wav]:
                        if f and os.path.exists(f):
                            os.remove(f)

            else:
                msg = message.strip().lower()
                print(f"📨 קיבל טקסט: {msg}")
                if msg == "end":
                    await websocket.send(json.dumps({"status": "done"}))
                    break
    except Exception as e:
        print("⚠️ שגיאת חיבור:", e)
    finally:
        print(">> לקוח התנתק")

async def main():
    async with websockets.serve(recognize, "0.0.0.0", 2700, max_size=50 * 1024 * 1024):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
