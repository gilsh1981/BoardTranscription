import asyncio
import websockets
import tempfile
import whisper
import os
import json
import subprocess
import sys

# תמיכה בעברית ו־Unicode לקונסול של Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# ---- הגדרות ----
WHISPER_MODEL = "small"   # אפשר medium/large, תתחיל מ-small

# נתיב מלא ל-ffmpeg
FFMPEG_BIN = r"C:\Users\gilsh\Downloads\Tools\ffmpeg-8.0-essentials_build\ffmpeg-8.0-essentials_build\bin\ffmpeg.exe"

# ---- טען את המודל פעם אחת ----
print(">> טוען את המודל Whisper... (אם זה הפעם הראשונה זה ייקח כמה דקות, במיוחד ל-medium/large)")
model = whisper.load_model(WHISPER_MODEL)
print("🚀 Whisper Hebrew WS Server מוכן!")

async def recognize_stream(websocket):
    print(">> לקוח התחבר")
    try:
        async for message in websocket:
            if isinstance(message, bytes):
                print(f">> קיבלתי chunk בגודל {len(message)} בייט")
                # כתוב chunk לקובץ זמני
                with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
                    f.write(message)
                    webm_path = f.name
                wav_path = webm_path.replace(".webm", ".wav")
                print(f">> המיר מ-webm ל-wav: {webm_path} --> {wav_path}")

                # המר מ־webm ל־wav ע"י ffmpeg
                cmd = [
                    FFMPEG_BIN, "-y", "-i", webm_path,
                    "-ar", "16000", "-ac", "1", wav_path
                ]
                try:
                    result_ffmpeg = subprocess.run(cmd, capture_output=True, check=True)
                    print(">> ffmpeg סיים בהצלחה")
                except Exception as e:
                    print("❌ ffmpeg נכשל:", e)
                    await websocket.send(json.dumps({"error": "ffmpeg failed"}))
                    os.remove(webm_path)
                    continue

                # רוץ על whisper (עברית)
                try:
                    print(">> רץ transcribe עם whisper...")
                    result = model.transcribe(wav_path, language="he")
                    text = result.get("text", "").strip()
                    print(f">> תוצאה: {text}")
                    if text:
                        await websocket.send(json.dumps({"text": text}))
                except Exception as e:
                    print("❌ Whisper נכשל:", e)
                    await websocket.send(json.dumps({"error": "whisper failed"}))
                finally:
                    # תמיד תנקות קבצים
                    print(">> מנקה קבצים זמניים...")
                    os.remove(webm_path)
                    if os.path.exists(wav_path):
                        os.remove(wav_path)
            else:
                msg = message.strip().lower()
                print(f">> קיבל טקסט: {msg}")
                if msg in ("end", "close", "reset"):
                    await websocket.send(json.dumps({"status": "closed"}))
                    break
    except Exception as e:
        print("Connection error:", e)
    finally:
        print(">> לקוח התנתק")
        await websocket.close()

async def main():
    print(">> מאזין על ws://0.0.0.0:2700 ...")
    async with websockets.serve(recognize_stream, "0.0.0.0", 2700, max_size=10 * 1024 * 1024):
        await asyncio.Future()  # Keep running

if __name__ == "__main__":
    asyncio.run(main())
