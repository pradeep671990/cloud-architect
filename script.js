// ========================================
// Global Variables
// ========================================
let questions = [];
let currentQuestion = 0;
let userAnswers = [];
let score = 0;
let timer;
let timeLeft = 0;

// ========================================
// Quiz Structure
// ========================================
const quizStructure = {
  aws: [
    "ai-ml", "analytics-bigdata", "backup-dr", "compute", "containers",
    "cost-optimization", "database", "devops-automation", "identity-access",
    "logging-monitoring", "management-governance", "messaging-integration",
    "migration-transfer", "networking-cdn", "security-compliance",
    "serverless", "storage"
  ],
  azure: [
    "ai-ml", "analytics-bigdata", "backup-dr", "compute", "containers",
    "cost-optimization", "database", "devops-automation", "identity-access",
    "logging-monitoring", "management-governance", "messaging-integration",
    "migration-transfer", "networking-cdn", "security-compliance",
    "serverless", "storage"
  ],
  gcp: [
    "ai-ml", "analytics-bigdata", "backup-dr", "compute", "containers",
    "cost-optimization", "database", "devops-automation", "identity-access",
    "logging-monitoring", "management-governance", "messaging-integration",
    "migration-transfer", "networking-cdn", "security-compliance",
    "serverless", "storage"
  ],
  kubernetes: [
    "cluster-management", "core-concepts", "helm", "ingress", "monitoring",
    "networking", "rbac", "scheduling", "security", "storage",
    "troubleshooting", "workloads"
  ],
  docker: [
    "basics", "compose", "containers", "dockerfile", "images",
    "networking", "optimization", "registry", "security",
    "troubleshooting", "volumes"
  ],
  terraform: [
    "backend", "basics", "best-practices", "functions", "modules",
    "outputs", "providers", "provisioners", "resources", "state-management",
    "troubleshooting", "variables", "workspaces"
  ],
  linux: [
    "commands", "filesystem", "monitoring", "networking", "performance",
    "permissions", "process-management", "security", "services",
    "shell-scripting", "troubleshooting"
  ],
  devops: [
    "argocd", "artifact-management", "azure-devops", "deployment-strategies",
    "github-actions", "gitlab-ci", "gitops", "jenkins", "monitoring",
    "pipeline-security", "testing", "troubleshooting"
  ],
  monitoring: [
    "alertmanager", "dashboards", "elk", "fluentd", "grafana", "logging",
    "loki", "metrics", "observability", "prometheus", "tracing"
  ],
  networking: [
    "api-gateway", "dns", "firewall", "ingress", "load-balancer",
    "routing", "service-mesh", "ssl", "tcp-ip", "troubleshooting", "vpn"
  ],
  security: [
    "cloud-security", "compliance", "container-security", "devsecops",
    "encryption", "iam", "incident-response", "kubernetes-security",
    "network-security", "secrets-management", "vulnerability-management",
    "zero-trust"
  ]
};

// ========================================
// FIX 1: selectCategory()
// Called by category cards via onclick but
// was completely missing from script.js.
// This sets the hidden dropdown value AND
// populates the sub-category dropdown.
// ========================================
function selectCategory(category) {
  // Highlight the active card
  document.querySelectorAll(".category-card").forEach(card => {
    card.classList.remove("active");
  });
  const allCards = document.querySelectorAll(".category-card");
  allCards.forEach(card => {
    if (card.getAttribute("onclick") === `selectCategory('${category}')`) {
      card.classList.add("active");
    }
  });

  // Sync the hidden <select> so startQuiz() can read it
  const mainCategoryEl = document.getElementById("mainCategory");
  mainCategoryEl.value = category;

  // Populate sub-category dropdown
  const subCategoryEl = document.getElementById("subCategory");
  subCategoryEl.innerHTML = '<option value="">-- Select Sub Category --</option>';

  if (!quizStructure[category]) return;

  quizStructure[category].forEach(sub => {
    const option = document.createElement("option");
    option.value = sub;
    option.textContent = sub
      .split("-")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    subCategoryEl.appendChild(option);
  });
}

// ========================================
// Load Main Categories on Page Load
// ========================================
window.onload = function () {
  const mainCategoryEl = document.getElementById("mainCategory");
  Object.keys(quizStructure).forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category.toUpperCase();
    mainCategoryEl.appendChild(option);
  });
  displayHistory();
};

// ========================================
// Also handle hidden dropdown change
// (backward-compatible fallback)
// ========================================
document.getElementById("mainCategory").addEventListener("change", function () {
  const subCategoryEl = document.getElementById("subCategory");
  subCategoryEl.innerHTML = '<option value="">-- Select Sub Category --</option>';
  const selectedMain = this.value;
  if (!selectedMain) return;
  quizStructure[selectedMain].forEach(sub => {
    const option = document.createElement("option");
    option.value = sub;
    option.textContent = sub
      .split("-")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    subCategoryEl.appendChild(option);
  });
});

// ========================================
// Start Quiz
// ========================================
async function startQuiz() {
  const mainCategory = document.getElementById("mainCategory").value;
  const subCategory  = document.getElementById("subCategory").value;
  const difficulty   = document.getElementById("difficulty").value;
  const limit        = parseInt(document.getElementById("questionLimit").value);

  if (!mainCategory || !subCategory) {
    alert("Please select a technology and sub category first.");
    return;
  }

  clearInterval(timer);
  document.getElementById("result").innerHTML = "";
  document.getElementById("quiz").innerHTML   =
    "<p style='color:#94a3b8;padding:20px;text-align:center;'>⏳ Loading questions...</p>";

  try {
    const filePath = `./${mainCategory}/${subCategory}/${difficulty}.json`;
    console.log("Loading:", filePath);

    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(
        `File not found: ${filePath} (HTTP ${response.status}). ` +
        `Please make sure the JSON file exists at the correct path.`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`The file "${filePath}" is empty or not a valid JSON array.`);
    }

    questions       = data;
    shuffleArray(questions);
    questions       = questions.slice(0, limit);
    currentQuestion = 0;
    userAnswers     = new Array(questions.length).fill(null);
    score           = 0;
    timeLeft        = questions.length * 60;

    startTimer();
    loadQuestion();

  } catch (error) {
    console.error("Quiz load error:", error);
    document.getElementById("quiz").innerHTML = `
      <div class="error">
        ❌ Unable to load questions.<br><br>
        <strong>Reason:</strong> ${error.message}<br><br>
        Please check that your JSON file exists and is valid.
      </div>`;
  }
}

// ========================================
// Load Question
// ========================================
function loadQuestion() {
  const quizContainer = document.getElementById("quiz");

  if (!questions || questions.length === 0 || !questions[currentQuestion]) {
    quizContainer.innerHTML =
      `<div class="error">❌ Unable to load question. Please check your JSON files.</div>`;
    return;
  }

  const q = questions[currentQuestion];

  if (!q.question || !Array.isArray(q.options) || !q.answer) {
    quizContainer.innerHTML = `
      <div class="error">
        ❌ Question #${currentQuestion + 1} has invalid structure.<br>
        Each question must have: <code>question</code>, <code>options</code> (array), and <code>answer</code>.
      </div>`;
    return;
  }

  let optionsHTML = "";
  q.options.forEach((option) => {
    const isChecked = userAnswers[currentQuestion] === option ? "checked" : "";
    optionsHTML += `
      <label class="option">
        <input type="radio" name="option" value="${option}" ${isChecked}>
        ${option}
      </label>`;
  });

  quizContainer.innerHTML = `
    <div class="question-card">
      <h2>Question ${currentQuestion + 1} of ${questions.length}</h2>
      <p class="question">${q.question}</p>
      <div class="options">${optionsHTML}</div>
    </div>`;

  updateProgressBar();
  updateQuestionCounter();

  document.querySelectorAll('input[name="option"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      userAnswers[currentQuestion] = e.target.value;
    });
  });
}

// ========================================
// Next / Previous Question
// ========================================
function nextQuestion() {
  saveAnswer();
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    loadQuestion();
  }
}

function previousQuestion() {
  saveAnswer();
  if (currentQuestion > 0) {
    currentQuestion--;
    loadQuestion();
  }
}

// ========================================
// Save Answer
// ========================================
function saveAnswer() {
  const selected = document.querySelector('input[name="option"]:checked');
  if (selected) {
    userAnswers[currentQuestion] = selected.value;
  }
}

// ========================================
// Update Progress Bar
// ========================================
function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");
  if (!progressBar) return;
  const percent = ((currentQuestion + 1) / questions.length) * 100;
  progressBar.style.width = percent + "%";
}

// ========================================
// Update Question Counter
// ========================================
function updateQuestionCounter() {
  const counter = document.getElementById("questionCount");
  if (!counter) return;
  counter.textContent = `Question ${currentQuestion + 1} / ${questions.length}`;
}

// ========================================
// Submit Quiz
// FIX 2: Show full per-question review with
// correct / wrong / not-attempted breakdown
// and explanation for each question.
// ========================================
function submitQuiz() {
  saveAnswer();
  clearInterval(timer);

  if (!questions || questions.length === 0) {
    alert("No quiz is currently active.");
    return;
  }

  let correctCount = 0;
  let wrongCount   = 0;
  let skippedCount = 0;

  questions.forEach((q, index) => {
    if      (userAnswers[index] === q.answer) correctCount++;
    else if (userAnswers[index] === null)      skippedCount++;
    else                                       wrongCount++;
  });

  score = correctCount;
  const percentage = ((score / questions.length) * 100).toFixed(2);

  let reaction = "";
  if      (percentage < 55)  reaction = "❌ Failed";
  else if (percentage < 75)  reaction = "🙂 Good";
  else if (percentage < 90)  reaction = "🔥 Great";
  else if (percentage < 100) reaction = "🏆 Excellent";
  else                        reaction = "🎯 Perfect";

  // ── Summary ───────────────────────────────────
  let resultHTML = `
    <div class="result-summary">
      <h2 class="result-reaction">${reaction}</h2>
      <div class="result-stats">
        <div class="stat-box stat-total">
          <span class="stat-number">${questions.length}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-box stat-correct">
          <span class="stat-number">${correctCount}</span>
          <span class="stat-label">✅ Correct</span>
        </div>
        <div class="stat-box stat-wrong">
          <span class="stat-number">${wrongCount}</span>
          <span class="stat-label">❌ Wrong</span>
        </div>
        <div class="stat-box stat-skipped">
          <span class="stat-number">${skippedCount}</span>
          <span class="stat-label">⏭ Skipped</span>
        </div>
        <div class="stat-box stat-percent">
          <span class="stat-number">${percentage}%</span>
          <span class="stat-label">Score</span>
        </div>
      </div>
    </div>
    <h3 class="review-heading">📋 Question Review</h3>`;

  // ── Per-question review cards ─────────────────
  questions.forEach((q, index) => {
    const userAns   = userAnswers[index];
    const isCorrect = userAns === q.answer;
    const isSkipped = userAns === null;

    const statusClass = isCorrect ? "review-correct" : isSkipped ? "review-skipped" : "review-wrong";
    const statusIcon  = isCorrect ? "✅ Correct"      : isSkipped ? "⏭ Not Attempted" : "❌ Wrong";

    let optionsReviewHTML = "";
    q.options.forEach(opt => {
      let optClass = "";
      if (opt === q.answer)          optClass = "opt-correct";
      else if (opt === userAns)      optClass = "opt-wrong";
      optionsReviewHTML += `<div class="review-option ${optClass}">${opt}</div>`;
    });

    resultHTML += `
      <div class="review-card ${statusClass}">
        <div class="review-header">
          <span class="review-qnum">Q${index + 1}</span>
          <span class="review-status">${statusIcon}</span>
        </div>
        <p class="review-question">${q.question}</p>
        <div class="review-options">${optionsReviewHTML}</div>
        ${userAns && !isCorrect
          ? `<p class="review-your-ans">Your answer: <strong>${userAns}</strong></p>`
          : ""}
        <p class="review-correct-ans">✅ Correct answer: <strong>${q.answer}</strong></p>
        ${q.explanation
          ? `<p class="review-explanation">💡 ${q.explanation}</p>`
          : ""}
      </div>`;
  });

  document.getElementById("result").innerHTML = resultHTML;
  document.getElementById("result").scrollIntoView({ behavior: "smooth" });

  // ── FIX 3 & 4: Save history with timestamp ────
  saveHistory({
    name:        document.getElementById("studentName").value || "Anonymous",
    category:    document.getElementById("mainCategory").value,
    subCategory: document.getElementById("subCategory").value,
    difficulty:  document.getElementById("difficulty").value,
    score:       score,
    total:       questions.length,
    correct:     correctCount,
    wrong:       wrongCount,
    skipped:     skippedCount,
    percentage:  percentage,
    reaction:    reaction,
    date:        new Date().toLocaleString("en-IN", {
                   day: "2-digit", month: "short", year: "numeric",
                   hour: "2-digit", minute: "2-digit", hour12: true
                 })
  });

  displayHistory();
}

// ========================================
// Timer
// ========================================
function startTimer() {
  clearInterval(timer);
  updateTimer();
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timer);
      submitQuiz();
    }
  }, 1000);
}

function updateTimer() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  document.getElementById("timer").innerHTML =
    `⏱ ${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// ========================================
// Shuffle Array (Fisher-Yates)
// ========================================
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ========================================
// FIX 3 & 4: History — save & display
// with correct/wrong/skipped + timestamp
// ========================================
function saveHistory(entry) {
  const history = JSON.parse(localStorage.getItem("quizHistory") || "[]");
  history.unshift(entry);
  localStorage.setItem("quizHistory", JSON.stringify(history));
}

function displayHistory() {
  const historyEl = document.getElementById("history");
  if (!historyEl) return;

  const history = JSON.parse(localStorage.getItem("quizHistory") || "[]");

  if (history.length === 0) {
    historyEl.innerHTML =
      "<p style='color:#94a3b8;padding:10px;'>No quiz history yet. Complete a quiz to see it here.</p>";
    return;
  }

  let html = `
    <div class="history-table-wrap">
      <table class="history-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Category</th>
            <th>Sub Category</th>
            <th>Difficulty</th>
            <th>✅ Correct</th>
            <th>❌ Wrong</th>
            <th>⏭ Skipped</th>
            <th>Score</th>
            <th>%</th>
            <th>Result</th>
            <th>🕒 Date &amp; Time</th>
          </tr>
        </thead>
        <tbody>`;

  history.forEach((h, i) => {
    const correct = h.correct  !== undefined ? h.correct  : h.score;
    const wrong   = h.wrong    !== undefined ? h.wrong    : (h.total - h.score);
    const skipped = h.skipped  !== undefined ? h.skipped  : 0;

    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${h.name}</td>
        <td>${h.category ? h.category.toUpperCase() : "-"}</td>
        <td>${h.subCategory
              ? h.subCategory.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
              : "-"}</td>
        <td><span class="diff-badge diff-${h.difficulty}">${h.difficulty}</span></td>
        <td class="td-correct">${correct}</td>
        <td class="td-wrong">${wrong}</td>
        <td class="td-skipped">${skipped}</td>
        <td>${h.score}/${h.total}</td>
        <td><strong>${h.percentage}%</strong></td>
        <td>${h.reaction}</td>
        <td class="td-date">${h.date}</td>
      </tr>`;
  });

  html += `</tbody></table></div>
    <button class="btn-clear-history" onclick="clearHistory()">🗑 Clear History</button>`;

  historyEl.innerHTML = html;
}

function clearHistory() {
  if (confirm("Are you sure you want to clear all quiz history?")) {
    localStorage.removeItem("quizHistory");
    displayHistory();
  }
}