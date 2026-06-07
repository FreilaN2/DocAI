import os
import requests
from dotenv import load_dotenv

load_dotenv()

KEYS = [os.getenv(f"GROQ_API_KEY_{i}") for i in range(1, 9)]
MODELS = ["llama-3.3-70b-versatile", "meta-llama/llama-4-scout-17b-16e-instruct"]

def check_key(key, index):
    if not key:
        print(f"Key {index}: Not found in .env")
        return
    
    print(f"\n--- Checking Key {index} ---")
    # Mostrar solo el inicio y fin de la key por seguridad
    safe_key = f"{key[:8]}...{key[-4:]}"
    print(f"Key preview: {safe_key}")
    
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    
    for model in MODELS:
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": "hi"}],
            "max_tokens": 1
        }
        
        try:
            res = requests.post(
                "https://api.groq.com/openai/v1/chat/completions", 
                headers=headers, 
                json=payload, 
                timeout=15
            )
            
            if res.status_code == 200:
                rem_tokens = res.headers.get("x-ratelimit-remaining-tokens", "Unknown")
                limit_tokens = res.headers.get("x-ratelimit-limit-tokens", "Unknown")
                rem_req = res.headers.get("x-ratelimit-remaining-requests", "Unknown")
                print(f"  [{model}]")
                print(f"    Tokens min: {rem_tokens} restantes de {limit_tokens} límite por min")
                print(f"    Peticiones: {rem_req} restantes por min")
            elif res.status_code == 429:
                rem_tokens = res.headers.get("x-ratelimit-remaining-tokens", "0")
                limit_tokens = res.headers.get("x-ratelimit-limit-tokens", "Unknown")
                reset_time = res.headers.get("x-ratelimit-reset", "Unknown")
                print(f"  [{model}] -> ¡LÍMITE ALCANZADO (429)!")
                print(f"    Tokens restantes: {rem_tokens}/{limit_tokens}. Reset en: {reset_time}")
            else:
                print(f"  [{model}] -> Error {res.status_code}: {res.json().get('error', {}).get('message', res.text)}")
        except Exception as e:
            print(f"  [{model}] -> Error de conexión: {e}")

if __name__ == "__main__":
    print("==============================================")
    print(" Consultando tokens de Groq (8 API Keys)")
    print("==============================================")
    for i, key in enumerate(KEYS, start=1):
        check_key(key, i)
    print("\nProceso finalizado.")
