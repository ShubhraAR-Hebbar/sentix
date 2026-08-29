"""
SentimAI Studio - Main Entrypoint
---------------------------------
Compatible with Vercel serverless deployment and local execution.
"""
import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main.py:app", host="127.0.0.1", port=8000, reload=True)
