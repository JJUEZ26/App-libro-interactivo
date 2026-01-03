import os
import vertexai
from vertexai.generative_models import GenerativeModel

# --- CONFIGURACIÓN ---
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "key.json"
PROJECT_ID = "995012067544"

# Las regiones más comunes donde vive Gemini
REGIONES_A_PROBAR = [
    "us-central1",  # Iowa (La más común)
    "us-east4",     # Virginia
    "us-west1",     # Oregon
    "northamerica-northeast1", # Montreal
    "us-east1",     # Carolina del Sur
]

print(f"🚀 Iniciando búsqueda de Gemini en varias regiones...")
print(f"🆔 Proyecto: {PROJECT_ID}\n")

found = False

for region in REGIONES_A_PROBAR:
    print(f"🌎 Tocando la puerta en: {region} ... ", end="")
    try:
        # Inicializamos Vertex en esta región específica
        vertexai.init(project=PROJECT_ID, location=region)
        
        # Probamos con el modelo más básico para ver si responde
        model = GenerativeModel("gemini-1.0-pro-001")
        response = model.generate_content("Hola")
        
        print("✅ ¡ABRIERON LA PUERTA!")
        print(f"\n🎉 ¡ENCONTRADO! Tu región correcta es: {region}")
        print(f"🤖 Gemini respondió: {response.text}")
        found = True
        break # Dejamos de buscar
    except Exception as e:
        # Si el error es 404, es que no está aquí.
        if "404" in str(e):
            print("❌ No está aquí (404).")
        else:
            print(f"⚠️ Error diferente: {str(e)[:50]}...")

if not found:
    print("\n😓 No lo encontramos en las regiones comunes.")
    print("Por favor, abre tu archivo 'key.json' con el Bloc de Notas y mira si dentro dice algo de 'project_id' diferente.")
