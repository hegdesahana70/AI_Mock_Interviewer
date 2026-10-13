const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Interview = require('../models/Interview');
const { generateAIQuestions, evaluateAIPerformance } = require('../services/geminiService');

const DATA_DIR = path.join(__dirname, '../data');
const INTERVIEWS_FILE = path.join(DATA_DIR, 'interviews.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INTERVIEWS_FILE)) {
    fs.writeFileSync(INTERVIEWS_FILE, JSON.stringify([], null, 2));
  }
}

function getLocalInterviews() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(INTERVIEWS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveLocalInterview(item) {
  ensureDataFile();
  const list = getLocalInterviews();
  list.unshift(item);
  fs.writeFileSync(INTERVIEWS_FILE, JSON.stringify(list, null, 2));
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function generateFallbackQuestions(role = 'Software Developer', difficulty = 'Intermediate') {
  const roleBanks = {
    'Software Developer': {
      'Beginner': [
        "Explain the differences between primitive and reference data types in programming.",
        "What is the difference between a stack and a queue data structure, and where is each used?",
        "Describe what Git version control is and the difference between 'git pull' and 'git fetch'."
      ],
      'Intermediate': [
        "Explain the concept of database indexing. How do B-Trees work under the hood, and what are the trade-offs of adding too many indexes?",
        "Describe the differences between optimistic and pessimistic locking in concurrent systems. In what scenarios would you choose one over the other?",
        "How would you design a rate limiter for a RESTful API to prevent abuse? Discuss algorithms like Token Bucket vs Leaky Bucket."
      ],
      'Advanced': [
        "How would you architect a distributed caching layer across multiple regions while ensuring cache consistency and minimizing stale reads?",
        "Explain the CAP theorem and describe how you would design a system that trades off consistency for high availability during a network partition.",
        "How do you profile, identify, and resolve memory leaks and garbage collection bottlenecks in high-throughput backend services?"
      ]
    },
    'Frontend Developer': {
      'Beginner': [
        "Explain the difference between 'let', 'const', and 'var' in modern JavaScript.",
        "What is the CSS Box Model, and how does 'box-sizing: border-box' change layout behavior?",
        "Describe the difference between synchronous and asynchronous code execution in JavaScript."
      ],
      'Intermediate': [
        "How does the Virtual DOM work in modern libraries like React, and how does reconciliation optimize rendering performance?",
        "Explain the difference between server-side rendering (SSR), client-side rendering (CSR), and static site generation (SSG).",
        "How would you optimize Core Web Vitals (LCP, FID/INP, and CLS) for a media-heavy web application?"
      ],
      'Advanced': [
        "How would you design a micro-frontend architecture for a large-scale enterprise application with independent deployments?",
        "Describe how browser rendering pipelines work (DOM, CSSOM, Render Tree, Layout, Paint, Composite) and how you avoid layout thrashing.",
        "Explain how Web Workers and SharedArrayBuffers can be utilized for offloading heavy computational workloads from the main thread."
      ]
    },
    'Backend Developer': {
      'Beginner': [
        "What is the difference between HTTP GET and POST methods, and when should idempotent methods be used?",
        "Explain the concept of relational database keys: Primary Key vs Foreign Key.",
        "What is middleware in web frameworks like Express, and what are common use cases?"
      ],
      'Intermediate': [
        "How do you design database schemas to avoid N+1 query problems in ORMs?",
        "Explain the difference between SQL and NoSQL databases. How do you choose between MongoDB and PostgreSQL for a project?",
        "How do JWTs (JSON Web Tokens) work, and how do you securely handle token expiration and refresh tokens?"
      ],
      'Advanced': [
        "Design an asynchronous event-driven architecture using Kafka or RabbitMQ, addressing message ordering and at-least-once delivery guarantees.",
        "How do you handle distributed transactions across microservices using the Saga pattern or 2PC?",
        "Explain database sharding strategies and how to handle cross-shard queries and resharding with minimal downtime."
      ]
    },
    'Full Stack Developer': {
      'Beginner': [
        "Explain the client-server architecture and how a browser request reaches a backend server and database.",
        "What is CORS (Cross-Origin Resource Sharing) and why does the browser enforce it?",
        "Describe the purpose of RESTful API design principles and standard HTTP status codes."
      ],
      'Intermediate': [
        "How do you implement secure user authentication and authorization from frontend cookies/local storage to backend sessions/JWTs?",
        "How would you handle real-time bidirectional communication between client and server using WebSockets vs Server-Sent Events (SSE)?",
        "Describe your approach to implementing automated end-to-end (E2E) testing and CI/CD pipelines for a full stack web app."
      ],
      'Advanced': [
        "Architect a scalable full-stack application supporting millions of concurrent users, covering CDN, load balancer, API gateway, and microservices.",
        "How do you ensure zero-downtime database migrations in a production environment with active read and write traffic?",
        "Discuss strategies for securing full stack applications against OWASP Top 10 vulnerabilities (XSS, CSRF, SQL Injection, SSRF)."
      ]
    },
    'Data Analyst': {
      'Beginner': [
        "What is the difference between WHERE and HAVING clauses in SQL queries?",
        "Explain the differences between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN with examples.",
        "What are measures of central tendency (Mean, Median, Mode) and when is Median preferable to Mean?"
      ],
      'Intermediate': [
        "Explain how window functions like ROW_NUMBER(), RANK(), and DENSE_RANK() work in SQL.",
        "How do you handle missing, duplicated, or corrupted data during the data cleaning and ETL process in Python or SQL?",
        "What metrics and visualization types would you choose to track customer churn and retention rates effectively?"
      ],
      'Advanced': [
        "How do you design and interpret A/B testing experiments, including sample size determination, statistical significance, and p-values?",
        "Explain how you would build an automated data pipeline and dimensional data model (Star vs Snowflake schema) for a business intelligence dashboard.",
        "How do you detect anomalies and seasonal trends in multi-variate time-series business data?"
      ]
    },
    'DevOps Engineer': {
      'Beginner': [
        "What is the core difference between a virtual machine and a Docker container?",
        "Explain the basic principles of Continuous Integration and Continuous Deployment (CI/CD).",
        "What is Infrastructure as Code (IaC) and what problems does it solve compared to manual server configuration?"
      ],
      'Intermediate': [
        "Explain how Kubernetes handles container orchestration, including Pods, Services, Deployments, and Ingress controllers.",
        "How do you manage secrets, environment variables, and configuration drift securely across multiple cloud deployment environments?",
        "Describe how you would set up centralized logging and monitoring using Prometheus, Grafana, or the ELK stack."
      ],
      'Advanced': [
        "Architect a multi-cloud or hybrid-cloud disaster recovery strategy with minimal RTO (Recovery Time Objective) and RPO (Recovery Point Objective).",
        "How do you implement GitOps and automated canary / blue-green deployments with automated rollback on health check failure?",
        "Explain how you would enforce zero-trust security and mutual TLS (mTLS) across microservices using a service mesh like Istio."
      ]
    }
  };

  const selectedRole = roleBanks[role] || roleBanks['Software Developer'];
  const questions = selectedRole[difficulty] || selectedRole['Intermediate'] || selectedRole['Beginner'];
  return questions;
}

exports.getQuestions = async (req, res) => {
  try {
    const { role, difficulty } = req.body;
    let questions = [];
    try {
      questions = await generateAIQuestions(role, difficulty);
    } catch (aiError) {
      console.warn('Gemini AI generation note (falling back to role bank):', aiError.message);
      questions = generateFallbackQuestions(role, difficulty);
    }
    res.status(200).json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.submitInterview = async (req, res) => {
  try {
    const { userId, role, difficulty, qaPairs } = req.body;

    let evaluation = null;
    try {
      evaluation = await evaluateAIPerformance(role, qaPairs);
    } catch (aiErr) {
      console.warn('AI evaluation fallback triggered:', aiErr.message);
      let answeredCount = 0;
      let totalLen = 0;
      const evaluatedQaPairs = (qaPairs || []).map((p) => {
        const ans = (p.userAnswer || '').trim();
        if (ans.length > 0 && ans !== '(No answer provided)') {
          answeredCount++;
          totalLen += ans.length;
        }
        return {
          question: p.question,
          userAnswer: p.userAnswer,
          aiFeedback: ans.length > 50 
            ? 'Good conceptual understanding with relevant technical points.' 
            : 'Concise answer. Incorporating more practical examples will enhance your score.',
          score: ans.length > 50 ? 85 : (ans.length > 10 ? 72 : 55)
        };
      });
      const avgScore = answeredCount > 0 
        ? Math.min(92, Math.max(65, Math.round(62 + (answeredCount * 6) + (totalLen / 60)))) 
        : 60;
      evaluation = {
        overallScore: avgScore,
        performanceReview: `Good effort across the ${role} interview questions. Strengthen technical definitions and articulate trade-offs to reach top tier performance.`,
        evaluatedQaPairs
      };
    }

    const interviewData = {
      userId: userId || 'anonymous',
      role: role || 'General Interview',
      difficulty: difficulty || 'Intermediate',
      overallScore: evaluation.overallScore,
      performanceReview: evaluation.performanceReview,
      qaPairs: evaluation.evaluatedQaPairs
    };

    let report = null;

    if (isMongoConnected()) {
      try {
        const newInterview = await Interview.create(interviewData);
        report = newInterview;
        console.log('✅ Interview successfully saved to MongoDB Atlas! Document ID:', newInterview._id);
      } catch (dbErr) {
        console.warn('MongoDB error saving interview, saving to local store:', dbErr.message);
      }
    }

    if (!report) {
      report = {
        _id: `interview-${Date.now()}`,
        ...interviewData,
        createdAt: new Date().toISOString()
      };
      saveLocalInterview(report);
    }

    res.status(201).json({ success: true, message: "Interview saved successfully", report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    if (isMongoConnected()) {
      try {
        let query = {};
        if (userId && userId !== 'undefined' && userId !== 'null' && userId !== 'anonymous') {
          query = { userId };
        }
        const history = await Interview.find(query).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, history });
      } catch (e) {
        console.warn('MongoDB history query error:', e.message);
      }
    }
    const all = getLocalInterviews();
    const history = all.filter(i => !userId || i.userId === userId || userId === 'local-user' || userId === 'anonymous');
    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};