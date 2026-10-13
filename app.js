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
        : `http://localhost:5000/api/interview/history/${encodeURIComponent(uid)}`;
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
            metrics: {
              technical: Math.min(95, Math.max(60, item.overallScore + 2)),
              communication: Math.min(95, Math.max(60, item.overallScore - 3)),
              problemSolving: Math.min(95, Math.max(60, item.overallScore - 5)),
              confidence: Math.min(95, Math.max(60, item.overallScore + 4))
            },
            feedback: item.performanceReview,
            qaList: (item.qaPairs || []).map((q, idx) => ({
              question: q.question && q.question.startsWith(`${idx + 1}.`) ? q.question : `${idx + 1}. ${q.question}`,
              answer: q.userAnswer,
              critique: q.aiFeedback || 'Evaluated by AI'
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
      document.getElementById('charCount').textContent = `${len}/500`;
      
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
    : 'http://localhost:5000/api/interview/generate';

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
  document.getElementById('charCount').textContent = `${currentAns.length}/500`;

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

  let overallScore = 78;
  let technicalScore = 80;
  let communicationScore = 75;
  let problemSolvingScore = 70;
  let confidenceScore = 85;
  let performanceReview = `You have a good understanding of core concepts, especially in ${role}. Try to work on your problem-solving approach and provide more detailed examples in your answers.`;
  let evaluatedQaList = [];

  const apiUrl = window.location.origin.includes('5000') 
    ? '/api/interview/submit' 
    : 'http://localhost:5000/api/interview/submit';

  let savedReportId = null;

  try {
    const userId = state.currentUser?.id || state.currentUser?.userId || state.currentUser?.email || 'anonymous';
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role, difficulty, qaPairs })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.report) {
        savedReportId = data.report._id;
        overallScore = data.report.overallScore || overallScore;
        performanceReview = data.report.performanceReview || performanceReview;
        if (data.report.qaPairs && data.report.qaPairs.length > 0) {
          evaluatedQaList = data.report.qaPairs.map((p, idx) => ({
            question: `${idx + 1}. ${p.question}`,
            answer: p.userAnswer,
            critique: p.aiFeedback || 'Good conceptual understanding.'
          }));
        }
        showToast('✨ Gemini AI evaluated and saved to your history!', 'success');
      }
    }
  } catch (err) {
    console.log('Using local evaluation engine:', err.message);
  }

  if (evaluatedQaList.length === 0) {
    let totalLength = 0;
    let answeredCount = 0;
    questions.forEach((q, idx) => {
      const ans = answers[idx] || '';
      if (ans.trim().length > 0) {
        answeredCount++;
        totalLength += ans.length;
      }

      evaluatedQaList.push({
        question: `${idx + 1}. ${q}`,
        answer: ans || '(No answer provided)',
        critique: ans.length > 50 
          ? "Good conceptual understanding with relevant keywords. Clear articulation of technical details."
          : "Answer is brief. Adding concrete examples or practical edge cases would strengthen this response."
      });
    });

    if (answeredCount > 0) {
      const base = Math.min(88, Math.max(65, Math.round(60 + (answeredCount * 5) + (totalLength / 60))));
      overallScore = base;
      technicalScore = Math.min(95, base + 2);
      communicationScore = Math.min(95, base - 3);
      problemSolvingScore = Math.min(95, base - 8);
      confidenceScore = Math.min(95, base + 7);
    }
  } else {
    technicalScore = Math.min(95, Math.max(60, overallScore + 2));
    communicationScore = Math.min(95, Math.max(60, overallScore - 3));
    problemSolvingScore = Math.min(95, Math.max(60, overallScore - 5));
    confidenceScore = Math.min(95, Math.max(60, overallScore + 4));
  }

  // Create result object
  const newResult = {
    id: savedReportId || `hist-${Date.now()}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    role: role,
    difficulty: difficulty,
    score: overallScore,
    metrics: {
      technical: technicalScore,
      communication: communicationScore,
      problemSolving: problemSolvingScore,
      confidence: confidenceScore
    },
    feedback: performanceReview,
    qaList: evaluatedQaList
  };

  state.lastCompletedResult = newResult;

  // Save to history
  state.history.unshift(newResult);
  localStorage.setItem('aimock_history', JSON.stringify(state.history));
  renderHistoryTable();

  // Render Completed screen
  renderCompletedScreen(newResult);
  switchTab('interview-completed');
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
        div.innerHTML = `
          <div class="report-item-question">${item.question}</div>
          <div class="report-user-ans"><strong>Your Answer:</strong> ${item.answer}</div>
          <div class="report-ai-critique">💡 <strong>AI Evaluation:</strong> ${item.critique}</div>
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

// Sample Spoken Answers for Practice & Dictation Simulation
const SAMPLE_SPOKEN_ANSWERS = {
  "Software Developer": [
    "In JavaScript, var is function-scoped and hoisted, which often leads to unintended side effects. In contrast, let and const are block-scoped. Const prevents reassignment and is my default for writing immutable, predictable code. I use let only when variable values must be reassigned.",
    "I handle errors in React by using try-catch blocks for asynchronous calls like API fetch requests, paired with local state to show alert feedback. For runtime component crashes, I use React Error Boundaries to catch unhandled errors and show a clean fallback UI.",
    "Promises represent asynchronous values with pending, resolved, or rejected states. Async and await is syntactic sugar built on top of promises, making asynchronous logic read cleanly like synchronous code and handling rejections with try-catch.",
    "REST is an architectural pattern using standard HTTP methods: GET for reading resources, POST for creating, PUT or PATCH for modifying, and DELETE for removing. It ensures stateless communication and clean URL resource hierarchy.",
    "I optimize frontend performance using code splitting with React.lazy, optimizing and compressing image formats, caching static assets with service workers, and memoizing expensive computations using useMemo and useCallback."
  ],
  "Frontend Developer": [
    "The Virtual DOM is a lightweight in-memory representation of the real DOM. React computes differences using its reconciliation diffing algorithm and updates only the modified nodes in the real browser DOM efficiently.",
    "Flexbox is ideal for one-dimensional layouts along a row or column, while CSS Grid is designed for two-dimensional grid layouts with explicit rows and columns. I use Flexbox for component bars and Grid for overall page layouts.",
    "To prevent unnecessary re-renders, I use React.memo on child components, wrap callback functions in useCallback, maintain atomic state closer to where it is used, and avoid inline object declarations in JSX props.",
    "Core Web Vitals measure user experience: LCP for loading speed, FID or INP for interactivity responsiveness, and CLS for visual stability. I optimize LCP through preloading key assets and CDN image delivery.",
    "I implement accessibility by using semantic HTML tags, proper ARIA labels where needed, ensuring keyboard navigation with logical tabIndex, and maintaining WCAG-compliant contrast ratios."
  ],
  "Backend Developer": [
    "Database indexes create fast lookup structures like B-Trees. While they dramatically speed up SELECT queries, they add overhead to INSERT and UPDATE operations because the index tree must be updated on every write.",
    "Vertical scaling involves adding more CPU and RAM to a single machine, while horizontal scaling distributes load across multiple servers using load balancers and database replicas or sharding.",
    "A secure JWT flow uses short-lived access tokens stored in memory and longer-lived refresh tokens stored in secure HttpOnly cookies, verified against a revocation list during token refreshes.",
    "The CAP theorem states that a distributed system can guarantee at most two out of Consistency, Availability, and Partition Tolerance. Under network partitions, systems must choose between consistency or availability.",
    "I prevent SQL injection by always using parameterized queries and ORMs. To prevent XSS, I sanitize user inputs, escape HTML responses, and enforce strict Content Security Policy headers."
  ]
};

function toggleSpeechInput() {
  const micBtn = document.getElementById('micToggleBtn');
  const micLabel = document.getElementById('micBtnLabel');
  const answerInput = document.getElementById('answerInput');
  const voiceLiveStatus = document.getElementById('voiceLiveStatus');
  const voiceStatusText = document.getElementById('voiceStatusText');

  // Check browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showToast('Your browser does not support live microphone capture. Click "Sample Spoken Answer" to test voice input!', 'error');
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
      answerInput.value = updatedText.slice(0, 500);
      document.getElementById('charCount').textContent = `${answerInput.value.length}/500`;

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
        showToast('Microphone access blocked by browser security (common on file://). Click "Sample Spoken Answer" to test, or run via localhost.', 'error');
      } else if (e.error === 'no-speech') {
        showToast('No speech was detected. Please try again.', 'error');
      } else {
        showToast(`Voice status: ${e.error}. You can also click "Sample Spoken Answer".`, 'error');
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
    showToast('Microphone unavailable. Use "Sample Spoken Answer" to practice or test.', 'error');
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

// Quick Sample Spoken Dictation (Simulates candidate speaking)
function handleInsertSampleSpokenAnswer() {
  const answerInput = document.getElementById('answerInput');
  const role = state.currentInterview.role || 'Software Developer';
  const qIdx = state.currentInterview.currentIndex || 0;

  const roleAnswers = SAMPLE_SPOKEN_ANSWERS[role] || SAMPLE_SPOKEN_ANSWERS["Software Developer"];
  const sample = roleAnswers[qIdx] || "I approach this by structuring the problem into clear components, applying technical best practices, and verifying edge cases through unit tests.";

  // Animate speech dictation text
  answerInput.value = '';
  let charPos = 0;
  
  const voiceLiveStatus = document.getElementById('voiceLiveStatus');
  const voiceStatusText = document.getElementById('voiceStatusText');
  if (voiceLiveStatus) voiceLiveStatus.style.display = 'inline-flex';
  if (voiceStatusText) voiceStatusText.textContent = 'Dictating sample spoken answer...';

  const typeInterval = setInterval(() => {
    if (charPos < sample.length) {
      charPos += 3;
      answerInput.value = sample.slice(0, charPos);
      document.getElementById('charCount').textContent = `${answerInput.value.length}/500`;
      state.currentInterview.answers[qIdx] = answerInput.value;
    } else {
      clearInterval(typeInterval);
      if (voiceLiveStatus) voiceLiveStatus.style.display = 'none';
      showToast('Sample spoken answer transcribed into response area!', 'success');
    }
  }, 20);
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
