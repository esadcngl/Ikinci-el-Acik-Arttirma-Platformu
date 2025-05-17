# ai_api.py
from flask import Flask, request, jsonify
from transformers import pipeline
from fiyat_cekici import letgo_arama
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
# 📌 Zero-shot modeli (çok stabil)
classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)

# 📦 Tahmin edilecek açıklamalı kategoriler
CATEGORIES = [
    "Elektronik (telefon, bilgisayar, televizyon)",
    "Moda (giyim, ayakkabı, aksesuar)",
    "Ev & Yaşam (mobilya, ev tekstili)",
    "Spor & Outdoor (spor ekipmanları)",
    "Koleksiyon (antikalar, pul, figür)",
    "Araçlar (otomobil, yedek parça)",
    "Emlak (daire, arsa, konut)",
    "Hizmetler (temizlik, tamir)",
    "Hobi & Oyuncak (oyuncaklar, maketler)",
    "Kitap, Film & Müzik"
]

@app.route("/predict/", methods=["POST"])
def predict():
    data = request.get_json()
    title = data.get("title", "")
    description = data.get("description", "")
    if not title or not description:
        return jsonify({"error": "title ve description zorunludur"}), 400

    text = f"{title.strip()}. {description.strip()}"
    web_price_estimate = letgo_arama(title)
    result = classifier(text, CATEGORIES)

    return jsonify({
        "predicted_category": result["labels"][0],
        "confidence": round(result["scores"][0] * 100, 2),
        "estimated_price_web": web_price_estimate
    })

if __name__ == "__main__":
    app.run(port=5001)
