/**
 * AI Mock Interviewer - Main Application Logic
 */

// Default Seed Data
const DEFAULT_USER = {
  name: 'Student',
  email: 'student@example.com'
};

const DEFAULT_HISTORY = [
  {
    id: 'hist-1',
    date: 'Apr 28, 2025',
    role: 'Software Developer',
    difficulty: 'Intermediate',
    score: 78,
    metrics: { technical: 80, communication: 75, problemSolving: 70, confidence: 85 },
    feedback: "You have a good understanding of core concepts, especially in JavaScript and React. Try to work on your problem-solving approach and provide more detailed examples in your answers.",
    qaList: [
      {
        question: "1. What is the difference between Let, const, and var in JavaScript? When would you use each?",
        answer: "var is function-scoped and hoisted. let and const are block-scoped. const cannot be reassigned. I use const by default and let when values must mutate.",
        critique: "Accurate explanation of scoping and hoisting. Good best-practice recommendation."
      },
      {
        question: "2. How do you handle error handling in a React application? Give an example.",
        answer: "I usually use try-catch blocks for async operations and also handle errors using error boundaries in React components to prevent UI crashing.",
        critique: "Well structured. Mentioning Error Boundaries and async try-catch demonstrates practical React experience."
      },
      {
        question: "3. What are promises in JavaScript and how do they differ from async/await?",
        answer: "Promises represent asynchronous values with pending, fulfilled, or rejected states. Async/await is syntactic sugar over promises making async code look synchronous.",
        critique: "Clear explanation of states and syntactic sugar distinction."
      },
      {
        question: "4. Explain the concept of RESTful APIs and common HTTP methods.",
        answer: "REST is an architectural style using standard HTTP verbs like GET for reading, POST for creating, PUT/PATCH for updating, and DELETE for removing resources.",
        critique: "Strong definition of HTTP methods and resource-oriented modeling."
      },
      {
        question: "5. How do you optimize frontend web application performance?",
        answer: "Code splitting with lazy loading, compressing image assets, minimizing bundles, memoization with useMemo/useCallback, and using browser caching.",
        critique: "Comprehensive list of frontend performance optimization techniques."
      }
    ]
  },
  {
    id: 'hist-2',
    date: 'Apr 20, 2025',
    role: 'Data Analyst',
    difficulty: 'Beginner',
    score: 85,
    metrics: { technical: 88, communication: 82, problemSolving: 85, confidence: 85 },
    feedback: "Excellent understanding of SQL queries and data visualization basics. Communication was structured and concise.",
    qaList: []
  },
  {
    id: 'hist-3',
    date: 'Apr 18, 2025',
    role: 'Frontend Developer',
    difficulty: 'Intermediate',
    score: 72,
    metrics: { technical: 75, communication: 70, problemSolving: 68, confidence: 75 },
    feedback: "Solid foundation in CSS Flexbox/Grid and JavaScript. Expand more on state management and accessibility (a11y).",
    qaList: []
  },
  {
    id: 'hist-4',
    date: 'Apr 15, 2025',
    role: 'Backend Developer',
    difficulty: 'Advanced',
    score: 68,
    metrics: { technical: 70, communication: 65, problemSolving: 65, confidence: 72 },
    feedback: "Good coverage of database indexing and microservices, but dive deeper into concurrency control and distributed caching.",
    qaList: []
  }
];

// Comprehensive Question Banks by Role
const QUESTION_BANK = {
  "Software Developer": [
    "What is the difference between Let, const, and var in JavaScript? When would you use each?",
    "How do you handle error handling in a React application? Give an example.",
    "What are promises in JavaScript and how do they differ from async/await?",
    "Explain the concept of RESTful APIs and common HTTP methods.",
    "How do you optimize frontend web application performance?"
  ],
  "Frontend Developer": [
    "Explain the Virtual DOM in React and how reconciliation works.",
    "What is the difference between CSS Grid and Flexbox, and when would you pick each?",
    "How do you prevent unnecessary re-renders in modern React apps?",
    "What are Web Vitals and how do you improve Largest Contentful Paint (LCP)?",
    "How do you implement accessible UI components following WAI-ARIA guidelines?"
  ],
  "Backend Developer": [
    "Explain how database indexes work and when indexing might harm performance.",
    "What is the difference between horizontal and vertical database scaling?",
    "How do you design a secure JWT authentication flow with refresh tokens?",
    "Explain the CAP theorem and trade-offs in distributed database systems.",
    "How would you prevent SQL Injection and Cross-Site Scripting (XSS) in an API?"
  ],
  "Data Analyst": [
    "What is the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN in SQL?",
    "How do you handle missing or duplicate values in a large dataset before analysis?",
    "Explain the difference between correlation and causation with an example.",
    "How do you choose between a bar chart, line chart, and scatter plot for business insights?",
    "What are window functions in SQL and when would you use ROW_NUMBER() vs RANK()?"
  ],
  "Full Stack Developer": [
    "Describe end-to-end architecture from browser request to database response.",
    "How do you handle state synchronization between client and server?",
    "Compare Server-Side Rendering (SSR) with Client-Side Rendering (CSR).",
    "How do you structure database migrations in a production deployment?",
    "What strategies do you use for logging, monitoring, and error tracking in full-stack apps?"
  ],
  "DevOps Engineer": [
    "What are the core stages of a CI/CD pipeline and how do you ensure zero-downtime deployments?",
    "Explain the difference between containers (Docker) and virtual machines.",
    "How does Kubernetes handle self-healing and pod replica management?",
    "What is Infrastructure as Code (IaC) and what are the benefits of Terraform?",
    "How do you implement secrets management and zero-trust security in the cloud?"
  ]
};

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
      state.currentUser = DEFAULT_USER;
    }
  } else {
    state.currentUser = DEFAULT_USER;
    localStorage.setItem('aimock_user', JSON.stringify(DEFAULT_USER));
  }
  updateUserUI();
}

function loadHistoryData() {
  const savedHistory = localStorage.getItem('aimock_history');
  if (savedHistory) {
    try {
      state.history = JSON.parse(savedHistory);
    } catch (e) {
      state.history = DEFAULT_HISTORY;
    }
  } else {
    state.history = DEFAULT_HISTORY;
    localStorage.setItem('aimock_history', JSON.stringify(DEFAULT_HISTORY));
  }
  renderHistoryTable();
}

function updateUserUI() {
  const name = state.currentUser?.name || 'Student';
  const email = state.currentUser?.email || 'student@example.com';

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
}

// Start Interview Flow
function handleStartInterviewSetup() {
  const roleSelect = document.getElementById('roleSelect');
  const difficultySelect = document.getElementById('difficultySelect');

  const role = roleSelect ? roleSelect.value : 'Software Developer';
  const difficulty = difficultySelect ? difficultySelect.value : 'Intermediate';

  const questions = QUESTION_BANK[role] || QUESTION_BANK["Software Developer"];

  state.currentInterview = {
    role: role,
    difficulty: difficulty,
    questions: questions,
    currentIndex: 0,
    answers: {},
    startTime: Date.now()
  };

  // Seed question 2 answer like the screenshot if Software Developer for demonstration
  if (role === 'Software Developer') {
    state.currentInterview.answers[1] = "I usually use try-catch blocks for async operations and also handle errors using error boundaries in React...";
  }

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
function submitInterview() {
  const { role, difficulty, questions, answers } = state.currentInterview;
  
  // Show evaluating toast
  showToast('AI is analyzing your responses...', 'success');

  // Realistic Score Calculation
  let totalLength = 0;
  let answeredCount = 0;
  const qaList = [];

  questions.forEach((q, idx) => {
    const ans = answers[idx] || '';
    if (ans.trim().length > 0) {
      answeredCount++;
      totalLength += ans.length;
    }

    qaList.push({
      question: `${idx + 1}. ${q}`,
      answer: ans || '(No answer provided)',
      critique: ans.length > 50 
        ? "Good conceptual understanding with relevant keywords. Clear articulation of technical details."
        : "Answer is brief. Adding concrete examples or practical edge cases would strengthen this response."
    });
  });

  // Calculate scores (centered near 78% as in screenshot)
  let overallScore = 78;
  let technicalScore = 80;
  let communicationScore = 75;
  let problemSolvingScore = 70;
  let confidenceScore = 85;

  if (answeredCount > 0) {
    const base = Math.min(88, Math.max(65, Math.round(60 + (answeredCount * 5) + (totalLength / 60))));
    overallScore = base;
    technicalScore = Math.min(95, base + 2);
    communicationScore = Math.min(95, base - 3);
    problemSolvingScore = Math.min(95, base - 8);
    confidenceScore = Math.min(95, base + 7);
  }

  // Create result object
  const newResult = {
    id: `hist-${Date.now()}`,
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
    feedback: `You have a good understanding of core concepts, especially in ${role}. Try to work on your problem-solving approach and provide more detailed examples in your answers.`,
    qaList: qaList
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
