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

function selectCategory(category) {

  // Set hidden dropdown value
  document.getElementById("mainCategory").value = category;

  // Remove active from all cards
  document
    .querySelectorAll(".category-card")
    .forEach(card => {

      card.classList.remove("active");
    });

  // Add active class to clicked card
  event.currentTarget.classList.add("active");

  // Trigger subcategory loading
  loadSubCategories();
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
// Load Sub Categories on Main Category Change
// ========================================
document.getElementById("mainCategory").addEventListener("change", function () {
  const subCategoryEl = document.getElementById("subCategory");
  subCategoryEl.innerHTML = '<option value="">Select Sub Category</option>';
  const selectedMain = this.value;
  if (!selectedMain) return;
  quizStructure[selectedMain].forEach(sub => {
    const option = document.createElement("option");
    option.value = sub;
    option.textContent = sub.toUpperCase();
    subCategoryEl.appendChild(option);
  });
});

// ========================================
// Start Quiz
// ========================================
async function startQuiz() {
  const mainCategory = document.getElementById("mainCategory").value;
  const subCategory = document.getElementById("subCategory").value;
  const difficulty = document.getElementById("difficulty").value;
  const limit = parseInt(document.getElementById("questionLimit").value);

  if (!mainCategory || !subCategory) {
    alert("Please select a main category and sub category.");
    return;
  }

  // Clear any previous state
  clearInterval(timer);
  document.getElementById("result").innerHTML = "";
  document.getElementById("quiz").innerHTML = "<p>Loading questions...</p>";

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
      throw new Error(
        `The file "${filePath}" is empty or not a valid JSON array.`
      );
    }

    questions = data;
    shuffleArray(questions);
    questions = questions.slice(0, limit);

    currentQuestion = 0;
    // FIX: consistently use userAnswers everywhere
    userAnswers = new Array(questions.length).fill(null);
    score = 0;
    timeLeft = questions.length * 60;

    startTimer();
    loadQuestion();

  } catch (error) {
    console.error("Quiz load error:", error);
    document.getElementById("quiz").innerHTML = `
      <div class="error">
        ❌ Unable to load questions.<br><br>
        <strong>Reason:</strong> ${error.message}<br><br>
        Please check that your JSON file exists and is valid.
      </div>
    `;
  }
}

// ========================================
// Load Question
// ========================================
function loadQuestion() {
  const quizContainer = document.getElementById("quiz");

  // Safety check
  if (!questions || questions.length === 0 || !questions[currentQuestion]) {
    quizContainer.innerHTML = `
      <div class="error">
        ❌ Unable to load questions.<br><br>
        Please check your JSON files.
      </div>
    `;
    console.error("Question object missing at index:", currentQuestion, questions);
    return;
  }

  const q = questions[currentQuestion];

  // Validate question structure
  if (!q.question || !Array.isArray(q.options) || !q.answer) {
    quizContainer.innerHTML = `
      <div class="error">
        ❌ Question #${currentQuestion + 1} has invalid structure.<br><br>
        Each question must have: <code>question</code>, <code>options</code> (array), and <code>answer</code>.
      </div>
    `;
    console.error("Invalid question structure:", q);
    return;
  }

  let optionsHTML = "";
  q.options.forEach((option) => {
    // FIX: use userAnswers (not answers) and name="option" consistently
    const isChecked = userAnswers[currentQuestion] === option ? "checked" : "";
    optionsHTML += `
      <label class="option">
        <input
          type="radio"
          name="option"
          value="${option}"
          ${isChecked}
        >
        ${option}
      </label>
    `;
  });

  quizContainer.innerHTML = `
    <div class="question-card">
      <h2>Question ${currentQuestion + 1} of ${questions.length}</h2>
      <p class="question">${q.question}</p>
      <div class="options">
        ${optionsHTML}
      </div>
    </div>
  `;

  updateProgressBar();
  updateQuestionCounter();

  // FIX: use userAnswers (not answers) when saving selection
  document.querySelectorAll('input[name="option"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      userAnswers[currentQuestion] = e.target.value;
    });
  });
}

// ========================================
// Next Question
// ========================================
function nextQuestion() {
  saveAnswer();
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    loadQuestion();
  }
}

// ========================================
// Previous Question
// ========================================
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
  // FIX: name="option" matches the radio inputs in loadQuestion()
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
// ========================================
function submitQuiz() {
  saveAnswer();
  clearInterval(timer);

  if (!questions || questions.length === 0) {
    alert("No quiz is currently active.");
    return;
  }

  score = 0;
  questions.forEach((q, index) => {
    if (userAnswers[index] === q.answer) {
      score++;
    }
  });

  const percentage = ((score / questions.length) * 100).toFixed(2);

  let reaction = "";
  if (percentage < 55)       reaction = "❌ Failed";
  else if (percentage < 75)  reaction = "🙂 Good";
  else if (percentage < 90)  reaction = "🔥 Great";
  else if (percentage < 100) reaction = "🏆 Excellent";
  else                        reaction = "🎯 Perfect";

  document.getElementById("result").innerHTML = `
    <h2>${reaction}</h2>
    <h3>Score: ${score} / ${questions.length}</h3>
    <h3>Percentage: ${percentage}%</h3>
  `;

  // Save to history
  saveHistory({
    name: document.getElementById("studentName").value || "Anonymous",
    category: document.getElementById("mainCategory").value,
    subCategory: document.getElementById("subCategory").value,
    difficulty: document.getElementById("difficulty").value,
    score: score,
    total: questions.length,
    percentage: percentage,
    reaction: reaction,
    date: new Date().toLocaleString()
  });

  displayHistory();
}

// ========================================
// Timer
// ========================================
function startTimer() {
  clearInterval(timer); // prevent duplicate timers
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
    `Time Left: ${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
// Quiz History (localStorage)
// ========================================
function saveHistory(entry) {
  const history = JSON.parse(localStorage.getItem("quizHistory") || "[]");
  history.unshift(entry); // newest first
  localStorage.setItem("quizHistory", JSON.stringify(history));
}

function displayHistory() {
  const historyEl = document.getElementById("history");
  if (!historyEl) return;
  const history = JSON.parse(localStorage.getItem("quizHistory") || "[]");

  if (history.length === 0) {
    historyEl.innerHTML = "<p>No quiz history yet.</p>";
    return;
  }

  let html = `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
    <thead>
      <tr>
        <th>Name</th><th>Category</th><th>Sub Category</th>
        <th>Difficulty</th><th>Score</th><th>%</th><th>Result</th><th>Date</th>
      </tr>
    </thead><tbody>`;

  history.forEach(h => {
    html += `<tr>
      <td>${h.name}</td>
      <td>${h.category.toUpperCase()}</td>
      <td>${h.subCategory.toUpperCase()}</td>
      <td>${h.difficulty}</td>
      <td>${h.score}/${h.total}</td>
      <td>${h.percentage}%</td>
      <td>${h.reaction}</td>
      <td>${h.date}</td>
    </tr>`;
  });

  html += "</tbody></table>";
  historyEl.innerHTML = html;
}