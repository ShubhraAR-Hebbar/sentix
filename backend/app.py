"""
FastAPI Server for AI Sentiment & Emotion Studio
------------------------------------------------
Provides REST APIs for:
- Real-time text sentiment & emotion analysis
- Batch processing & CSV review analysis
- Interactive presets for testing
- Static file serving for the frontend dashboard
"""

import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from backend.analyzer import analyze_sentiment, analyze_batch

# Initialize FastAPI application
app = FastAPI(
    title="AI Sentiment & Emotion Studio API",
    description="Full-featured NLP API for polarity, emotion, and keyword sentiment detection",
    version="1.0.0"
)

# Enable CORS for local development and testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request & response schemas
class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Text input to analyze", min_length=1)

class BatchRequest(BaseModel):
    texts: List[str] = Field(..., description="List of text strings to analyze", min_length=1)


# Preset test examples for beginner exploration
PRESETS = [
    {
        "id": "ecom_positive",
        "title": "5-Star Product Review",
        "category": "E-Commerce",
        "badge": "Positive",
        "text": "This mechanical keyboard is absolutely incredible! The keys feel buttery smooth, the RGB backlight is gorgeous, and typing on it is pure joy. Best purchase I made this year!"
    },
    {
        "id": "support_negative",
        "title": "Frustrated Support Ticket",
        "category": "Customer Support",
        "badge": "Negative",
        "text": "I am deeply disappointed with the terrible service. My order arrived 2 weeks late, the package was broken, and customer support was completely rude and unresponsive. I demand a full refund immediately."
    },
    {
        "id": "movie_mixed",
        "title": "Nuanced Film Review",
        "category": "Entertainment",
        "badge": "Mixed / Nuanced",
        "text": "The cinematography and musical score were breathtaking masterpieces, but unfortunately the pacing felt dragged out and the storyline had several confusing plot holes."
    },
    {
        "id": "tech_hype",
        "title": "Tech Launch Tweet",
        "category": "Social Media",
        "badge": "Excited / Joy",
        "text": "Just tested the new AI model release and my mind is completely blown! The speed improvements are unreal. Super excited to see what developers build with this!"
    },
    {
        "id": "neutral_news",
        "title": "Objective News Report",
        "category": "Journalism",
        "badge": "Neutral",
        "text": "The Federal Reserve concluded its two-day policy meeting on Wednesday, maintaining the benchmark interest rate unchanged at 5.25 percent according to official statements."
    }
]


@app.get("/api/health")
async def health_check():
    """Health check endpoint to verify backend status."""
    return {"status": "online", "model": "VADER Lexicon NLP Engine", "version": "1.0.0"}


@app.get("/api/presets")
async def get_presets():
    """Returns curated presets for quick UI exploration."""
    return {"presets": PRESETS}


@app.post("/api/analyze")
async def analyze_single_text(payload: AnalyzeRequest):
    """
    Analyze a single text input.
    Returns polarity score, emotions spectrum, key driver keywords, and highlights.
    """
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    result = analyze_sentiment(text)
    return result


@app.post("/api/batch")
async def analyze_batch_texts(payload: BatchRequest):
    """
    Analyze multiple texts in batch.
    Returns individual item breakdowns and aggregate statistical distribution.
    """
    if not payload.texts:
        raise HTTPException(status_code=400, detail="Text list cannot be empty.")
    
    result = analyze_batch(payload.texts)
    return result


@app.post("/api/upload-csv")
async def upload_csv_file(file: UploadFile = File(...)):
    """
    Upload a CSV or TXT file with reviews/comments to analyze in bulk.
    """
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Please upload a .csv or .txt file.")
    
    content = await file.read()
    try:
        lines = content.decode('utf-8', errors='ignore').splitlines()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    # Filter valid lines
    texts = [line.strip().strip('"').strip("'") for line in lines if line.strip()]
    if not texts:
        raise HTTPException(status_code=400, detail="File does not contain any readable text.")
    
    # Process batch (cap at 200 for rapid local response)
    processed_texts = texts[:200]
    result = analyze_batch(processed_texts)
    result["filename"] = file.filename
    result["truncated"] = len(texts) > 200
    result["original_total"] = len(texts)
    return result


# Mount frontend static files directory
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/")
    async def serve_index():
        """Serve the main frontend UI."""
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return JSONResponse({"message": "Frontend index.html not found. Place it in frontend/ directory."})
