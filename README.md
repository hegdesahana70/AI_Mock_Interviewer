# 🧠 AI Mock Interviewer - Frontend Platform

A modern, responsive, and intuitive AI-powered mock interview preparation platform built with clean HTML5, CSS3, and JavaScript, designed according to the UI/UX specifications.

---

## 📸 Implemented Screens (Matching Reference UI)

1. **Login Page (`login.html`)**
   - Centered card with *Welcome Back* greeting and subtitle
   - Email address input with mail icon prefix
   - Password input with lock icon prefix and eye visibility toggle
   - `#D82B6B` vibrant pink rounded Login button
   - "Forgot password?" modal reset flow
   - Top navigation bar with Brain logo and "New here? Register" link

2. **Register Page (`register.html`)**
   - Centered card with *Create Your Account*
   - Full Name, Email address, and Password inputs with icons
   - One-click registration with local session storage
   - Top navigation bar with "Already have an account? Login" link
   - Also includes the enhanced multi-field form: `registration_form.html`

3. **Home Dashboard (`dashboard.html` / `view-home`)**
   - Personal greeting: *"Hello, Student!"*
   - Subtitle: *"Sharpen your skills. Build your confidence. Ace your interviews."*
   - Vector robot illustration at laptop with chat bubbles and potted plant
   - Large pink *"▶ Start New Interview"* hero action button

4. **Start New Interview (`dashboard.html` / `view-start`)**
   - Role selector dropdown (*Software Developer*, *Frontend*, *Backend*, *Data Analyst*, *Full Stack*, *DevOps*)
   - Difficulty level selector (*Beginner*, *Intermediate*, *Advanced*)
   - *"✨ Generate Questions"* button that loads customized interview questions

5. **Interactive Interview Room (`dashboard.html` / `view-interview-session`)**
   - Header with question counter (*Question 1 of 5*) and pink progress bar
   - Question prompt card with real questions
   - Multi-line response textarea with live `0/500` character counter
   - Integrated **Voice Answer** microphone button (Web Speech API)
   - *Previous* and *Next* navigation controls (changes to *Submit Interview ✨* on question 5)

6. **Interview Completed & Scorecard (`dashboard.html` / `view-interview-completed`)**
   - Circular animated score ring (*78% Overall Score*)
   - Performance breakdown metrics:
     - Technical Knowledge: 80%
     - Communication: 75%
     - Problem Solving: 70%
     - Confidence: 85%
   - AI Feedback evaluation card
   - *"📄 View Detailed Report"* button (opens question-by-question critique modal)
   - *"🔄 Try Again"* button to restart practice

7. **My Interview History (`dashboard.html` / `view-history`)**
   - History table with past sessions: Date, Role, Difficulty, Score, Action
   - Pre-seeded with realistic interview history matching the design
   - *"View"* link to open any previous session's detailed report

8. **Your Profile (`dashboard.html` / `view-profile`)**
   - Pink avatar badge, user name, and email address
   - Change password form: Current Password, New Password, Confirm Password
   - *"🔑 Update Password"* button with validation & feedback

---

## 📂 File Structure

```
AI_Mock_Interviewer/
├── server.js               # Express 5 backend server (Port 5000, static file serving)
├── config/
│   └── db.js               # MongoDB connection with Mongoose
├── models/
│   ├── User.js             # User schema (fullName, username, email, password, gender)
│   └── Interview.js        # Interview report schema (userId, role, score, qaPairs)
├── controllers/
│   ├── authController.js   # Registration, login, profile endpoints
│   └── interviewController.js # AI question generation & answer evaluation
├── routes/
│   ├── authRoutes.js       # /api/auth routes (register, login, profile)
│   └── interviewRoutes.js  # /api/interview routes (generate, submit, history)
├── services/
│   └── geminiService.js    # Google GenAI (gemini-2.5-flash) question generation & evaluation
├── .env.example            # Environment variables template (PORT, MONGO_URI, GEMINI_API_KEY)
├── index.html              # Entry router (redirects to login)
├── login.html              # Login page with AI coach robot illustration
├── register.html           # Streamlined 3-step registration form
├── registration_form.html  # Multi-field detailed registration form
├── dashboard.html          # Full interactive platform (Dashboard, Interview, History, Profile)
├── style.css               # Main application stylesheet (#D82B6B pink & dark charcoal)
├── style1.css              # Stylesheet for registration_form.html
├── app.js                  # Frontend client engine (voice recognition, question flow, scoring)
├── package.json            # Node.js dependencies and start script
└── README.md               # Project documentation
```

---

## 🚀 How to Run

### Method 1: Full-Stack (Backend API + Database + AI)

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your credentials in `.env`:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `GEMINI_API_KEY`: Your Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)
   - `PORT`: `5000`

3. **Start the Express Server:**
   ```bash
   npm start
   ```

4. **Open in Browser:**
   Visit **`http://localhost:5000`** in your browser. The Express server serves both the frontend web app and backend API routes!

---

### Method 2: Frontend-Only Quick Preview

You can open the frontend immediately without a backend database:
- Simply double-click `login.html` or `index.html` to open in Google Chrome or Edge.
- Or use VS Code Live Server / `npx serve .`.
- The frontend features automatic fallback mode so all UI controls, mock interviews, speech-to-text, and reports work seamlessly out-of-the-box!

---

## 🎨 Color Palette & Typography
- **Background**: `#14161a` (deep dark charcoal)
- **Cards / Containers**: `#1f2228`
- **Primary Brand Color**: `#D82B6B` (Berry Pink)
- **Hover / Active State**: `#e03977` / `#be205a`
- **Font**: Inter & Poppins

