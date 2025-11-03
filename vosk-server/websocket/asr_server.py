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

# Disable Vosk debug info
SetLogLevel(-1)

parser = argparse.ArgumentParser()
parser.add_argument('--model', required=True, help='Path to the model')
parser.add_argument('--port', type=int, default=2700, help='Server port')
args = parser.parse_args()

model = Model(args.model)

async def recognize(websocket, path):
    logging.info("Client connected")
    rec = None
    try:
        while True:
            message = await websocket.recv()
            if isinstance(message, bytes):
                if rec is None:
                    rec = KaldiRecognizer(model, 16000)
                if rec.AcceptWaveform(message):
                    result = rec.Result()
                    await websocket.send(result)
                else:
                    partial = rec.PartialResult()
                    await websocket.send(partial)
            else:
                if message == "reset":
                    rec = None
    except websockets.exceptions.ConnectionClosed:
        logging.info("Client disconnected")
    except Exception as e:
        logging.error("Error: %s", e)

start_server = websockets.serve(recognize, "0.0.0.0", args.port)

logging.info(f"Listening on :{args.port}")

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
