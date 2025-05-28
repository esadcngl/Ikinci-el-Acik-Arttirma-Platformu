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
    "Elektronik ürünler (telefon, bilgisayar, televizyon vs.)",
    "Moda ve giyim (kıyafet, ayakkabı, aksesuar)",
    "Ev ve yaşam ürünleri (mobilya, ev dekorasyonu, mutfak araçları)",
    "Spor ve outdoor ekipmanları (bisiklet, kamp eşyaları, fitness aletleri)",
    "Otomotiv ve yedek parçalar (araba parçaları, araçlar)",
    "Antika eşyalar (eski saatler, koleksiyon ürünleri)",
    "Sanat eserleri ve el sanatları (resim, el işi, heykel)",
    "Hobi ve oyuncaklar (lego, model uçak, maket)",
    "Kitap, film ve müzik ürünleri (roman, CD, plak)",
    "Diğer (kategori dışı ürünler)"
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
    app.run(host='0.0.0.0', port=5001)
