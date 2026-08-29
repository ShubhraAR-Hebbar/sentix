/**
 * SentimAI Studio - Client-Side Controller
 * ---------------------------------------
 * Handles API communication, real-time debounced analysis,
 * interactive gauge & emotion charts, batch processing, and CSV export.
 */

// Global State
let lastAnalyzedText = "";
let debounceTimer = null;
let currentBatchData = null;

// DOM Element Selectors
const elements = {
  // Navigation
  tabButtons: document.querySelectorAll('.nav-tab'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  // Single Text Controls
  textInput: document.getElementById('text-input'),
  btnAnalyze: document.getElementById('btn-analyze'),
  btnClear: document.getElementById('btn-clear'),
  liveToggle: document.getElementById('live-toggle'),
  charCount: document.getElementById('char-count'),
  wordCount: document.getElementById('word-count'),
  presetsBar: document.getElementById('presets-bar'),

  // Gauge & Verdict
  gaugeNeedle: document.getElementById('gauge-needle'),
  gaugeFillArc: document.getElementById('gauge-fill-arc'),
  verdictEmoji: document.getElementById('verdict-emoji'),
  verdictLabel: document.getElementById('verdict-label'),
  valCompound: document.getElementById('val-compound'),
  valConfidence: document.getElementById('val-confidence'),
  valSubjectivity: document.getElementById('val-subjectivity'),
  intensityBadge: document.getElementById('intensity-badge'),

  // Polarity Bars
  barPos: document.getElementById('bar-pos'),
  barNeu: document.getElementById('bar-neu'),
  barNeg: document.getElementById('bar-neg'),
  valPosPct: document.getElementById('val-pos-pct'),
  valNeuPct: document.getElementById('val-neu-pct'),
  valNegPct: document.getElementById('val-neg-pct'),

  // Emotion Spectrum
  dominantEmotionBadge: document.getElementById('dominant-emotion-badge'),
  barEmoJoy: document.getElementById('bar-emo-joy'),
  barEmoTrust: document.getElementById('bar-emo-trust'),
  barEmoSurprise: document.getElementById('bar-emo-surprise'),
  barEmoSadness: document.getElementById('bar-emo-sadness'),
  barEmoAnger: document.getElementById('bar-emo-anger'),
  barEmoFear: document.getElementById('bar-emo-fear'),
  valEmoJoy: document.getElementById('val-emo-joy'),
  valEmoTrust: document.getElementById('val-emo-trust'),
  valEmoSurprise: document.getElementById('val-emo-surprise'),
  valEmoSadness: document.getElementById('val-emo-sadness'),
  valEmoAnger: document.getElementById('val-emo-anger'),
  valEmoFear: document.getElementById('val-emo-fear'),

  // Inspector & Drivers
  tokenHighlightContainer: document.getElementById('token-highlight-container'),
  positivePills: document.getElementById('positive-pills'),
  negativePills: document.getElementById('negative-pills'),
  aiExplanationText: document.getElementById('ai-explanation-text'),

  // Batch
  batchTextarea: document.getElementById('batch-textarea'),
  btnRunBatch: document.getElementById('btn-run-batch'),
  btnBatchPreset: document.getElementById('btn-batch-preset'),
  fileDropzone: document.getElementById('file-dropzone'),
  fileUploadInput: document.getElementById('file-upload-input'),
  batchCountStatus: document.getElementById('batch-count-status'),
  batchResultsSection: document.getElementById('batch-results-section'),
  batchStatTotal: document.getElementById('batch-stat-total'),
  batchStatVerdict: document.getElementById('batch-stat-verdict'),
  batchStatAvgScore: document.getElementById('batch-stat-avg-score'),
  distBarPos: document.getElementById('dist-bar-pos'),
  distBarNeu: document.getElementById('dist-bar-neu'),
  distBarNeg: document.getElementById('dist-bar-neg'),
  distLblPos: document.getElementById('dist-lbl-pos'),
  distLblNeu: document.getElementById('dist-lbl-neu'),
  distLblNeg: document.getElementById('dist-lbl-neg'),
  batchTableBody: document.getElementById('batch-table-body'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  btnExportJson: document.getElementById('btn-export-json'),

  // Guide Modal
  btnGuideModal: document.getElementById('btn-guide-modal'),
  guideModal: document.getElementById('guide-modal'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  backendStatusBadge: document.getElementById('backend-status-badge'),
  backendStatusText: document.getElementById('backend-status-text')
};

// Default Sample Batch Dataset
const SAMPLE_BATCH_DATA = [
  "This product exceeded all my expectations, absolutely phenomenal quality!",
  "Terrible customer support and the delivery was 3 weeks late. Demanding refund.",
  "The screen display is sharp, but the battery life is quite average.",
  "Super fast shipping, friendly service, and works exactly as described.",
  "Do not buy this! It broke on the very first day. Completely useless waste of money.",
  "The concert was spectacular! The lighting, acoustics, and atmosphere were magical.",
  "The flight was delayed by 4 hours with no communication from airline staff.",
  "The software update was installed on Tuesday following routine maintenance."
];


// ============================================================================
// Initialization & Event Listeners
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initPresets();
  initInputListeners();
  initBatchListeners();
  initModalListeners();
  checkBackendHealth();

  // Load initial greeting / sample
  elements.textInput.value = "SentimAI is an amazing AI sentiment analyzer! It runs super fast and detects emotion effortlessly.";
  updateTextMeta();
  triggerAnalysis(elements.textInput.value);
});


// ============================================================================
// Tab Management
// ============================================================================
function initTabs() {
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      
      elements.tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      elements.tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const targetContent = document.getElementById(targetTabId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}


// ============================================================================
// Presets Loading
// ============================================================================
async function initPresets() {
  try {
    const res = await fetch('/api/presets');
    if (!res.ok) return;
    const data = await res.json();
    
    if (data.presets && data.presets.length > 0) {
      elements.presetsBar.innerHTML = '';
      data.presets.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.textContent = preset.title;
        btn.title = `Category: ${preset.category}`;
        btn.addEventListener('click', () => {
          elements.textInput.value = preset.text;
          updateTextMeta();
          triggerAnalysis(preset.text);
        });
        elements.presetsBar.appendChild(btn);
      });
    }
  } catch (err) {
    console.warn('Presets could not be loaded from API:', err);
  }
}


// ============================================================================
// Input & Real-time Live Typing
// ============================================================================
function initInputListeners() {
  elements.textInput.addEventListener('input', () => {
    updateTextMeta();
    if (elements.liveToggle.checked) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const text = elements.textInput.value.trim();
        if (text && text !== lastAnalyzedText) {
          triggerAnalysis(text);
        }
      }, 250);
    }
  });

  elements.btnAnalyze.addEventListener('click', () => {
    const text = elements.textInput.value.trim();
    if (text) {
      triggerAnalysis(text);
    }
  });

  elements.btnClear.addEventListener('click', () => {
    elements.textInput.value = '';
    updateTextMeta();
    resetDashboard();
  });
}

function updateTextMeta() {
  const text = elements.textInput.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  elements.charCount.textContent = `${chars} chars`;
  elements.wordCount.textContent = `${words} words`;
}


// ============================================================================
// API Analysis & Results Rendering
// ============================================================================
async function triggerAnalysis(text) {
  if (!text) return;
  lastAnalyzedText = text;

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    renderAnalysisResults(data);
  } catch (err) {
    console.error('Analysis failed:', err);
  }
}

function renderAnalysisResults(data) {
  // 1. Polarity verdict & Compound Score
  const compound = data.compound_score;
  const label = data.label; // Positive, Negative, Neutral
  
  elements.valCompound.textContent = (compound >= 0 ? `+${compound.toFixed(2)}` : compound.toFixed(2));
  elements.verdictLabel.textContent = label;
  elements.verdictLabel.className = `verdict-label ${label.toLowerCase()}`;

  // Emoji verdict
  if (label === 'Positive') {
    elements.verdictEmoji.textContent = compound >= 0.6 ? '🤩' : '😊';
  } else if (label === 'Negative') {
    elements.verdictEmoji.textContent = compound <= -0.6 ? '😡' : '🙁';
  } else {
    elements.verdictEmoji.textContent = '😐';
  }

  elements.valConfidence.textContent = `${data.confidence}%`;
  elements.valSubjectivity.textContent = data.subjectivity.split(' ')[0]; // E.g., 'Objective' or 'Subjective'
  elements.intensityBadge.textContent = `${data.intensity} Intensity`;

  // 2. Gauge Meter Needle & Arc
  // Compound score goes from -1.0 to +1.0
  // Rotate angle: -1.0 -> -90deg, 0.0 -> 0deg, +1.0 -> +90deg
  const needleAngle = compound * 90;
  elements.gaugeNeedle.style.transform = `rotate(${needleAngle}deg)`;

  // Gauge fill arc color & glow
  if (label === 'Positive') {
    elements.gaugeFillArc.style.stroke = 'var(--color-pos)';
    elements.gaugeFillArc.style.filter = 'drop-shadow(0 0 8px var(--color-pos-glow))';
  } else if (label === 'Negative') {
    elements.gaugeFillArc.style.stroke = 'var(--color-neg)';
    elements.gaugeFillArc.style.filter = 'drop-shadow(0 0 8px var(--color-neg-glow))';
  } else {
    elements.gaugeFillArc.style.stroke = 'var(--color-neu)';
    elements.gaugeFillArc.style.filter = 'drop-shadow(0 0 8px var(--color-neu-glow))';
  }

  // 3. Polarity Trio Breakdown
  const b = data.sentiment_breakdown;
  elements.valPosPct.textContent = `${b.positive}%`;
  elements.barPos.style.width = `${b.positive}%`;
  elements.valNeuPct.textContent = `${b.neutral}%`;
  elements.barNeu.style.width = `${b.neutral}%`;
  elements.valNegPct.textContent = `${b.negative}%`;
  elements.barNeg.style.width = `${b.negative}%`;

  // 4. Emotion Spectrum
  const emo = data.emotions;
  elements.valEmoJoy.textContent = `${emo.joy}%`;
  elements.barEmoJoy.style.width = `${emo.joy}%`;

  elements.valEmoTrust.textContent = `${emo.trust_calm}%`;
  elements.barEmoTrust.style.width = `${emo.trust_calm}%`;

  elements.valEmoSurprise.textContent = `${emo.surprise}%`;
  elements.barEmoSurprise.style.width = `${emo.surprise}%`;

  elements.valEmoSadness.textContent = `${emo.sadness}%`;
  elements.barEmoSadness.style.width = `${emo.sadness}%`;

  elements.valEmoAnger.textContent = `${emo.anger}%`;
  elements.barEmoAnger.style.width = `${emo.anger}%`;

  elements.valEmoFear.textContent = `${emo.fear}%`;
  elements.barEmoFear.style.width = `${emo.fear}%`;

  const dominantName = formatEmotionName(data.dominant_emotion);
  elements.dominantEmotionBadge.textContent = `Dominant: ${dominantName}`;

  // 5. Token Inspector Highlighting
  renderTokenSpans(data.tokens);

  // 6. Positive & Negative Driver Pills
  renderDriverPills(data.key_drivers);

  // 7. AI Explanation Summary
  elements.aiExplanationText.textContent = data.explanation;
}

function formatEmotionName(key) {
  const map = {
    joy: "Joy 🌟",
    trust_calm: "Trust / Calm 🛡️",
    surprise: "Surprise ⚡",
    sadness: "Sadness 🌧️",
    anger: "Anger 💥",
    fear: "Fear ⚠️"
  };
  return map[key] || key;
}

function renderTokenSpans(tokens) {
  elements.tokenHighlightContainer.innerHTML = '';
  if (!tokens || tokens.length === 0) {
    elements.tokenHighlightContainer.innerHTML = '<span class="placeholder-text">Enter text to see live word-by-word sentiment highlights...</span>';
    return;
  }

  tokens.forEach(t => {
    if (!t.is_word) {
      // Just plain whitespace or punctuation
      const textNode = document.createTextNode(t.text);
      elements.tokenHighlightContainer.appendChild(textNode);
    } else {
      const span = document.createElement('span');
      let sentimentClass = 'neu';
      if (t.sentiment === 'positive') sentimentClass = 'pos';
      if (t.sentiment === 'negative') sentimentClass = 'neg';
      
      span.className = `token-span ${sentimentClass}`;
      span.textContent = t.text;
      if (t.score !== 0) {
        span.title = `Valence Score: ${t.score > 0 ? '+' : ''}${t.score}`;
      }
      elements.tokenHighlightContainer.appendChild(span);
    }
  });
}

function renderDriverPills(drivers) {
  // Positive
  elements.positivePills.innerHTML = '';
  if (drivers.positive && drivers.positive.length > 0) {
    drivers.positive.forEach(word => {
      const pill = document.createElement('span');
      pill.className = 'word-pill pos';
      pill.textContent = word;
      elements.positivePills.appendChild(pill);
    });
  } else {
    elements.positivePills.innerHTML = '<span class="empty-pill">None detected</span>';
  }

  // Negative
  elements.negativePills.innerHTML = '';
  if (drivers.negative && drivers.negative.length > 0) {
    drivers.negative.forEach(word => {
      const pill = document.createElement('span');
      pill.className = 'word-pill neg';
      pill.textContent = word;
      elements.negativePills.appendChild(pill);
    });
  } else {
    elements.negativePills.innerHTML = '<span class="empty-pill">None detected</span>';
  }
}

function resetDashboard() {
  elements.gaugeNeedle.style.transform = 'rotate(0deg)';
  elements.verdictLabel.textContent = 'Neutral';
  elements.verdictLabel.className = 'verdict-label neutral';
  elements.valCompound.textContent = '+0.00';
  elements.verdictEmoji.textContent = '😐';
  elements.valConfidence.textContent = '0%';
  elements.intensityBadge.textContent = 'Mild';
  elements.tokenHighlightContainer.innerHTML = '<span class="placeholder-text">Enter text to see live word-by-word sentiment highlights...</span>';
  elements.positivePills.innerHTML = '<span class="empty-pill">None detected</span>';
  elements.negativePills.innerHTML = '<span class="empty-pill">None detected</span>';
  elements.aiExplanationText.textContent = 'AI analysis summary will appear here.';
}


// ============================================================================
// Batch & CSV Processing
// ============================================================================
function initBatchListeners() {
  // Load sample dataset
  elements.btnBatchPreset.addEventListener('click', () => {
    elements.batchTextarea.value = SAMPLE_BATCH_DATA.join('\n');
    elements.batchCountStatus.textContent = `${SAMPLE_BATCH_DATA.length} sample reviews loaded.`;
  });

  // Run Batch button
  elements.btnRunBatch.addEventListener('click', async () => {
    const rawText = elements.batchTextarea.value.trim();
    if (!rawText) {
      alert('Please enter text reviews or upload a CSV file.');
      return;
    }
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    elements.btnRunBatch.disabled = true;
    elements.btnRunBatch.textContent = 'Analyzing Batch...';

    try {
      const res = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: lines })
      });

      if (!res.ok) throw new Error('Batch request failed.');
      const data = await res.json();
      currentBatchData = data;
      renderBatchResults(data);
    } catch (err) {
      alert(`Error during batch analysis: ${err.message}`);
    } finally {
      elements.btnRunBatch.disabled = false;
      elements.btnRunBatch.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        Run Batch Analysis
      `;
    }
  });

  // Dropzone drag & drop
  const dropzone = elements.fileDropzone;
  const fileInput = elements.fileUploadInput;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });

  // Export handlers
  elements.btnExportCsv.addEventListener('click', exportBatchToCSV);
  elements.btnExportJson.addEventListener('click', exportBatchToJSON);
}

async function handleFileUpload(file) {
  const formData = new FormData();
  formData.append('file', file);

  elements.batchCountStatus.textContent = `Uploading & analyzing "${file.name}"...`;

  try {
    const res = await fetch('/api/upload-csv', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.detail || 'Upload failed');
    }

    const data = await res.json();
    currentBatchData = data;
    elements.batchCountStatus.textContent = `Successfully processed "${file.name}" (${data.total_analyzed} rows).`;
    renderBatchResults(data);
  } catch (err) {
    alert(`File upload failed: ${err.message}`);
    elements.batchCountStatus.textContent = 'Upload failed.';
  }
}

function renderBatchResults(data) {
  elements.batchResultsSection.classList.remove('hidden');

  // Stats
  elements.batchStatTotal.textContent = data.total_analyzed;
  elements.batchStatVerdict.textContent = data.overall_sentiment;
  elements.batchStatVerdict.className = `stat-number ${data.overall_sentiment === 'Positive' ? 'text-pos' : (data.overall_sentiment === 'Negative' ? 'text-neg' : 'text-neu')}`;
  elements.batchStatAvgScore.textContent = `Avg Score: ${data.average_sentiment_score >= 0 ? '+' : ''}${data.average_sentiment_score.toFixed(2)}`;

  // Distribution
  const dist = data.distribution;
  elements.distBarPos.style.width = `${dist.positive_pct}%`;
  elements.distBarNeu.style.width = `${dist.neutral_pct}%`;
  elements.distBarNeg.style.width = `${dist.negative_pct}%`;

  elements.distLblPos.textContent = `Positive: ${dist.positive_pct}% (${dist.positive})`;
  elements.distLblNeu.textContent = `Neutral: ${dist.neutral_pct}% (${dist.neutral})`;
  elements.distLblNeg.textContent = `Negative: ${dist.negative_pct}% (${dist.negative})`;

  // Table Rows
  elements.batchTableBody.innerHTML = '';
  data.items.forEach((item, index) => {
    const tr = document.createElement('tr');
    
    let badgeClass = 'pos';
    if (item.label === 'Negative') badgeClass = 'neg';
    if (item.label === 'Neutral') badgeClass = 'neu';

    const drivers = [...(item.key_drivers.positive || []), ...(item.key_drivers.negative || [])].slice(0, 3);
    const driverPills = drivers.length > 0 ? drivers.map(d => `<span class="word-pill ${item.key_drivers.positive.includes(d) ? 'pos' : 'neg'}">${d}</span>`).join(' ') : '<span class="empty-pill">-</span>';

    tr.innerHTML = `
      <td><strong>${index + 1}</strong></td>
      <td>${escapeHtml(item.text)}</td>
      <td><span class="table-badge ${badgeClass}">${item.label}</span></td>
      <td><code>${item.compound_score >= 0 ? '+' : ''}${item.compound_score.toFixed(2)}</code></td>
      <td>${formatEmotionName(item.dominant_emotion)}</td>
      <td><div class="pills-wrap">${driverPills}</div></td>
    `;
    elements.batchTableBody.appendChild(tr);
  });
}

function exportBatchToCSV() {
  if (!currentBatchData || !currentBatchData.items) return;
  
  let csv = "Index,Text,Verdict,Score,Dominant_Emotion,Positive_Words,Negative_Words\n";
  currentBatchData.items.forEach((it, idx) => {
    const cleanTxt = `"${it.text.replace(/"/g, '""')}"`;
    const posW = `"${(it.key_drivers.positive || []).join('; ')}"`;
    const negW = `"${(it.key_drivers.negative || []).join('; ')}"`;
    csv += `${idx + 1},${cleanTxt},${it.label},${it.compound_score},${it.dominant_emotion},${posW},${negW}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `sentimai_batch_analysis_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportBatchToJSON() {
  if (!currentBatchData) return;
  const jsonStr = JSON.stringify(currentBatchData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `sentimai_analysis_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// ============================================================================
// Modal & Health Checks
// ============================================================================
function initModalListeners() {
  elements.btnGuideModal.addEventListener('click', () => {
    elements.guideModal.classList.remove('hidden');
  });

  elements.modalCloseBtn.addEventListener('click', () => {
    elements.guideModal.classList.add('hidden');
  });

  elements.guideModal.addEventListener('click', (e) => {
    if (e.target === elements.guideModal) {
      elements.guideModal.classList.add('hidden');
    }
  });
}

async function checkBackendHealth() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      elements.backendStatusBadge.className = 'status-badge online';
      elements.backendStatusText.textContent = 'NLP Engine Active';
    }
  } catch (err) {
    elements.backendStatusBadge.className = 'status-badge';
    elements.backendStatusText.textContent = 'Offline';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
