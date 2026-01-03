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
# Tu Proyecto de Google Cloud
PROJECT_ID = "995012067544" 
LOCATION = "us-central1"

# Lista de modelos a probar (en orden de preferencia)
MODELS_TO_TRY = [
    "gemini-1.5-flash-001",  # Opción 1: El más rápido y moderno
    "gemini-1.5-pro-001",    # Opción 2: El más inteligente
    "gemini-1.0-pro",        # Opción 3: El clásico
    "gemini-pro"             # Opción 4: Genérico
]

# Configuración del Micrófono
RATE = 16000
CHUNK = int(RATE / 10)  # 100ms

class MicrophoneStream:
    """Abre un stream de grabación y genera trozos de audio."""
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
    """Inicializa Vertex AI con el proyecto correcto."""
    print(f"🔄 Conectando con Vertex AI (Proyecto: {PROJECT_ID})...")
    try:
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        return True
    except Exception as e:
        print(f"❌ Error inicializando Vertex AI: {e}")
        return False

def generate_response_smart(prompt_text):
    """Intenta obtener respuesta probando varios modelos."""
    
    for model_name in MODELS_TO_TRY:
        try:
            # print(f"   intentando con modelo: {model_name}...") # Descomentar para depurar
            model = GenerativeModel(model_name)
            response = model.generate_content(prompt_text)
            return response.text
        except google.api_core.exceptions.NotFound:
            # El modelo no existe, probamos el siguiente
            continue
        except Exception as e:
            print(f"⚠️ Error con {model_name}: {e}")
            continue
    
    return "❌ Error: No pude conectar con ningún modelo de IA disponible."

def listen_print_loop(responses):
    """Itera sobre las respuestas del servidor y detecta texto final."""
    for response in responses:
        if not response.results:
            continue

        result = response.results[0]
        if not result.alternatives:
            continue

        transcript = result.alternatives[0].transcript

        # Si el resultado es final (el usuario dejó de hablar)
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
    # 1. Configurar credenciales
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "key.json"
    
    # 2. Inicializar Vertex AI
    if not init_vertex_ai():
        return

    # 3. Configurar Reconocimiento de Voz
    client = speech.SpeechClient()
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=RATE,
        language_code="es-ES", # Español
    )
    streaming_config = speech.StreamingRecognitionConfig(
        config=config,
        interim_results=True 
    )

    print("\n🟢 SISTEMA LISTO. Habla ahora...")
    print("(Presiona Ctrl+C para detener forzosamente)")

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
        print("\n🛑 Programa detenido por el usuario.")
