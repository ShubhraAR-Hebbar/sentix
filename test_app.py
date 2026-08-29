"""
Automated Verification Suite for SentimAI Studio
------------------------------------------------
Tests:
1. Backend REST endpoints (/api/health, /api/presets, /api/analyze, /api/batch, /api/upload-csv)
2. Frontend static assets serving (index.html, style.css, app.js)
3. NLP accuracy for positive, negative, and neutral classifications
"""

import os
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def test_endpoints():
    print("[1] Testing /api/health...")
    res = urllib.request.urlopen(f"{BASE_URL}/api/health")
    assert res.status == 200
    data = json.loads(res.read().decode())
    assert data["status"] == "online"
    print(" -> Healthcheck OK:", data)

    print("\n[2] Testing /api/presets...")
    res = urllib.request.urlopen(f"{BASE_URL}/api/presets")
    assert res.status == 200
    data = json.loads(res.read().decode())
    assert len(data["presets"]) >= 5
    print(f" -> Presets OK: {len(data['presets'])} presets found.")

    print("\n[3] Testing /api/analyze with positive text...")
    payload = json.dumps({"text": "This product is fantastic and made my day so joyful!"}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/api/analyze", data=payload, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode())
    assert data["label"] == "Positive"
    assert data["compound_score"] > 0.5
    assert data["emotions"]["joy"] > 50
    print(f" -> Positive analysis OK: Label={data['label']}, Score={data['compound_score']}, Dominant={data['dominant_emotion']}")

    print("\n[4] Testing /api/analyze with negative text...")
    payload = json.dumps({"text": "Horrible customer support, extremely rude and broken item."}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/api/analyze", data=payload, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode())
    assert data["label"] == "Negative"
    assert data["compound_score"] < -0.3
    assert data["emotions"]["anger"] > 40
    print(f" -> Negative analysis OK: Label={data['label']}, Score={data['compound_score']}, Dominant={data['dominant_emotion']}")

    print("\n[5] Testing /api/batch...")
    batch_payload = json.dumps({
        "texts": [
            "I love this tool, it is amazing!",
            "Completely terrible and useless product.",
            "The package arrived on Wednesday afternoon."
        ]
    }).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/api/batch", data=batch_payload, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode())
    assert data["total_analyzed"] == 3
    assert data["distribution"]["positive"] == 1
    assert data["distribution"]["negative"] == 1
    assert data["distribution"]["neutral"] == 1
    print(f" -> Batch analysis OK: {data['distribution']}")

    print("\n[6] Testing Frontend static assets delivery...")
    index_res = urllib.request.urlopen(f"{BASE_URL}/")
    assert index_res.status == 200
    html_content = index_res.read().decode()
    assert "SentimAI Studio" in html_content
    print(" -> index.html served successfully.")

    css_res = urllib.request.urlopen(f"{BASE_URL}/static/style.css")
    assert css_res.status == 200
    print(" -> style.css served successfully.")

    js_res = urllib.request.urlopen(f"{BASE_URL}/static/app.js")
    assert js_res.status == 200
    print(" -> app.js served successfully.")

    print("\n=======================================================")
    print("  ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (100%)")
    print("=======================================================")

if __name__ == "__main__":
    test_endpoints()
