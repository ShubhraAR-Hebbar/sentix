"""
SentimAI Studio - App Entrypoint
--------------------------------
Export FastAPI instance 'app' for Vercel deployment.
"""
import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app import app
