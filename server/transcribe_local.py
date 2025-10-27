# -*- coding: utf-8 -*-
import sys, os, warnings
from faster_whisper import WhisperModel

# ✅ Hide non-critical warnings
warnings.filterwarnings("ignore", category=UserWarning)

# ✅ Force UTF-8 for console I/O
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# ✅ Add ffmpeg path (so faster-whisper can decode .webm/.wav)
os.environ["PATH"] += os.pathsep + r"C:\Users\gilsh\ffmpeg-2025-10-19-git-dc39a576ad-essentials_build\ffmpeg-2025-10-19-git-dc39a576ad-essentials_build\bin"

# ✅ CLI usage
if len(sys.argv) != 3:
    print("Usage: python3 transcribe_local.py <audio_path> <output_path>")
    sys.exit(1)

# ✅ Convert to absolute paths
audio_path = os.path.abspath(sys.argv[1])
output_path = os.path.abspath(sys.argv[2])

# ✅ Normalize Hebrew filenames
try:
    audio_path = os.fsdecode(audio_path)
    output_path = os.fsdecode(output_path)
except Exception:
    pass

# ⚡ Faster model for CPU systems
model_size = "small"

print(f"[INFO] Loading Whisper model: {model_size}")
model = WhisperModel(model_size, device="cpu", compute_type="int8")

# 🧩 Safe print even with Hebrew paths
try:
    print(f"[INFO] Transcribing file: {audio_path}")
except Exception:
    print("[WARN] Could not print filename (non-UTF chars)")

# 🎧 Try forcing Hebrew; fallback to auto-detect
try:
    print("[INFO] Forcing Hebrew language mode...")
    segments, info = model.transcribe(audio_path, language="he")
except Exception as e:
    print(f"[WARN] Hebrew mode failed ({e}), auto-detecting language instead...")
    segments, info = model.transcribe(audio_path, language=None)
    print(f"[INFO] Detected language: {info.language}")

# 💾 Save output with UTF-8 text
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, "w", encoding="utf-8") as f:
    for segment in segments:
        text = segment.text.strip()
        if text:
            f.write(text + " ")

print(f"[DONE] Transcription saved to {output_path}")
