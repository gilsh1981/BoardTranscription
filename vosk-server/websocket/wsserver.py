#!/usr/bin/env python3

import argparse
import asyncio
import json
import sys
import websockets
import logging
import os

try:
    from vosk import Model, KaldiRecognizer, SetLogLevel
except ImportError:
    print("Please install vosk module: pip install vosk")
    exit(1)

logging.basicConfig(level=logging.INFO)
SetLogLevel(-1)

parser = argparse.ArgumentParser()
parser.add_argument('--model', required=True, help='Path to the model')
parser.add_argument('--port', type=int, default=2700, help='Server port')
args = parser.parse_args()

model = Model(args.model)

async def recognize(websocket):
    logging.info("Client connected")
    rec = None
    try:
        while True:
            message = await websocket.recv()
            # === לוג קבלת הודעה ===
            if isinstance(message, bytes):
                print(f"[RECV] bytes, len={len(message)}")
                if rec is None:
                    rec = KaldiRecognizer(model, 16000)
                if rec.AcceptWaveform(message):
                    result = rec.Result()
                    print("[VOSK] FINAL:", result)
                    await websocket.send(result)
                else:
                    partial = rec.PartialResult()
                    print("[VOSK] PARTIAL:", partial)
                    await websocket.send(partial)
            else:
                print(f"[RECV] text: {message}")
                if message == "reset":
                    rec = None
    except websockets.exceptions.ConnectionClosed:
        logging.info("Client disconnected")
    except Exception as e:
        logging.error("Error: %s", e)

async def main():
    async with websockets.serve(recognize, "0.0.0.0", args.port):
        logging.info(f"Listening on :{args.port}")
        await asyncio.Future()  # run forever

if __name__ == '__main__':
    asyncio.run(main())
