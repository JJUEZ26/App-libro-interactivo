import os
import vertexai
from vertexai.generative_models import GenerativeModel

# CONFIGURACIÓN
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "key.json"
PROJECT_ID = "995012067544"
LOCATION = "us-central1"

print(f"------------ DIAGNÓSTICO ------------")
print(f"🆔 Proyecto: {PROJECT_ID}")
print(f"🌍 Ubicación: {LOCATION}")
print(f"🔑 Llave: key.json")
print(f"-------------------------------------")

def probar_modelo(nombre):
    print(f"\n👉 Probando conexión con: {nombre}...")
    try:
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        model = GenerativeModel(nombre)
        response = model.generate_content("Responde solo con la palabra: FUNCIONA")
        print(f"✅ ¡ÉXITO! El modelo respondió: {response.text}")
        return True
    except Exception as e:
        print(f"❌ FALLÓ. Aquí está el error exacto:")
        print(e) # ¡Aquí veremos la verdad!
        return False

# Probamos los dos modelos principales
if not probar_modelo("gemini-1.5-flash-001"):
    probar_modelo("gemini-1.0-pro-001")
