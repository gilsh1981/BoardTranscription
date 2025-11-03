#!/usr/bin/env python3
import argparse
import asyncio
import json
import logging
import shlex
import sys
import websockets
from vosk import Model, KaldiRecognizer, SetLogLevel
import subprocess
import os

logging.basicConfig(level=logging.INFO)
SetLogLevel(-1)

parser = argparse.ArgumentParser()
parser.add_argument('--model', required=True, help='Path to Vosk model (folder)')
parser.add_argument('--port', type=int, default=2700, help='WebSocket server port')
parser.add_argument('--ffmpeg', default='ffmpeg', help='ffmpeg binary (default: ffmpeg)')
args = parser.parse_args()

logging.info("Loading model from: %s", args.model)
model = Model(args.model)
logging.info("Model loaded.")

FFMPEG_CMD = (
    f'"{args.ffmpeg}" -hide_banner -loglevel error '
    '-f webm -codec:a opus -i pipe:0 '
    '-ar 16000 -ac 1 -f s16le -'
)


# Start ffmpeg safely on all OS
def start_ffmpeg():
    use_shell = os.name == "nt"
    try:
        proc = subprocess.Popen(
            shlex.split(FFMPEG_CMD) if not use_shell else FFMPEG_CMD,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=sys.stderr,
            shell=use_shell,
            bufsize=0
        )
        logging.info(f"FFmpeg started (shell={use_shell})")
        return proc
    except Exception as e:
        logging.error(f"❌ Failed to start FFmpeg: {e}")
        raise

async def recognize(websocket):
    logging.info("Client connected from %s", websocket.remote_address)
    ffmpeg_proc = start_ffmpeg()
    rec = KaldiRecognizer(model, 16000)

    loop = asyncio.get_running_loop()
    reader_task = loop.run_in_executor(None, ffmpeg_stdout_reader, ffmpeg_proc, rec, websocket, loop)

    try:
        async for message in websocket:
            if isinstance(message, bytes):
                try:
                    ffmpeg_proc.stdin.write(message)
                    ffmpeg_proc.stdin.flush()
                except BrokenPipeError:
                    logging.error("ffmpeg stdin closed (BrokenPipe).")
                    break
            else:
                txt = message.strip().lower()
                if txt in ["reset", "end", "close"]:
                    break
    except websockets.exceptions.ConnectionClosed:
        logging.info("Client disconnected")
    finally:
        try:
            ffmpeg_proc.stdin.close()
        except Exception:
            pass
        ffmpeg_proc.terminate()
        await asyncio.sleep(0.1)
        reader_task.cancel()
        logging.info("Connection cleanup done.")

def ffmpeg_stdout_reader(ffmpeg_proc, rec, websocket, loop):
    try:
        chunk_size = 4000
        while True:
            data = ffmpeg_proc.stdout.read(chunk_size)
            if not data:
                break
            if rec.AcceptWaveform(data):
                res = rec.Result()
                asyncio.run_coroutine_threadsafe(websocket.send(res), loop)
            else:
                partial = rec.PartialResult()
                asyncio.run_coroutine_threadsafe(websocket.send(partial), loop)
    except Exception as e:
        logging.exception("Exception in ffmpeg_stdout_reader: %s", e)
    finally:
        logging.info("ffmpeg_stdout_reader exiting.")

async def main():
    server = await websockets.serve(recognize, "0.0.0.0", args.port, max_size=None, max_queue=None)
    logging.info("Listening on :%d", args.port)
    await server.wait_closed()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Server shutdown by user")
