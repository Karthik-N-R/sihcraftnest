import os
import sys
import json
import numpy as np

# Suppress TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

CLASS_NAMES = [
    "gond painting",
    "kalighat painting",
    "kangra painting",
    "kerala mural",
    "madhubani painting",
    "mandana art drawing",
    "pichwai painting",
    "warli painting"
]

METADATA = {
    "gond painting": {
        "craft": "Gond Painting",
        "category": "Folk Art",
        "region": "Madhya Pradesh",
        "tags": ["gond art", "folk art", "handmade", "traditional", "nature motif"]
    },
    "kalighat painting": {
        "craft": "Kalighat Painting",
        "category": "Folk Art",
        "region": "West Bengal",
        "tags": ["kalighat", "folk art", "handmade", "traditional", "bengal art"]
    },
    "kangra painting": {
        "craft": "Kangra Painting",
        "category": "Miniature Art",
        "region": "Himachal Pradesh",
        "tags": ["kangra", "pahari miniature", "handmade", "traditional", "detail work"]
    },
    "kerala mural": {
        "craft": "Kerala Mural",
        "category": "Mural Art",
        "region": "Kerala",
        "tags": ["kerala mural", "temple art", "handmade", "traditional", "natural pigments"]
    },
    "madhubani painting": {
        "craft": "Madhubani Painting",
        "category": "Folk Art",
        "region": "Bihar",
        "tags": ["madhubani", "mithila art", "folk art", "handmade", "traditional"]
    },
    "mandana art drawing": {
        "craft": "Mandana Art Drawing",
        "category": "Floor & Wall Art",
        "region": "Rajasthan",
        "tags": ["mandana art", "tribal drawing", "handmade", "traditional", "rajasthan"]
    },
    "pichwai painting": {
        "craft": "Pichwai Painting",
        "category": "Devotional Art",
        "region": "Rajasthan",
        "tags": ["pichwai", "krishna art", "devotional", "handmade", "traditional"]
    },
    "warli painting": {
        "craft": "Warli Painting",
        "category": "Tribal Art",
        "region": "Maharashtra",
        "tags": ["warli", "tribal art", "handmade", "traditional", "geometric figures"]
    }
}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file not found: {image_path}"}))
        sys.exit(1)

    try:
        import keras
        from PIL import Image

        # Patch Dense layer initialization for Keras 3 deserialization compatibility
        orig_dense_init = keras.layers.Dense.__init__
        def patched_dense_init(self, *args, quantization_config=None, **kwargs):
            orig_dense_init(self, *args, **kwargs)
        keras.layers.Dense.__init__ = patched_dense_init

        model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'artisan_painting_classifier.keras')
        model = keras.models.load_model(model_path, compile=False)

        # Open and resize image
        img = Image.open(image_path).convert('RGB').resize((224, 224))
        # CRITICAL EFFICIENTNET RULE: Keep [0..255] float32 values without dividing by 255
        arr = np.expand_dims(np.array(img, dtype=np.float32), axis=0)

        predictions = model.predict(arr, verbose=0)[0]
        top_idx = int(np.argmax(predictions))
        confidence = float(predictions[top_idx])

        detected_raw = CLASS_NAMES[top_idx]
        meta = METADATA.get(detected_raw, {
            "craft": detected_raw.title(),
            "category": "Folk Art",
            "region": "India",
            "tags": [detected_raw, "handmade", "artisan"]
        })

        result = {
            "craft": meta["craft"],
            "label": meta["craft"],
            "confidence": round(confidence, 4),
            "category": meta["category"],
            "region": meta["region"],
            "tags": meta["tags"]
        }

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
