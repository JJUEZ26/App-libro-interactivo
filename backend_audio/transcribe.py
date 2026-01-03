import os
import queue
import sys

import pyaudio
from google.cloud import speech

try:
    if not os.path.exists("key.json"):
        raise FileNotFoundError
except FileNotFoundError:
    print("Error crítico: No se encuentra el archivo key.json de seguridad")
    sys.exit(1)

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "key.json"

RATE = 16000
CHUNK = int(RATE / 10)


class MicrophoneStream:
    def __init__(self, rate: int, chunk: int) -> None:
        self._rate = rate
        self._chunk = chunk
        self._buff: queue.Queue[bytes] = queue.Queue()
        self._audio_interface = pyaudio.PyAudio()
        self._audio_stream = None
        self.closed = True

    def __enter__(self):
        self._audio_stream = self._audio_interface.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=self._rate,
            input=True,
            frames_per_buffer=self._chunk,
            stream_callback=self._fill_buffer,
        )
        self.closed = False
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._audio_stream is not None:
            self._audio_stream.stop_stream()
            self._audio_stream.close()
        self.closed = True
        self._buff.put(None)
        self._audio_interface.terminate()

    def _fill_buffer(self, in_data, frame_count, time_info, status_flags):
        self._buff.put(in_data)
        return None, pyaudio.paContinue

    def generator(self):
        while not self.closed:
            chunk = self._buff.get()
            if chunk is None:
                return
            data = [chunk]
            while True:
                try:
                    chunk = self._buff.get(block=False)
                except queue.Empty:
                    break
                if chunk is None:
                    return
                data.append(chunk)
            yield b"".join(data)


def listen_print_loop(responses):
    for response in responses:
        if not response.results:
            continue
        result = response.results[0]
        if not result.alternatives:
            continue
        transcript = result.alternatives[0].transcript
        if result.is_final:
            print(transcript)


def main() -> None:
    client = speech.SpeechClient()

    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=RATE,
        language_code="es-ES",
    )
    streaming_config = speech.StreamingRecognitionConfig(
        config=config,
        interim_results=True,
    )

    with MicrophoneStream(RATE, CHUNK) as stream:
        audio_generator = stream.generator()
        requests = (
            speech.StreamingRecognizeRequest(audio_content=content)
            for content in audio_generator
        )
        responses = client.streaming_recognize(streaming_config, requests)
        listen_print_loop(responses)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nTranscripción finalizada.")
