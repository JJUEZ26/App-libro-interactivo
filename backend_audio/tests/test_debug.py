import os
import vertexai
from vertexai.generative_models import GenerativeModel
from google.oauth2 import service_account
import google.api_core.exceptions

# --- CONFIGURACIÓN ---
# 1. Asegúrate de que el nombre coincida con tu archivo descargado
KEY_FILE = "key.json" 
PROJECT_ID = "gemini-voz-pro" # Pon el ID de tu proyecto nuevo aquí

def debug_connection():
    print(f"🔍 Iniciando diagnóstico...")
    
    # Validar archivo
    if not os.path.exists(KEY_FILE):
        print(f"❌ ERROR: No encuentro el archivo {KEY_FILE} en esta carpeta.")
        return

    try:
        # Cargar credenciales
        creds = service_account.Credentials.from_service_account_file(KEY_FILE)
        vertexai.init(project=PROJECT_ID, location="us-central1", credentials=creds)
        
        print(f"✅ Llave cargada. Probando Gemini...")
        
        model = GenerativeModel("gemini-1.5-flash")
        response = model.generate_content("Hola, ¿estás ahí?")
        
        print(f"🚀 ¡ÉXITO! Gemini respondió: {response.text}")

    except google.api_core.exceptions.PermissionDenied as e:
        print(f"❌ ERROR DE PERMISOS: La cuenta de servicio no tiene permisos de Vertex AI.")
        print(f"Detalle: {e}")
    except google.api_core.exceptions.NotFound as e:
        print(f"❌ ERROR DE PROYECTO: El Project ID '{PROJECT_ID}' no existe o la API no está habilitada.")
        print(f"Detalle: {e}")
    except Exception as e:
        print(f"❌ ERROR DESCONOCIDO:")
        print(type(e).__name__, ":", e)

if __name__ == "__main__":
    debug_connection()