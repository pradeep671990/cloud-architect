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
const categoryMap = {
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
// DOM Elements
// ========================================
const mainCategory = document.getElementById("mainCategory");
const subCategory = document.getElementById("subCategory");

// ========================================
// Load Main Categories
// ========================================
function loadMainCategories() {

  mainCategory.innerHTML = `
    <option value="">
      Select Category
    </option>
  `;

  Object.keys(categoryMap).forEach(category => {

    const option = document.createElement("option");

    option.value = category;

    option.textContent = category
      .replace(/-/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());

    mainCategory.appendChild(option);
  });
}

// ========================================
// Load Sub Categories
// ========================================
function loadSubCategories() {

  const selectedCategory = mainCategory.value;

  subCategory.innerHTML = `
    <option value="">
      Select Sub Category
    </option>
  `;

  if (!selectedCategory || !categoryMap[selectedCategory]) {
    return;
  }

  categoryMap[selectedCategory].forEach(sub => {

    const option = document.createElement("option");

    option.value = sub;

    option.textContent = sub
      .replace(/-/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());

    subCategory.appendChild(option);
  });
}

// ========================================
// Event Listener
// ========================================
mainCategory.addEventListener("change", loadSubCategories);

// ========================================
// Page Load
// ========================================
window.onload = function () {
  loadMainCategories();
  displayHistory();
};

// ========================================
// Start Quiz
// ========================================
async function startQuiz() {

  const selectedMainCategory = mainCategory.value;
  const selectedSubCategory = subCategory.value;
  const difficulty = document.getElementById("difficulty").value;
  const limit = parseInt(document.getElementById("questionLimit").value);

  if (!selectedMainCategory || !selectedSubCategory) {
    alert("Please select Main Category and Sub Category");
    return;
  }

  try {

    const filePath = `./${selectedMainCategory}/${selectedSubCategory}/${difficulty}.json`;

    console.log("Loading:", filePath);

    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`Unable to load file: ${filePath}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("JSON file is empty or invalid.");
    }

    questions = data;

    shuffleArray(questions);

    questions = questions.slice(0, limit);

    currentQuestion = 0;

    userAnswers = new Array(questions.length).fill(null);

    score = 0;

    timeLeft = questions.length * 60;

    document.getElementById("result").innerHTML = "";

    startTimer();

    loadQuestion();

  } catch (error) {

    console.error(error);

    document.getElementById("quiz").innerHTML = `
      <div class="error">
        ❌ Unable to load questions.<br><br>
        ${error.message}
      </div>
    `;
  }
}

// ========================================
// Load Question
// ========================================
function loadQuestion() {

  const quizContainer = document.getElementById("quiz");

  if (!questions[currentQuestion]) {

    quizContainer.innerHTML = `
      <div class="error">
        ❌ Question data missing.
      </div>
    `;

    return;
  }

  const q = questions[currentQuestion];

  let optionsHTML = "";

  q.options.forEach(option => {

    const checked = userAnswers[currentQuestion] === option
      ? "checked"
      : "";

    optionsHTML += `
      <label class="option">
        <input
          type="radio"
          name="option"
          value="${option}"
          ${checked}
        >
        ${option}
      </label>
    `;
  });

  quizContainer.innerHTML = `
    <div class="question-card">

      <h2>
        Question ${currentQuestion + 1} of ${questions.length}
      </h2>

      <p class="question">
        ${q.question}
      </p>

      <div class="options">
        ${optionsHTML}
      </div>

    </div>
  `;

  updateProgressBar();
  updateQuestionCounter();

  document.querySelectorAll('input[name="option"]').forEach(radio => {

    radio.addEventListener("change", e => {
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

  const selected = document.querySelector(
    'input[name="option"]:checked'
  );

  if (selected) {
    userAnswers[currentQuestion] = selected.value;
  }
}

// ========================================
// Submit Quiz
// ========================================
function submitQuiz() {

  saveAnswer();

  clearInterval(timer);

  score = 0;

  questions.forEach((q, index) => {

    if (userAnswers[index] === q.answer) {
      score++;
    }
  });

  const percentage = (
    (score / questions.length) * 100
  ).toFixed(2);

  let reaction = "";

  if (percentage < 55) {
    reaction = "❌ Failed";
  }
  else if (percentage < 75) {
    reaction = "🙂 Good";
  }
  else if (percentage < 90) {
    reaction = "🔥 Great";
  }
  else if (percentage < 100) {
    reaction = "🏆 Excellent";
  }
  else {
    reaction = "🎯 Perfect";
  }

  document.getElementById("result").innerHTML = `

    <h2>${reaction}</h2>

    <h3>
      Score: ${score} / ${questions.length}
    </h3>

    <h3>
      Percentage: ${percentage}%
    </h3>
  `;

  saveHistory({
    name: document.getElementById("studentName").value || "Anonymous",
    category: mainCategory.value,
    subCategory: subCategory.value,
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
// Progress Bar
// ========================================
function updateProgressBar() {

  const progressBar = document.getElementById("progressBar");

  const percent = (
    (currentQuestion + 1) / questions.length
  ) * 100;

  progressBar.style.width = percent + "%";
}

// ========================================
// Question Counter
// ========================================
function updateQuestionCounter() {

  document.getElementById("questionCount").innerHTML =
    `Question ${currentQuestion + 1} / ${questions.length}`;
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
    `Time Left: ${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// ========================================
// Shuffle Questions
// ========================================
function shuffleArray(array) {

  for (let i = array.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ========================================
// Save History
// ========================================
function saveHistory(entry) {

  const history = JSON.parse(
    localStorage.getItem("quizHistory") || "[]"
  );

  history.unshift(entry);

  localStorage.setItem(
    "quizHistory",
    JSON.stringify(history)
  );
}

// ========================================
// Display History
// ========================================
function displayHistory() {

  const historyEl = document.getElementById("history");

  const history = JSON.parse(
    localStorage.getItem("quizHistory") || "[]"
  );

  if (history.length === 0) {

    historyEl.innerHTML = `
      <p>No quiz history yet.</p>
    `;

    return;
  }

  let html = `

    <table
      border="1"
      cellpadding="6"
      cellspacing="0"
      style="border-collapse:collapse;width:100%"
    >

      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Sub Category</th>
          <th>Difficulty</th>
          <th>Score</th>
          <th>%</th>
          <th>Result</th>
          <th>Date</th>
        </tr>
      </thead>

      <tbody>
  `;

  history.forEach(h => {

    html += `
      <tr>
        <td>${h.name}</td>
        <td>${h.category}</td>
        <td>${h.subCategory}</td>
        <td>${h.difficulty}</td>
        <td>${h.score}/${h.total}</td>
        <td>${h.percentage}%</td>
        <td>${h.reaction}</td>
        <td>${h.date}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  historyEl.innerHTML = html;
}