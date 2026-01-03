import os
import sys
import pyaudio
import queue
from google.cloud import speech
from google.cloud import aiplatform
import vertexai
from vertexai.generative_models import GenerativeModel
import google.api_core.exceptions

# --- CONFIGURACIÓN ---
PROJECT_ID = "995012067544" 
LOCATION = "us-central1"

# --- LISTA DE MODELOS (NOMBRES TÉCNICOS COMPLETOS) ---
# Usamos las versiones "-001" que son obligatorias para tu proyecto
MODELS_TO_TRY = [
    "gemini-1.5-flash-001",  # El más rápido
    "gemini-1.5-pro-001",    # El más inteligente
    "gemini-1.0-pro-001",    # El clásico
]

# Configuración del Micrófono
RATE = 16000
CHUNK = int(RATE / 10)

class MicrophoneStream:
    def __init__(self, rate, chunk):
        self._rate = rate
        self._chunk = chunk
        self._buff = queue.Queue()
        self.closed = True

    def __enter__(self):
        self._audio_interface = pyaudio.PyAudio()
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

    def __exit__(self, type, value, traceback):
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
                    if chunk is None:
                        return
                    data.append(chunk)
                except queue.Empty:
                    break
            yield b"".join(data)

def init_vertex_ai():
    print(f"🔄 Conectando a Vertex AI ({LOCATION})...")
    try:
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        return True
    except Exception as e:
        print(f"❌ Error inicializando: {e}")
        return False

def generate_response_smart(prompt_text):
    for model_name in MODELS_TO_TRY:
        try:
            # print(f"👉 Probando: {model_name}...") 
            model = GenerativeModel(model_name)
            response = model.generate_content(prompt_text)
            return response.text
        except google.api_core.exceptions.NotFound:
            # Si no encuentra el modelo, prueba el siguiente silenciosamente
            continue
        except Exception as e:
            print(f"⚠️ Error con {model_name}: {e}")
            continue
    
    return "❌ Error: No se pudo conectar con Gemini. Verifica que pulsaste 'Habilitar APIs' en la web."

def listen_print_loop(responses):
    for response in responses:
        if not response.results:
            continue
        result = response.results[0]
        if not result.alternatives:
            continue

        transcript = result.alternatives[0].transcript

        if result.is_final:
            print(f"\n🎤 Tú dijiste: {transcript}")
            
            if "salir" in transcript.lower() or "adiós" in transcript.lower():
                print("👋 ¡Hasta luego!")
                sys.exit()

            print("🧠 Gemini pensando...")
            respuesta_ai = generate_response_smart(transcript)
            print(f"🤖 Gemini: {respuesta_ai}\n")
            print("Escuchando... (Di 'salir' para terminar)")

def main():
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "key.json"
    
    if not init_vertex_ai():
        return

    client = speech.SpeechClient()
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=RATE,
        language_code="es-ES",
    )
    streaming_config = speech.StreamingRecognitionConfig(
        config=config,
        interim_results=True 
    )

    print("\n🟢 CHAT DE VOZ LISTO. Habla ahora...")
    
    with MicrophoneStream(RATE, CHUNK) as stream:
        audio_generator = stream.generator()
        requests = (
            speech.StreamingRecognizeRequest(audio_content=content)
            for content in audio_generator
        )

        try:
            responses = client.streaming_recognize(streaming_config, requests)
            listen_print_loop(responses)
        except Exception as e:
            print(f"\n❌ Error en el stream de audio: {e}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 Programa detenido.")
