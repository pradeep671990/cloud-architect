// ===============================
// Quiz Application Script
// ===============================

let allQuestions = [];
let selectedQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 0;

// ===============================
// DOM Elements
// ===============================

const mainCategory = document.getElementById("mainCategory");
const subCategory = document.getElementById("subCategory");
const difficulty = document.getElementById("difficulty");
const questionCount = document.getElementById("questionCount");

const startBtn = document.getElementById("startQuiz");

const quizContainer = document.getElementById("quizContainer");
const questionElement = document.getElementById("question");
const optionsElement = document.getElementById("options");

const nextBtn = document.getElementById("nextBtn");

const timerElement = document.getElementById("timer");

const resultContainer = document.getElementById("result");


// ===============================
// Categories Structure
// ===============================

const quizStructure = {

  aws: [
    "ai-ml",
    "analytics-bigdata",
    "backup-dr",
    "compute",
    "containers",
    "cost-optimization",
    "database",
    "devops-automation",
    "identity-access",
    "logging-monitoring",
    "management-governance",
    "messaging-integration",
    "migration-transfer",
    "networking-cdn",
    "security-compliance",
    "serverless",
    "storage"
  ],

  azure: [
    "ai-ml",
    "analytics-bigdata",
    "backup-dr",
    "compute",
    "containers",
    "cost-optimization",
    "database",
    "devops-automation",
    "identity-access",
    "logging-monitoring",
    "management-governance",
    "messaging-integration",
    "migration-transfer",
    "networking-cdn",
    "security-compliance",
    "serverless",
    "storage"
  ],

  gcp: [
    "ai-ml",
    "analytics-bigdata",
    "backup-dr",
    "compute",
    "containers",
    "cost-optimization",
    "database",
    "devops-automation",
    "identity-access",
    "logging-monitoring",
    "management-governance",
    "messaging-integration",
    "migration-transfer",
    "networking-cdn",
    "security-compliance",
    "serverless",
    "storage"
  ],

  kubernetes: [
    "cluster-management",
    "core-concepts",
    "helm",
    "ingress",
    "monitoring",
    "networking",
    "rbac",
    "scheduling",
    "security",
    "storage",
    "troubleshooting",
    "workloads"
  ],

  docker: [
    "basics",
    "compose",
    "containers",
    "dockerfile",
    "images",
    "networking",
    "optimization",
    "registry",
    "security",
    "troubleshooting",
    "volumes"
  ],

  terraform: [
    "backend",
    "basics",
    "best-practices",
    "functions",
    "modules",
    "outputs",
    "providers",
    "provisioners",
    "resources",
    "state-management",
    "troubleshooting",
    "variables",
    "workspaces"
  ],

  linux: [
    "commands",
    "filesystem",
    "monitoring",
    "networking",
    "performance",
    "permissions",
    "process-management",
    "security",
    "services",
    "shell-scripting",
    "troubleshooting"
  ],

  devops: [
    "argocd",
    "artifact-management",
    "azure-devops",
    "deployment-strategies",
    "github-actions",
    "gitlab-ci",
    "gitops",
    "jenkins",
    "monitoring",
    "pipeline-security",
    "testing",
    "troubleshooting"
  ],

  monitoring: [
    "alertmanager",
    "dashboards",
    "elk",
    "fluentd",
    "grafana",
    "logging",
    "loki",
    "metrics",
    "observability",
    "prometheus",
    "tracing"
  ],

  networking: [
    "api-gateway",
    "dns",
    "firewall",
    "ingress",
    "load-balancer",
    "routing",
    "service-mesh",
    "ssl",
    "tcp-ip",
    "troubleshooting",
    "vpn"
  ],

  security: [
    "cloud-security",
    "compliance",
    "container-security",
    "devsecops",
    "encryption",
    "iam",
    "incident-response",
    "kubernetes-security",
    "network-security",
    "secrets-management",
    "vulnerability-management",
    "zero-trust"
  ]

};


// ===============================
// Load Main Categories
// ===============================

function loadMainCategories() {

  mainCategory.innerHTML =
    '<option value="">Select Main Category</option>';

  Object.keys(quizStructure).forEach(category => {

    const option = document.createElement("option");

    option.value = category;

    option.textContent =
      category.replace(/-/g, " ").toUpperCase();

    mainCategory.appendChild(option);

  });

}


// ===============================
// Load Sub Categories
// ===============================

mainCategory.addEventListener("change", () => {

  const selectedMain = mainCategory.value;

  subCategory.innerHTML =
    '<option value="">Select Sub Category</option>';

  if (!selectedMain) return;

  quizStructure[selectedMain].forEach(sub => {

    const option = document.createElement("option");

    option.value = sub;

    option.textContent =
      sub.replace(/-/g, " ").toUpperCase();

    subCategory.appendChild(option);

  });

});


// ===============================
// Start Quiz
// ===============================

startBtn.addEventListener("click", async () => {

  const main = mainCategory.value;
  const sub = subCategory.value;
  const level = difficulty.value;
  const totalQuestions = parseInt(questionCount.value);

  if (!main || !sub || !level || !totalQuestions) {

    alert("Please select all fields");

    return;
  }

  try {

    const filePath =
      `./${main}/${sub}/${level}.json`;

    console.log("Loading:", filePath);

    const response = await fetch(filePath);

    if (!response.ok) {

      throw new Error(
        `Unable to load ${filePath}`
      );
    }

    allQuestions = await response.json();

    if (!Array.isArray(allQuestions)) {

      throw new Error("Invalid JSON format");
    }

    shuffleArray(allQuestions);

    selectedQuestions =
      allQuestions.slice(0, totalQuestions);

    currentQuestionIndex = 0;
    score = 0;

    startQuiz();

  } catch (error) {

    console.error(error);

    alert("Failed to load questions.");
  }

});


// ===============================
// Start Quiz UI
// ===============================

function startQuiz() {

  document.getElementById("setupContainer").style.display = "none";

  quizContainer.style.display = "block";

  timeLeft = selectedQuestions.length * 60;

  startTimer();

  showQuestion();

}


// ===============================
// Show Question
// ===============================

function showQuestion() {

  resetState();

  const currentQuestion =
    selectedQuestions[currentQuestionIndex];

  questionElement.textContent =
    `${currentQuestionIndex + 1}. ${currentQuestion.question}`;

  currentQuestion.options.forEach(option => {

    const button = document.createElement("button");

    button.innerText = option;

    button.classList.add("option-btn");

    button.addEventListener("click", () =>
      selectAnswer(button, currentQuestion.answer)
    );

    optionsElement.appendChild(button);

  });

}


// ===============================
// Reset Options
// ===============================

function resetState() {

  nextBtn.style.display = "none";

  while (optionsElement.firstChild) {

    optionsElement.removeChild(optionsElement.firstChild);

  }

}


// ===============================
// Select Answer
// ===============================

function selectAnswer(button, correctAnswer) {

  const buttons =
    optionsElement.querySelectorAll("button");

  buttons.forEach(btn => {

    btn.disabled = true;

    if (btn.innerText === correctAnswer) {

      btn.style.backgroundColor = "green";

    }

  });

  if (button.innerText === correctAnswer) {

    score++;

  } else {

    button.style.backgroundColor = "red";

  }

  nextBtn.style.display = "block";

}


// ===============================
// Next Question
// ===============================

nextBtn.addEventListener("click", () => {

  currentQuestionIndex++;

  if (currentQuestionIndex < selectedQuestions.length) {

    showQuestion();

  } else {

    showResult();

  }

});


// ===============================
// Show Result
// ===============================

function showResult() {

  clearInterval(timer);

  quizContainer.style.display = "none";

  resultContainer.style.display = "block";

  const percentage =
    ((score / selectedQuestions.length) * 100).toFixed(2);

  let reaction = "";

  if (percentage < 55) {

    reaction = "❌ Failed";

  } else if (percentage >= 55 && percentage < 75) {

    reaction = "🙂 Good Job";

  } else if (percentage >= 75 && percentage < 90) {

    reaction = "🔥 Great Work";

  } else if (percentage >= 90 && percentage < 100) {

    reaction = "🏆 Excellent";

  } else {

    reaction = "🎯 Perfect Score";

  }

  resultContainer.innerHTML = `
    <h2>Quiz Completed</h2>
    <h3>${reaction}</h3>
    <p>Score: ${score}/${selectedQuestions.length}</p>
    <p>Percentage: ${percentage}%</p>
  `;

}


// ===============================
// Timer
// ===============================

function startTimer() {

  timerElement.innerText =
    `Time Left: ${formatTime(timeLeft)}`;

  timer = setInterval(() => {

    timeLeft--;

    timerElement.innerText =
      `Time Left: ${formatTime(timeLeft)}`;

    if (timeLeft <= 0) {

      clearInterval(timer);

      showResult();

    }

  }, 1000);

}


// ===============================
// Format Time
// ===============================

function formatTime(seconds) {

  const mins = Math.floor(seconds / 60);

  const secs = seconds % 60;

  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;

}


// ===============================
// Shuffle Questions
// ===============================

function shuffleArray(array) {

  for (let i = array.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] =
      [array[j], array[i]];
  }

}


// ===============================
// Initialize
// ===============================

loadMainCategories();