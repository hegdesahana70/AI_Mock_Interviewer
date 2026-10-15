/**
 * AI Mock Interviewer - Main Application Logic
 */

// Global App State
let state = {
  currentUser: null,
  activeTab: 'home',
  currentInterview: {
    role: 'Software Developer',
    difficulty: 'Intermediate',
    questions: [],
    currentIndex: 0,
    answers: {},
    startTime: null,
    timerInterval: null
  },
  lastCompletedResult: null,
  history: []
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  loadHistoryData();
  setupEventListeners();
  checkUrlParams();
});

function loadUserData() {
  const savedUser = localStorage.getItem('aimock_user');
  if (savedUser) {
    try {
      state.currentUser = JSON.parse(savedUser);
    } catch (e) {
      state.currentUser = null;
    }
  }

  // Redirect to login if not authenticated
  if (!state.currentUser) {
    window.location.href = 'login.html';
    return;
  }

  updateUserUI();
}

async function loadHistoryData() {
  const uid = state.currentUser?.id || state.currentUser?.userId || state.currentUser?.email;

  if (uid) {
    try {
      const apiUrl = window.location.origin.includes('5000') 
        ? `/api/interview/history/${encodeURIComponent(uid)}` 
        : `/api/interview/history/${encodeURIComponent(uid)}`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.history)) {
          state.history = data.history.map(item => ({
            id: item._id,
            date: item.createdAt 
              ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            role: item.role,
            difficulty: item.difficulty,
            score: item.overallScore,
            metrics: item.metrics || {
              technical: item.overallScore || 0,
              communication: item.overallScore || 0,
              problemSolving: item.overallScore || 0,
              confidence: item.overallScore || 0
            },
            feedback: item.performanceReview,
            qaList: (item.qaPairs || []).map((q, idx) => ({
              question: q.question && q.question.startsWith(`${idx + 1}.`) ? q.question : `${idx + 1}. ${q.question}`,
              answer: q.userAnswer,
              critique: q.aiFeedback || 'Evaluated by AI',
              idealAnswer: q.idealAnswer || '',
              score: q.score != null ? q.score : null
            }))
          }));
          localStorage.setItem('aimock_history', JSON.stringify(state.history));
          renderHistoryTable();
          return;
        }
      }
    } catch (err) {
      console.warn('Could not fetch remote history, using local cache:', err.message);
    }
  }

  // Fallback to local storage if API is offline
  const savedHistory = localStorage.getItem('aimock_history');
  if (savedHistory) {
    try {
      state.history = JSON.parse(savedHistory);
    } catch (e) {
      state.history = [];
    }
  } else {
    state.history = [];
  }

  renderHistoryTable();
}

function updateUserUI() {
  const name = state.currentUser?.name || state.currentUser?.fullName || 'User';
  const email = state.currentUser?.email || '';

  const userGreetingEl = document.getElementById('userGreetingName');
  if (userGreetingEl) userGreetingEl.textContent = name;

  const headerUserNameEl = document.getElementById('headerUserName');
  if (headerUserNameEl) headerUserNameEl.textContent = `Hello, ${name}!`;

  const profileNameEl = document.getElementById('profileNameDisplay');
  if (profileNameEl) profileNameEl.textContent = name;

  const profileEmailEl = document.getElementById('profileEmailDisplay');
  if (profileEmailEl) profileEmailEl.textContent = email;
}

function setupEventListeners() {
  // Navigation tabs
  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // User Dropdown toggle
  const userBadge = document.getElementById('userBadgeBtn');
  const userDropdown = document.getElementById('userDropdownMenu');
  if (userBadge && userDropdown) {
    userBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      userDropdown.classList.remove('show');
    });
  }

  // Answer text counting
  const answerTextarea = document.getElementById('answerInput');
  if (answerTextarea) {
    answerTextarea.addEventListener('input', (e) => {
      const len = e.target.value.length;
      document.getElementById('charCount').textContent = `${len}/2000`;
      
      const qIndex = state.currentInterview.currentIndex;
      state.currentInterview.answers[qIndex] = e.target.value;
    });
  }
}

function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (tab && ['home', 'start', 'history', 'profile'].includes(tab)) {
    switchTab(tab);
  }
}

// Tab Switching
function switchTab(tabName) {
  state.activeTab = tabName;

  // Update sidebar active class
  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Hide all sections
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active');
  });

  // Show target section
  const targetSection = document.getElementById(`view-${tabName}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Scroll to top
  const mainContent = document.querySelector('.main-content');
  if (mainContent) mainContent.scrollTop = 0;

  // Refresh history dynamically whenever History tab is opened
  if (tabName === 'history') {
    loadHistoryData();
  }
}

// Start Interview Flow
async function handleStartInterviewSetup() {
  const roleSelect = document.getElementById('roleSelect');
  const difficultySelect = document.getElementById('difficultySelect');

  const role = roleSelect ? roleSelect.value : 'Software Developer';
  const difficulty = difficultySelect ? difficultySelect.value : 'Intermediate';

  const generateBtn = document.getElementById('btnGenerateQuestions') || document.querySelector('.btn-generate') || document.getElementById('btnStartInterview');
  const generateText = document.getElementById('btnGenerateText') || generateBtn?.querySelector('span');

  if (generateBtn) {
    if (generateText) generateText.textContent = '✨ Generating with Gemini AI...';
    generateBtn.disabled = true;
    generateBtn.style.opacity = '0.7';
  }

  let questions = [];

  const apiUrl = window.location.origin.includes('5000') 
    ? '/api/interview/generate' 
    : '/api/interview/generate';

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, difficulty })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        questions = data.questions;
        showToast('✨ Gemini AI dynamically generated your questions!', 'success');
      }
    }
  } catch (err) {
    console.warn('Backend interview generation error:', err.message);
  } finally {
    if (generateBtn) {
      if (generateText) generateText.textContent = 'Generate Questions';
      generateBtn.disabled = false;
      generateBtn.style.opacity = '1';
    }
  }

  if (questions.length === 0) {
    showToast('Failed to generate AI questions. Please verify your server is running.', 'error');
    return;
  }

  state.currentInterview = {
    role: role,
    difficulty: difficulty,
    questions: questions,
    currentIndex: 0,
    answers: {},
    startTime: Date.now()
  };

  // Switch to interview session view
  showInterviewQuestion(0);
  switchTab('interview-session');
}

function showInterviewQuestion(index) {
  state.currentInterview.currentIndex = index;
  const total = state.currentInterview.questions.length;
  const currentNum = index + 1;
  const progressPercent = Math.round((currentNum / total) * 100);

  // Update progress bar & label
  document.getElementById('questionCounterLabel').textContent = `Question ${currentNum} of ${total}`;
  document.getElementById('interviewProgressBar').style.width = `${progressPercent}%`;

  // Question Prompt
  const qText = state.currentInterview.questions[index];
  document.getElementById('questionPromptText').textContent = `${currentNum}. ${qText}`;

  // Answer Textarea
  const currentAns = state.currentInterview.answers[index] || '';
  const answerInput = document.getElementById('answerInput');
  answerInput.value = currentAns;
  document.getElementById('charCount').textContent = `${currentAns.length}/2000`;

  // Prev / Next button state
  const prevBtn = document.getElementById('btnPrevQuestion');
  prevBtn.disabled = index === 0;
  prevBtn.style.opacity = index === 0 ? '0.4' : '1';
  prevBtn.style.cursor = index === 0 ? 'not-allowed' : 'pointer';

  const nextBtn = document.getElementById('btnNextQuestion');
  if (index === total - 1) {
    nextBtn.textContent = 'Submit Interview ✨';
    nextBtn.classList.add('btn-submit');
  } else {
    nextBtn.textContent = 'Next';
    nextBtn.classList.remove('btn-submit');
  }
}

function handlePrevQuestion() {
  if (state.currentInterview.currentIndex > 0) {
    showInterviewQuestion(state.currentInterview.currentIndex - 1);
  }
}

function handleNextQuestion() {
  const currentIdx = state.currentInterview.currentIndex;
  const total = state.currentInterview.questions.length;

  if (currentIdx < total - 1) {
    showInterviewQuestion(currentIdx + 1);
  } else {
    // Final submit
    submitInterview();
  }
}

// Submit Interview and Calculate AI Results
async function submitInterview() {
  const { role, difficulty, questions, answers } = state.currentInterview;
  
  // Show evaluating toast
  showToast('✨ Gemini AI is analyzing and scoring your responses...', 'success');

  const qaPairs = questions.map((q, idx) => ({
    question: q,
    userAnswer: answers[idx] || '(No answer provided)'
  }));

  const apiUrl = window.location.origin.includes('5000') 
    ? '/api/interview/submit' 
    : '/api/interview/submit';

  try {
    const userId = state.currentUser?.id || state.currentUser?.userId || state.currentUser?.email || 'anonymous';
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role, difficulty, qaPairs })
    });
    
    const data = await res.json();
    if (res.ok && data.success && data.report) {
      const rep = data.report;
      const evaluatedQaList = (rep.qaPairs || []).map((p, idx) => ({
        question: p.question && p.question.startsWith(`${idx + 1}.`) ? p.question : `${idx + 1}. ${p.question}`,
        answer: p.userAnswer,
        critique: p.aiFeedback || 'Evaluated by Gemini AI',
        idealAnswer: p.idealAnswer || '',
        score: p.score != null ? p.score : null
      }));

      const newResult = {
        id: rep._id || `hist-${Date.now()}`,
        date: rep.createdAt 
          ? new Date(rep.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        role: rep.role || role,
        difficulty: rep.difficulty || difficulty,
        score: rep.overallScore,
        metrics: rep.metrics || {
          technical: rep.overallScore,
          communication: rep.overallScore,
          problemSolving: rep.overallScore,
          confidence: rep.overallScore
        },
        feedback: rep.performanceReview || 'Evaluation complete.',
        qaList: evaluatedQaList
      };

      state.lastCompletedResult = newResult;
      state.history.unshift(newResult);
      localStorage.setItem('aimock_history', JSON.stringify(state.history));
      renderHistoryTable();

      showToast('✨ Gemini AI evaluated and saved to your history!', 'success');
      renderCompletedScreen(newResult);
      switchTab('interview-completed');
      return;
    } else {
      showToast(data.error || 'Gemini AI evaluation failed. Please try again.', 'error');
    }
  } catch (err) {
    console.error('Interview evaluation error:', err);
    showToast('Failed to connect to AI evaluation server.', 'error');
  }
}

function renderCompletedScreen(result) {
  // Score gauge
  document.getElementById('gaugeScoreText').textContent = `${result.score}%`;
  
  // Circumference = 2 * PI * 54 = 339.292
  const circ = 339.292;
  const offset = circ - (result.score / 100) * circ;
  const circle = document.getElementById('gaugeProgressCircle');
  if (circle) {
    circle.style.strokeDashoffset = offset;
  }

  // Metrics
  document.getElementById('metricTechVal').textContent = `${result.metrics.technical}%`;
  document.getElementById('metricTechBar').style.width = `${result.metrics.technical}%`;

  document.getElementById('metricCommVal').textContent = `${result.metrics.communication}%`;
  document.getElementById('metricCommBar').style.width = `${result.metrics.communication}%`;

  document.getElementById('metricProbVal').textContent = `${result.metrics.problemSolving}%`;
  document.getElementById('metricProbBar').style.width = `${result.metrics.problemSolving}%`;

  document.getElementById('metricConfVal').textContent = `${result.metrics.confidence}%`;
  document.getElementById('metricConfBar').style.width = `${result.metrics.confidence}%`;

  // Feedback text
  document.getElementById('aiFeedbackSummaryText').textContent = result.feedback;
}

// Render History Table
function renderHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (state.history.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="5" style="text-align: center; padding: 32px; color: #9da3af;">
        No interview sessions yet. Click "Start New Interview" to begin your first AI mock session!
      </td>
    `;
    tbody.appendChild(tr);
    return;
  }

  state.history.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="history-date">${item.date}</td>
      <td style="font-weight: 500;">${item.role}</td>
      <td><span style="color: #9da3af;">${item.difficulty}</span></td>
      <td><span class="score-badge" style="color: ${item.score >= 75 ? '#34d399' : '#f59e0b'};">${item.score}%</span></td>
      <td><button class="action-link" onclick="openDetailedReportById('${item.id}')">View</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Detailed Report Modal
function openDetailedReport() {
  const result = state.lastCompletedResult || state.history[0];
  if (!result) return;
  displayReportModal(result);
}

function openDetailedReportById(id) {
  const result = state.history.find(h => h.id === id);
  if (!result) return;
  displayReportModal(result);
}

function displayReportModal(result) {
  const container = document.getElementById('reportItemsContainer');
  document.getElementById('reportModalSubtitle').textContent = `${result.role} (${result.difficulty}) • Score: ${result.score}% • ${result.date}`;
  
  if (container) {
    container.innerHTML = '';
    if (result.qaList && result.qaList.length > 0) {
      result.qaList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'report-item';

        const scoreBadge = item.score != null 
          ? `<span class="report-item-score-badge">Score: ${item.score}/100</span>` 
          : '';

        const idealSection = item.idealAnswer ? `
          <div class="report-ideal-ans">
            <div class="report-ideal-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a5 5 0 0 0-5 5v1a4 4 0 0 0-3 3.87A4 4 0 0 0 7 16h1v2a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3v-2h1a4 4 0 0 0 3-4.13A4 4 0 0 0 17 8V7a5 5 0 0 0-5-5z"/>
              </svg>
              <span>Ideal / Model Answer (Expected by Interviewer)</span>
            </div>
            <div class="report-ideal-text">${item.idealAnswer}</div>
          </div>
        ` : '';

        div.innerHTML = `
          <div class="report-item-header">
            <div class="report-item-question">${item.question}</div>
            ${scoreBadge}
          </div>
          <div class="report-user-ans"><strong>Your Answer:</strong> ${item.answer || '(No answer provided)'}</div>
          <div class="report-ai-critique">💡 <strong>AI Evaluation:</strong> ${item.critique}</div>
          ${idealSection}
        `;
        container.appendChild(div);
      });
    } else {
      container.innerHTML = `
        <div class="report-item">
          <p style="color: var(--text-muted);">Session questions archived. Overall Score: <strong>${result.score}%</strong>.</p>
          <p style="margin-top: 8px;"><strong>Feedback:</strong> ${result.feedback}</p>
        </div>
      `;
    }
  }

  document.getElementById('detailedReportModal').classList.add('show');
}

function closeDetailedReportModal() {
  document.getElementById('detailedReportModal').classList.remove('show');
}

// ============================================================
// SPEECH RECOGNITION & VOICE DICTATION
// ============================================================
let speechRecognizer = null;
let isRecording = false;
let preSpeechBaseText = '';

function toggleSpeechInput() {
  const micBtn = document.getElementById('micToggleBtn');
  const micLabel = document.getElementById('micBtnLabel');
  const answerInput = document.getElementById('answerInput');
  const voiceLiveStatus = document.getElementById('voiceLiveStatus');
  const voiceStatusText = document.getElementById('voiceStatusText');

  // Check browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showToast('Your browser does not support live speech recognition. Please type your answer or use Chrome/Edge.', 'error');
    return;
  }

  if (isRecording) {
    stopRecording();
    return;
  }

  try {
    speechRecognizer = new SpeechRecognition();
    speechRecognizer.continuous = true;
    speechRecognizer.interimResults = true;
    speechRecognizer.lang = 'en-US';

    preSpeechBaseText = answerInput.value.trim();

    speechRecognizer.onstart = () => {
      isRecording = true;
      if (micBtn) micBtn.classList.add('recording');
      if (micLabel) micLabel.textContent = 'Stop Recording';
      if (voiceLiveStatus) voiceLiveStatus.style.display = 'inline-flex';
      if (voiceStatusText) voiceStatusText.textContent = 'Listening... Speak your answer now';
      showToast('Microphone active! Speak clearly into your mic.', 'success');
    };

    speechRecognizer.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeSpeech = (finalTranscript + interimTranscript).trim();
      const updatedText = preSpeechBaseText 
        ? `${preSpeechBaseText} ${activeSpeech}`
        : activeSpeech;

      // Update textarea in real time!
      answerInput.value = updatedText.slice(0, 2000);
      document.getElementById('charCount').textContent = `${answerInput.value.length}/2000`;

      // Save to state
      const qIndex = state.currentInterview.currentIndex;
      state.currentInterview.answers[qIndex] = answerInput.value;

      if (voiceStatusText && (finalTranscript || interimTranscript)) {
        voiceStatusText.textContent = interimTranscript 
          ? `Transcribing: "${interimTranscript.slice(-25)}..."` 
          : 'Listening...';
      }
    };

    speechRecognizer.onerror = (e) => {
      console.warn('Speech recognition status:', e.error);
      stopRecording();

      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        showToast('Microphone access blocked. Please grant microphone permissions in your browser.', 'error');
      } else if (e.error === 'no-speech') {
        showToast('No speech was detected. Please try again.', 'error');
      } else {
        showToast(`Voice status: ${e.error}.`, 'error');
      }
    };

    speechRecognizer.onend = () => {
      if (isRecording) {
        try {
          speechRecognizer.start();
        } catch (err) {
          stopRecording();
        }
      } else {
        stopRecording();
      }
    };

    speechRecognizer.start();
  } catch (err) {
    console.error('Speech recognition exception:', err);
    stopRecording();
    showToast('Microphone unavailable on this browser/environment.', 'error');
  }
}

function stopRecording() {
  isRecording = false;
  const micBtn = document.getElementById('micToggleBtn');
  const micLabel = document.getElementById('micBtnLabel');
  const voiceLiveStatus = document.getElementById('voiceLiveStatus');

  if (micBtn) micBtn.classList.remove('recording');
  if (micLabel) micLabel.textContent = 'Voice Answer';
  if (voiceLiveStatus) voiceLiveStatus.style.display = 'none';

  if (speechRecognizer) {
    try {
      speechRecognizer.stop();
    } catch (e) {}
    speechRecognizer = null;
  }
}

// Start New Interview from Completed Screen
function handleStartNewInterviewFromCompleted() {
  // Reset interview state
  state.currentInterview = {
    role: 'Software Developer',
    difficulty: 'Intermediate',
    questions: [],
    currentIndex: 0,
    answers: {},
    startTime: null
  };

  stopRecording();
  switchTab('start');
  showToast('Ready for a new interview! Choose your target role and difficulty.', 'success');
}

// Retake Current Interview
function handleRetakeCurrentInterview() {
  const role = state.currentInterview.role || 'Software Developer';
  const difficulty = state.currentInterview.difficulty || 'Intermediate';

  state.currentInterview.currentIndex = 0;
  state.currentInterview.answers = {};
  state.currentInterview.startTime = Date.now();

  stopRecording();
  showInterviewQuestion(0);
  switchTab('interview-session');
  showToast(`Restarted ${role} (${difficulty}) interview!`, 'success');
}

// Profile: Update Password
function handleUpdatePassword(e) {
  e.preventDefault();
  const currentPass = document.getElementById('currentPassword').value;
  const newPass = document.getElementById('newPassword').value;
  const confirmPass = document.getElementById('confirmNewPassword').value;

  if (!currentPass || !newPass || !confirmPass) {
    showToast('Please fill in all password fields', 'error');
    return;
  }

  if (newPass !== confirmPass) {
    showToast('New passwords do not match', 'error');
    return;
  }

  if (newPass.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }

  // Clear inputs
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmNewPassword').value = '';

  showToast('Password updated successfully!', 'success');
}

// Logout
function handleLogout() {
  localStorage.removeItem('aimock_user');
  showToast('Logging out...', 'success');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 500);
}

// Toast Utility
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' 
        ? '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />' 
        : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
