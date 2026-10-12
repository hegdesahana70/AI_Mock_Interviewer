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
├── index.html              # Entry router (redirects to dashboard or login)
├── login.html              # Screen 1: Login page
├── register.html           # Screen 2: Streamlined 3-step registration
├── registration_form.html  # Enhanced original multi-field registration
├── dashboard.html          # Screens 3–9: Full interactive application
├── style.css               # Main theme stylesheet (dark & #D82B6B pink palette)
├── style1.css              # Stylesheet for registration_form.html
├── app.js                  # Core JavaScript (interview engine, scoring, auth, speech)
└── README.md               # Documentation
```

---

## 🚀 How to Run

You don't need any complex build setup or database. You can run it immediately using any of these methods:

### Option 1: Direct File Open
Simply double-click `login.html` or `index.html` in your file explorer to open it in any web browser.

### Option 2: VS Code Live Server
Right-click `index.html` or `login.html` and select **"Open with Live Server"**.

### Option 3: Python or Node Server
```bash
# Python
python -m http.server 8000

# or Node (npx)
npx serve .
```
Then navigate to `http://localhost:8000`.

---

## 🎨 Color Palette & Typography
- **Background**: `#14161a` (deep dark charcoal)
- **Cards / Containers**: `#1f2228`
- **Primary Brand Color**: `#D82B6B` (Berry Pink)
- **Hover / Active State**: `#e03977` / `#be205a`
- **Font**: Inter & Poppins
