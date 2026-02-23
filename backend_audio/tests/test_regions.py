import os
import vertexai
from vertexai.generative_models import GenerativeModel

# --- CONFIGURACIÓN ACTUALIZADA ---
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "key.json"
# ESTE ES TU NUEVO PROYECTO (EL QUE VIMOS EN LA LLAVE)
PROJECT_ID = "gen-lang-client-0356838678" 

# Las regiones donde suele esconderse Google
REGIONES_A_PROBAR = [
    "us-central1",  # La estándar
    "us-east4",     # Virginia
    "us-west1",     # Oregon
    "northamerica-northeast1", # Montreal
    "us-east1",     # Carolina del Sur
    "us-west4",     # Las Vegas
]

print(f"🚀 Buscando a Gemini para el proyecto: {PROJECT_ID}")
print("----------------------------------------------------")

found = False

for region in REGIONES_A_PROBAR:
    print(f"🌎 Probando en: {region} ... ", end="")
    try:
        # Intentamos conectar en esta región específica
        vertexai.init(project=PROJECT_ID, location=region)
        
        # Prueba de vida con el modelo más básico
        model = GenerativeModel("gemini-1.0-pro-001")
        response = model.generate_content("Di HOLA")
        
        print("✅ ¡CONECTADO!")
        print(f"\n🎉 ¡ENCONTRADO! Tienes que cambiar la región a: '{region}'")
        found = True
        break 
    except Exception as e:
        if "404" in str(e):
            print("❌ (404) No está aquí.")
        elif "403" in str(e):
            print("🔒 (403) Permiso denegado (API apagada o falta rol).")
        else:
            print(f"⚠️ Error raro: {str(e)[:50]}...")

if not found:
    print("\n😓 Resultado: No lo encontramos en ninguna región común.")
    print("Si todos dieron '404', la API Vertex AI podría no estar activada para ESTE proyecto específico.")
    print("Si dieron '403', faltan permisos en IAM.")
