import audioop
import os
import queue
import sys
from typing import Optional

import pyaudio
from google.cloud import speech
from vertexai.preview.generative_models import GenerativeModel
import vertexai

try:
    if not os.path.exists("key.json"):
        raise FileNotFoundError
except FileNotFoundError:
    print("Error crítico: No se encuentra el archivo key.json de seguridad")
    sys.exit(1)

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "key.json"

RATE = 16000
CHUNK = int(RATE / 10)
SILENCE_THRESHOLD = 500
SILENCE_DURATION = 1.2
MAX_RECORD_SECONDS = 15


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


def record_until_silence(stream: MicrophoneStream) -> Optional[bytes]:
    silence_limit = int(SILENCE_DURATION / (CHUNK / RATE))
    max_chunks = int(MAX_RECORD_SECONDS / (CHUNK / RATE))
    silence_chunks = 0
    recorded = []
    has_speech = False

    for chunk_index, chunk in enumerate(stream.generator()):
        rms = audioop.rms(chunk, 2)
        if rms > SILENCE_THRESHOLD:
            has_speech = True
            silence_chunks = 0
        elif has_speech:
            silence_chunks += 1

        recorded.append(chunk)

        if has_speech and silence_chunks >= silence_limit:
            break
        if chunk_index >= max_chunks:
            break

    if not has_speech:
        return None
    return b"".join(recorded)


def transcribe_audio(client: speech.SpeechClient, audio_data: bytes) -> Optional[str]:
    audio = speech.RecognitionAudio(content=audio_data)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=RATE,
        language_code="es-ES",
    )
    response = client.recognize(config=config, audio=audio)
    if not response.results:
        return None
    return response.results[0].alternatives[0].transcript


def generate_response(prompt: str) -> str:
    project_id = (
        os.environ.get("GOOGLE_CLOUD_PROJECT")
        or os.environ.get("GCP_PROJECT")
        or os.environ.get("PROJECT_ID")
    )
    if not project_id:
        raise ValueError(
            "Define GOOGLE_CLOUD_PROJECT (o GCP_PROJECT/PROJECT_ID) para usar Vertex AI."
        )
    location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
    vertexai.init(project=project_id, location=location)
    model = GenerativeModel("gemini-1.0-pro")
    response = model.generate_content(prompt)
    return response.text or "(Sin respuesta)"


def main() -> None:
    print("Habla cuando estés listo. Detén tu voz para finalizar...")
    speech_client = speech.SpeechClient()

    with MicrophoneStream(RATE, CHUNK) as stream:
        audio_data = record_until_silence(stream)

    if not audio_data:
        print("No se detectó voz. Inténtalo de nuevo.")
        return

    transcript = transcribe_audio(speech_client, audio_data)
    if not transcript:
        print("No se pudo transcribir el audio.")
        return

    print(f"Tú: {transcript}")
    answer = generate_response(transcript)
    print(f"Gemini: {answer}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nConversación finalizada.")
