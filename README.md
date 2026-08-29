# 🌟 SentimAI Studio - AI-Powered Sentiment & Emotion Analysis

> An interactive, modern, full-stack Artificial Intelligence project designed for beginners to learn and master **Natural Language Processing (NLP)**, **Sentiment Analysis**, and **API Development**.

---

## 🎯 What You Will Learn in This Project

1. **Natural Language Processing (NLP)**: How computers convert human text into tokens and compute emotional sentiment polarity.
2. **The VADER Algorithm**: How rule-augmented valence scoring evaluates positive, negative, and neutral tones along with intensity.
3. **Multi-Dimensional Emotion Recognition**: Detecting distinct emotional signals like **Joy**, **Anger**, **Sadness**, **Surprise**, **Fear**, and **Calm/Trust**.
4. **Backend API Engineering**: Creating production-ready RESTful endpoints using **FastAPI** and **Pydantic**.
5. **Modern Web Development**: Building a responsive, glassmorphic dark-mode dashboard with animated gauges, live debounced typing analysis, and CSV review processing.

---

## 🚀 Quick Start Guide (How to Run)

### Method 1: 1-Click Startup (Windows)
Double-click [`run.bat`](file:///c:/Users/Shubhra/OneDrive/Desktop/sentimentA/run.bat) in the project folder. It will automatically check dependencies and open the studio in your browser at `http://127.0.0.1:8000`.

### Method 2: Manual Terminal Commands

1. **Open PowerShell or Terminal** in this project directory:
   ```bash
   cd c:\Users\Shubhra\OneDrive\Desktop\sentimentA
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the FastAPI Backend Server**:
   ```bash
   python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
   ```

4. **Open in Browser**:
   Visit [http://127.0.0.1:8000](http://127.0.0.1:8000) in Chrome, Edge, or Firefox.

---

## 📂 Project Architecture

```
sentimentA/
│
├── backend/
│   ├── __init__.py
│   ├── analyzer.py        # Core NLP logic: VADER, tokenization, emotion spectra, keyword drivers
│   └── app.py             # FastAPI server with REST endpoints & static file mounting
│
├── frontend/
│   ├── index.html         # Modern glassmorphic web dashboard
│   ├── style.css          # Dark-theme CSS tokens, neon glow, animated gauge & progress bars
│   └── app.js             # Client-side controller (live debouncing, API calls, CSV export)
│
├── sample_reviews.csv     # Sample dataset for bulk review testing
├── requirements.txt       # Python packages (fastapi, uvicorn, nltk, pydantic)
├── run.bat                # 1-click startup script for Windows
└── README.md              # Beginner tutorial & documentation
```

---

## 🧠 How the AI Works (Step-by-Step)

```
[Raw User Text]
       │
       ▼
1. Tokenization & Cleaning ───► Splits text into individual words, punctuation, and emoji
       │
       ▼
2. Valence Dictionary Lookup ─► Matches tokens against intensity ratings (e.g. "love" = +3.2)
       │
       ▼
3. Heuristic Modifiers ───────► Applies rules for ALL-CAPS, punctuation (!), booster words ("super", "extremely")
       │
       ▼
4. Compound Score (-1 to +1) ─► Normalizes polarity:
                                 • Compound >= +0.05 ➔ Positive
                                 • Compound <= -0.05 ➔ Negative
                                 • In-between       ➔ Neutral
       │
       ▼
5. Emotion Spectrum ──────────► Classifies % distribution (Joy, Anger, Sadness, Fear, Surprise, Trust)
```

---

## 🧪 Key Features in the Dashboard

- ⚡ **Real-Time Live Typing**: Analyzes sentiment automatically with smart 250ms debouncing as you type.
- 🎯 **Animated Sentiment Gauge**: Dynamic speedometer needle with glowing polarity arcs.
- 🌈 **Emotion Spectrum Bars**: Visual breakdown of Joy, Trust, Surprise, Sadness, Anger, and Fear.
- 🔍 **Token Inspector**: Highlights individual positive words in green and negative words in red.
- 📦 **Batch Reviews & CSV Dropzone**: Test entire batches of customer feedback or drop `.csv` files and export results.
- 💡 **Curated Presets**: One-click test cases for e-commerce reviews, customer tickets, movie reviews, and news headlines.

---

## 🛠️ How to Customize & Extend

- **Add Custom Slang / Jargon**: Open [`backend/analyzer.py`](file:///c:/Users/Shubhra/OneDrive/Desktop/sentimentA/backend/analyzer.py) and add custom words to `EMOTION_LEXICONS` or update VADER's dictionary via `_vader.lexicon.update({'fire': 2.5, 'mid': -1.2})`.
- **Integrate HuggingFace Transformers**: Add `transformers` and `torch` to `requirements.txt` to swap or ensemble with deep-learning models like `cardiffnlp/twitter-roberta-base-sentiment-latest` or `distilbert-base-uncased-finetuned-sst-2-english`.
