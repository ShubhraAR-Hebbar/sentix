"""
AI Sentiment & Emotion Analyzer Engine
---------------------------------------
This module handles Natural Language Processing (NLP) tasks:
1. Lexicon-based Polarity Analysis (VADER algorithm)
2. Fine-grained Emotion Detection (Joy, Anger, Sadness, Fear, Surprise, Trust/Calm)
3. Word-by-Word Sentiment Tokenization (for interactive UI text highlighting)
4. Key Driver Extraction (most influential positive & negative words)
"""

import re
import math
from typing import Dict, List, Any
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Ensure required NLTK datasets are downloaded silently
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon', quiet=True)

try:
    nltk.data.find('tokenizers/punkt.zip')
except LookupError:
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)

# Initialize VADER analyzer
_vader = SentimentIntensityAnalyzer()

# Emotion lexicon keywords for rule-augmented contextual emotion detection
EMOTION_LEXICONS = {
    "joy": {
        "keywords": [
            "happy", "joy", "delighted", "love", "awesome", "great", "excellent", 
            "amazing", "fantastic", "wonderful", "glad", "blessed", "thrilled", 
            "enjoy", "superb", "brilliant", "perfect", "good", "best", "pleased",
            "excited", "cherish", "positive", "success", "celebrate", "smile", "fun"
        ],
        "weight": 1.2
    },
    "anger": {
        "keywords": [
            "angry", "furious", "hate", "mad", "rage", "terrible", "horrible",
            "awful", "worst", "annoyed", "irritated", "disgusted", "offensive",
            "trash", "useless", "garbage", "cheat", "scam", "frustrated", "hostile",
            "unfair", "screw", "stupid", "idiot", "pissed", "rude"
        ],
        "weight": 1.2
    },
    "sadness": {
        "keywords": [
            "sad", "depressed", "unhappy", "sorrow", "crying", "tears", "pain",
            "grief", "heartbroken", "disappointed", "regret", "miss", "lost",
            "lonely", "hopeless", "hurt", "tragic", "down", "gloomy", "fail", "failed",
            "unfortunate", "ruined", "sorry"
        ],
        "weight": 1.1
    },
    "fear": {
        "keywords": [
            "scared", "fear", "afraid", "terrified", "panic", "worried", "anxious",
            "nervous", "dread", "frightened", "threat", "danger", "risky", "uncertain",
            "stress", "stressed", "alarm", "crisis", "warning", "caution", "hesitant"
        ],
        "weight": 1.1
    },
    "surprise": {
        "keywords": [
            "wow", "surprise", "surprised", "shocked", "unexpected", "astonished",
            "unbelievable", "mindblowing", "stunning", "extraordinary", "unreal",
            "sudden", "amazed", "unforeseen", "startled", "curious"
        ],
        "weight": 1.0
    },
    "trust_calm": {
        "keywords": [
            "trust", "reliable", "secure", "confident", "safe", "stable", "calm",
            "peaceful", "balanced", "solid", "accurate", "honest", "guaranteed",
            "steady", "comfortable", "loyal", "respect", "friendly"
        ],
        "weight": 1.0
    }
}


def clean_text(text: str) -> str:
    """Preprocess text by trimming extra whitespaces."""
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()


def get_token_sentiment(word: str) -> Dict[str, Any]:
    """
    Evaluate sentiment for a single token using VADER lexicon.
    Returns polarity category and individual score.
    """
    clean_w = re.sub(r'[^\w\s]', '', word).lower()
    if not clean_w:
        return {"word": word, "sentiment": "neutral", "score": 0.0}
    
    score = _vader.polarity_scores(clean_w)["compound"]
    
    if score >= 0.15:
        sentiment = "positive"
    elif score <= -0.15:
        sentiment = "negative"
    else:
        sentiment = "neutral"
        
    return {
        "word": word,
        "clean_word": clean_w,
        "sentiment": sentiment,
        "score": round(score, 3)
    }


def tokenize_with_sentiment(text: str) -> List[Dict[str, Any]]:
    """
    Split text into words and punctuation while preserving structure
    and tagging each token with its sentiment category.
    """
    # Regex split to keep words and punctuation separate
    tokens = re.findall(r'\b[\w\'-]+\b|[^\w\s]|\s+', text)
    result = []
    
    for token in tokens:
        if token.isspace() or re.match(r'^[^\w\s]+$', token):
            result.append({
                "text": token,
                "is_word": False,
                "sentiment": "neutral",
                "score": 0.0
            })
        else:
            token_meta = get_token_sentiment(token)
            result.append({
                "text": token,
                "is_word": True,
                "sentiment": token_meta["sentiment"],
                "score": token_meta["score"]
            })
    return result


def detect_emotions(text: str, polarity_scores: Dict[str, float]) -> Dict[str, int]:
    """
    Detect multi-dimensional emotion distribution percentages based on
    lexicon scoring and polarity indicators.
    """
    lower_text = text.lower()
    words = re.findall(r'\b\w+\b', lower_text)
    total_words = max(len(words), 1)
    
    raw_scores = {
        "joy": 0.0,
        "anger": 0.0,
        "sadness": 0.0,
        "fear": 0.0,
        "surprise": 0.0,
        "trust_calm": 0.0
    }
    
    # 1. Base emotion scores from keywords
    for emotion, data in EMOTION_LEXICONS.items():
        count = 0
        for kw in data["keywords"]:
            if kw in lower_text:
                # Count occurrences
                count += lower_text.count(kw)
        raw_scores[emotion] = count * data["weight"]
    
    # 2. Polarity amplification
    compound = polarity_scores["compound"]
    pos = polarity_scores["pos"]
    neg = polarity_scores["neg"]
    neu = polarity_scores["neu"]
    
    if compound > 0.3:
        raw_scores["joy"] += pos * 2.5
        raw_scores["trust_calm"] += pos * 1.5
    elif compound < -0.3:
        raw_scores["anger"] += neg * 2.0
        raw_scores["sadness"] += neg * 1.5
        raw_scores["fear"] += neg * 1.0
    else:
        raw_scores["trust_calm"] += neu * 1.5
        
    # Baseline if all zero
    total_emotion_sum = sum(raw_scores.values())
    if total_emotion_sum <= 0.001:
        if compound > 0.05:
            raw_scores["joy"] = 0.6
            raw_scores["trust_calm"] = 0.4
        elif compound < -0.05:
            raw_scores["sadness"] = 0.5
            raw_scores["anger"] = 0.5
        else:
            raw_scores["trust_calm"] = 1.0
            
    # Normalize to integer percentages summing to 100%
    total_sum = sum(raw_scores.values())
    percentages = {}
    for emo, val in raw_scores.items():
        percentages[emo] = int(round((val / total_sum) * 100))
        
    # Ensure exact 100 sum
    diff = 100 - sum(percentages.values())
    max_emo = max(percentages, key=percentages.get)
    percentages[max_emo] += diff
    
    return percentages


def extract_key_drivers(tokenized_tokens: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """
    Extract unique strong positive and strong negative words that influenced the score.
    """
    positive_words = set()
    negative_words = set()
    
    for t in tokenized_tokens:
        if t.get("is_word"):
            score = t.get("score", 0.0)
            word = t.get("text", "").lower()
            if score >= 0.2 and len(word) > 2:
                positive_words.add(word)
            elif score <= -0.2 and len(word) > 2:
                negative_words.add(word)
                
    return {
        "positive": sorted(list(positive_words)),
        "negative": sorted(list(negative_words))
    }


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Primary API analysis function.
    Given raw text input, performs comprehensive sentiment & emotion breakdown.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return {
            "text": "",
            "label": "Neutral",
            "compound_score": 0.0,
            "confidence": 0,
            "sentiment_breakdown": {"positive": 0, "neutral": 100, "negative": 0},
            "emotions": {"joy": 0, "anger": 0, "sadness": 0, "fear": 0, "surprise": 0, "trust_calm": 100},
            "dominant_emotion": "trust_calm",
            "subjectivity": "Objective",
            "intensity": "Neutral",
            "stats": {"word_count": 0, "char_count": 0, "reading_time_sec": 0},
            "tokens": [],
            "key_drivers": {"positive": [], "negative": []},
            "explanation": "No text was provided to analyze."
        }

    # 1. Compute VADER Polarity Scores
    scores = _vader.polarity_scores(cleaned)
    compound = scores["compound"]
    pos_pct = int(round(scores["pos"] * 100))
    neg_pct = int(round(scores["neg"] * 100))
    neu_pct = 100 - (pos_pct + neg_pct)
    if neu_pct < 0:
        neu_pct = 0

    # 2. Determine Overall Label & Confidence
    if compound >= 0.05:
        label = "Positive"
        # Confidence scaled by polarity distance from neutral boundary
        confidence = min(99, int(50 + (compound * 49)))
    elif compound <= -0.05:
        label = "Negative"
        confidence = min(99, int(50 + (abs(compound) * 49)))
    else:
        label = "Neutral"
        confidence = min(95, int(60 + (scores["neu"] * 35)))

    # 3. Intensity classification
    abs_compound = abs(compound)
    if abs_compound >= 0.75:
        intensity = "Extreme"
    elif abs_compound >= 0.45:
        intensity = "Strong"
    elif abs_compound >= 0.15:
        intensity = "Moderate"
    else:
        intensity = "Mild"

    # 4. Subjectivity Estimation
    # Subjectivity increases with higher proportion of emotional polarity
    emotional_ratio = scores["pos"] + scores["neg"]
    if emotional_ratio > 0.35:
        subjectivity = "Highly Subjective (Opinionated)"
    elif emotional_ratio > 0.15:
        subjectivity = "Moderately Subjective"
    else:
        subjectivity = "Objective (Factual Tone)"

    # 5. Token Sentiment Highlighting
    tokens = tokenize_with_sentiment(text)
    
    # 6. Emotion Detection
    emotions = detect_emotions(cleaned, scores)
    dominant_emotion = max(emotions, key=emotions.get)

    # 7. Key sentiment driver words
    key_drivers = extract_key_drivers(tokens)

    # 8. Text statistics
    words = cleaned.split()
    word_count = len(words)
    char_count = len(cleaned)
    reading_time = max(1, math.ceil(word_count / 3.5))  # ~200 wpm = 3.3 words/sec

    # 9. Natural Language AI Explanation Summary
    if label == "Positive":
        explanation = f"The text expresses a predominantly positive sentiment (Score: {compound:+.2f}). Key drivers include positive words like {', '.join(key_drivers['positive'][:3]) if key_drivers['positive'] else 'constructive framing'}."
    elif label == "Negative":
        explanation = f"The text expresses a predominantly negative sentiment (Score: {compound:+.2f}). Key drivers include critical words like {', '.join(key_drivers['negative'][:3]) if key_drivers['negative'] else 'critical tone'}."
    else:
        explanation = f"The text maintains a balanced or objective tone with low emotional bias (Score: {compound:+.2f})."

    return {
        "text": cleaned,
        "label": label,
        "compound_score": round(compound, 3),
        "confidence": confidence,
        "sentiment_breakdown": {
            "positive": pos_pct,
            "neutral": neu_pct,
            "negative": neg_pct
        },
        "emotions": emotions,
        "dominant_emotion": dominant_emotion,
        "subjectivity": subjectivity,
        "intensity": intensity,
        "stats": {
            "word_count": word_count,
            "char_count": char_count,
            "reading_time_sec": reading_time
        },
        "tokens": tokens,
        "key_drivers": key_drivers,
        "explanation": explanation
    }


def analyze_batch(texts: List[str]) -> Dict[str, Any]:
    """
    Analyze multiple texts in batch and return individual results
    plus aggregate distribution statistics.
    """
    results = []
    counts = {"Positive": 0, "Negative": 0, "Neutral": 0}
    total_compound = 0.0
    
    for t in texts:
        if not t.strip():
            continue
        res = analyze_sentiment(t)
        results.append(res)
        counts[res["label"]] += 1
        total_compound += res["compound_score"]
        
    total_count = len(results)
    avg_compound = round(total_compound / total_count, 3) if total_count > 0 else 0.0
    
    return {
        "total_analyzed": total_count,
        "distribution": {
            "positive": counts["Positive"],
            "negative": counts["Negative"],
            "neutral": counts["Neutral"],
            "positive_pct": round((counts["Positive"] / total_count * 100), 1) if total_count > 0 else 0,
            "negative_pct": round((counts["Negative"] / total_count * 100), 1) if total_count > 0 else 0,
            "neutral_pct": round((counts["Neutral"] / total_count * 100), 1) if total_count > 0 else 0
        },
        "average_sentiment_score": avg_compound,
        "overall_sentiment": "Positive" if avg_compound >= 0.05 else ("Negative" if avg_compound <= -0.05 else "Neutral"),
        "items": results
    }
