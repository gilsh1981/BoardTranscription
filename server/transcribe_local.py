import sys
from faster_whisper import WhisperModel

# Usage: python3 transcribe_local.py <audio_path> <output_path>
if len(sys.argv) != 3:
    print("Usage: python3 transcribe_local.py <audio_path> <output_path>")
    sys.exit(1)

audio_path = sys.argv[1]
output_path = sys.argv[2]

# You can change this to: "small", "medium", or "large-v2" for higher accuracy
model_size = "medium"

print(f"[INFO] Loading Whisper model: {model_size}")
model = WhisperModel(model_size, device="cpu", compute_type="int8")

print(f"[INFO] Transcribing file: {audio_path}")

# Try forcing Hebrew ("he") — fallback to auto-detect if that fails
try:
    print("[INFO] Forcing Hebrew language mode...")
    segments, info = model.transcribe(audio_path, language="he")
except Exception as e:
    print(f"[WARN] Hebrew mode failed ({e}), auto-detecting language instead...")
    segments, info = model.transcribe(audio_path, language=None)
    print(f"[INFO] Detected language: {info.language}")

# Save output
with open(output_path, "w", encoding="utf-8") as f:
    for segment in segments:
        text = segment.text.strip()
        if text:
            f.write(text + " ")

print(f"[DONE] Transcription saved to {output_path}")

