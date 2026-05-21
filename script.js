// ========================================
// Global Variables
// ========================================
let questions = [];
let currentQuestion = 0;
let userAnswers = [];
let score = 0;
let timer;
let timeLeft = 0;
let quizStartTime;

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
    "troubleshooting", "workloads", "qa"
  ],

  architect: [
    "basics", "compose", "containers", "dockerfile", "images",
    "networking", "optimization", "registry", "security",
    "troubleshooting", "volumes"
  ],

  terraform: [
    "backend", "basics", "best-practices", "functions", "modules",
    "outputs", "providers", "provisioners", "resources",
    "state-management", "troubleshooting", "variables", "workspaces"
  ],

  linux: [
    "commands", "filesystem", "monitoring", "networking", "performance",
    "permissions", "process-management", "security", "services",
    "shell-scripting", "troubleshooting"
  ],

  devops: [
    "argocd", "artifact-management", "azure-devops",
    "deployment-strategies", "github-actions", "gitlab-ci",
    "gitops", "jenkins", "monitoring", "pipeline-security",
    "testing", "troubleshooting"
  ],

  monitoring: [
    "alertmanager", "dashboards", "elk", "fluentd",
    "grafana", "logging", "loki", "metrics",
    "observability", "prometheus", "tracing"
  ],

  networking: [
    "api-gateway", "dns", "firewall", "ingress",
    "load-balancer", "routing", "service-mesh",
    "ssl", "tcp-ip", "troubleshooting", "vpn"
  ],

  security: [
    "cloud-security", "compliance", "container-security",
    "devsecops", "encryption", "iam", "incident-response",
    "kubernetes-security", "network-security",
    "secrets-management", "vulnerability-management",
    "zero-trust"
  ]
};

// ========================================
// Page Load
// ========================================
window.onload = function () {

  loadMainCategories();
  displayHistory();

};

// ========================================
// Load Main Categories
// ========================================
function loadMainCategories() {

  const mainCategoryEl = document.getElementById("mainCategory");

  mainCategoryEl.innerHTML = `
    <option value="">Select Category</option>
  `;

  Object.keys(quizStructure).forEach(category => {

    const option = document.createElement("option");

    option.value = category;

    option.textContent =
      category.charAt(0).toUpperCase() + category.slice(1);

    mainCategoryEl.appendChild(option);

  });

}

// ========================================
// Main Category Change
// ========================================
document
  .getElementById("mainCategory")
  .addEventListener("change", function () {

    const selectedMain = this.value;

    const subCategoryEl =
      document.getElementById("subCategory");

    subCategoryEl.innerHTML =
      `<option value="">Select Sub Category</option>`;

    if (!selectedMain || !quizStructure[selectedMain]) {
      return;
    }

    quizStructure[selectedMain].forEach(sub => {

      const option = document.createElement("option");

      option.value = sub;

      option.textContent =
        sub.replace(/-/g, " ").toUpperCase();

      subCategoryEl.appendChild(option);

    });

  });

// ========================================
// Start Quiz
// ========================================
async function startQuiz() {

  const mainCategory =
    document.getElementById("mainCategory").value;

  const subCategory =
    document.getElementById("subCategory").value;

  const difficulty =
    document.getElementById("difficulty").value;

  const limit =
    parseInt(
      document.getElementById("questionLimit").value
    );

  if (!mainCategory || !subCategory) {

    alert(
      "Please select both Main Category and Sub Category."
    );

    return;

  }

  try {

    clearInterval(timer);

    document.getElementById("result").innerHTML = "";

    document.getElementById("quiz").innerHTML =
      "<h3>Loading Questions...</h3>";

    const filePath =
      `./${mainCategory}/${subCategory}/${difficulty}.json`;

    //console.log("Loading file:", filePath);
    console.log("================================");
    console.log("Main Category:", mainCategory);
    console.log("Sub Category:", subCategory);
    console.log("Difficulty:", difficulty);
    console.log("Loading file:", filePath);
    console.log("================================");

    const response = await fetch(filePath);

    if (!response.ok) {

      throw new Error(
        `Unable to load file: ${filePath}`
      );

    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {

      throw new Error(
        "JSON file is empty or invalid."
      );

    }

    questions = data;

    shuffleArray(questions);

    questions = questions.slice(0, limit);

    currentQuestion = 0;

    userAnswers =
      new Array(questions.length).fill(null);

    score = 0;

    timeLeft = questions.length * 60;

    quizStartTime = new Date();

    startTimer();

    loadQuestion();

  }

  catch (error) {

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

  const quizEl =
    document.getElementById("quiz");

  const q = questions[currentQuestion];

  if (!q) {

    quizEl.innerHTML =
      "<h3>Question not found.</h3>";

    return;

  }

  let optionsHTML = "";

  q.options.forEach(option => {

    const checked =
      userAnswers[currentQuestion] === option
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

  quizEl.innerHTML = `
    <div class="question-card">

      <h2>
        Question ${currentQuestion + 1}
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

  document
    .querySelectorAll('input[name="option"]')
    .forEach(radio => {

      radio.addEventListener("change", function () {

        userAnswers[currentQuestion] = this.value;

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

  const selected =
    document.querySelector(
      'input[name="option"]:checked'
    );

  if (selected) {

    userAnswers[currentQuestion] =
      selected.value;

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

  const percentage =
    ((score / questions.length) * 100)
    .toFixed(2);

  let reaction = "";

  if (percentage < 55) {

    reaction =
      "😢 Fail! Keep practicing and try again.";

  }

  else if (percentage < 75) {

    reaction = "🙂 Good Job";

  }

  else if (percentage < 90) {

    reaction = "🔥 Great";

  }

  else if (percentage < 100) {

    reaction = "🏆 Excellent";

  }

  else {

    reaction = "🎯 Perfect Score";

  }

  // ====================================
  // Time Taken
  // ====================================
  const quizEndTime = new Date();

  const totalSeconds =
    Math.floor(
      (quizEndTime - quizStartTime) / 1000
    );

  const mins =
    Math.floor(totalSeconds / 60);

  const secs =
    totalSeconds % 60;

  const timeTaken =
    `${mins}m ${secs}s`;

  // ====================================
  // Result HTML
  // ====================================
  let resultHTML = `
    <h2>${reaction}</h2>

    <h3>
      Score: ${score} / ${questions.length}
    </h3>

    <h3>
      Percentage: ${percentage}%
    </h3>

    <p>
      ⏱ Time Taken: ${timeTaken}
    </p>

    <hr>

    <h2>
      📘 Detailed Result
    </h2>
  `;

  questions.forEach((q, index) => {

    const userAnswer =
      userAnswers[index] || "Not Answered";

    const isCorrect =
      userAnswer === q.answer;

    resultHTML += `
      <div class="result-card">

        <h3>
          ${isCorrect ? "✅" : "❌"}
          Q${index + 1}:
          ${isCorrect ? "Correct" : "Wrong"}
        </h3>

        <p>
          <strong>Question:</strong>
          ${q.question}
        </p>

        <p>
          <strong>Your Answer:</strong>
          ${userAnswer}
        </p>

        <p>
          <strong>Correct Answer:</strong>
          ${q.answer}
        </p>

        <p>
          <strong>Explanation:</strong>
          ${q.explanation || "No explanation available"}
        </p>

        <hr>

      </div>
    `;

  });

  document.getElementById("result").innerHTML =
    resultHTML;

  // ====================================
  // Save History
  // ====================================
  saveHistory({

    name:
      document.getElementById("studentName").value
      || "Anonymous",

    category:
      document.getElementById("mainCategory").value,

    subCategory:
      document.getElementById("subCategory").value,

    difficulty:
      document.getElementById("difficulty").value,

    score: score,

    total: questions.length,

    percentage: percentage,

    reaction: reaction,

    timeTaken: timeTaken,

    date: new Date().toLocaleString()

  });

  displayHistory();

}

// ========================================
// Timer
// ========================================
function startTimer() {

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

  const mins =
    Math.floor(timeLeft / 60);

  const secs =
    timeLeft % 60;

  document.getElementById("timer").innerHTML =
    `Time Left: ${mins}:${secs < 10 ? "0" : ""}${secs}`;

}

// ========================================
// Progress Bar
// ========================================
function updateProgressBar() {

  const progress =
    ((currentQuestion + 1) / questions.length) * 100;

  document.getElementById("progressBar")
    .style.width = progress + "%";

}

// ========================================
// Question Counter
// ========================================
function updateQuestionCounter() {

  document.getElementById("questionCount")
    .innerHTML =
      `Question ${currentQuestion + 1}
       / ${questions.length}`;

}

// ========================================
// Shuffle Questions
// ========================================
function shuffleArray(array) {

  for (let i = array.length - 1; i > 0; i--) {

    const j =
      Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] =
      [array[j], array[i]];

  }

}

// ========================================
// Save History
// ========================================
function saveHistory(entry) {

  const history =
    JSON.parse(
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

  const historyEl =
    document.getElementById("history");

  const history =
    JSON.parse(
      localStorage.getItem("quizHistory") || "[]"
    );

  if (history.length === 0) {

    historyEl.innerHTML =
      "<p>No quiz history available.</p>";

    return;

  }

  let html = "";

  history.forEach((h, index) => {

    html += `
      <div class="history-card">

        <h3>
          Attempt ${index + 1}
        </h3>

        <p>
          <strong>Student:</strong>
          ${h.name}
        </p>

        <p>
          <strong>Category:</strong>
          ${h.category}
        </p>

        <p>
          <strong>Sub Category:</strong>
          ${h.subCategory}
        </p>

        <p>
          <strong>Difficulty:</strong>
          ${h.difficulty}
        </p>

        <p>
          <strong>Score:</strong>
          ${h.score}/${h.total}
        </p>

        <p>
          <strong>Percentage:</strong>
          ${h.percentage}%
        </p>

        <p>
          <strong>Result:</strong>
          ${h.reaction}
        </p>

        <p>
          <strong>Time Taken:</strong>
          ${h.timeTaken}
        </p>

        <p>
          <strong>Date:</strong>
          ${h.date}
        </p>

      </div>

      <hr>
    `;

  });

  historyEl.innerHTML = html;

}