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


// ========================================
// Load Main Categories
// ========================================

window.onload = function () {

  const mainCategory =
    document.getElementById("mainCategory");

  Object.keys(quizStructure).forEach(category => {

    const option =
      document.createElement("option");

    option.value = category;

    option.textContent =
      category.toUpperCase();

    mainCategory.appendChild(option);

  });

};


// ========================================
// Load Sub Categories
// ========================================

document
  .getElementById("mainCategory")
  .addEventListener("change", function () {

    const subCategory =
      document.getElementById("subCategory");

    subCategory.innerHTML =
      '<option value="">Select Sub Category</option>';

    const selectedMain =
      this.value;

    if (!selectedMain) return;

    quizStructure[selectedMain]
      .forEach(sub => {

        const option =
          document.createElement("option");

        option.value = sub;

        option.textContent =
          sub.toUpperCase();

        subCategory.appendChild(option);

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

    alert("Please select category");

    return;
  }

  try {

    const filePath =
      `./${mainCategory}/${subCategory}/${difficulty}.json`;

    console.log("Loading:", filePath);

    const response =
      await fetch(filePath);

    if (!response.ok) {

      throw new Error("JSON not found");

    }

    questions =
      await response.json();

    shuffleArray(questions);

    questions =
      questions.slice(0, limit);

    currentQuestion = 0;

    userAnswers =
      new Array(questions.length).fill(null);

    score = 0;

    timeLeft =
      questions.length * 60;

    startTimer();

    loadQuestion();

  }

  catch (error) {

    console.error(error);
  
    alert(
      "Unable to load questions:\n" +
      error.message
    );
  
  }

}


// ========================================
// Load Question
// ========================================

function loadQuestion() {

  const quizContainer = document.getElementById("quiz");

  // Safety check
  if (
    !questions ||
    questions.length === 0 ||
    !questions[currentQuestion]
  ) {

    quizContainer.innerHTML = `
      <div class="error">
        ❌ Unable to load questions.
        <br><br>
        Please check your JSON files.
      </div>
    `;

    console.error("Question object missing:", questions);
    return;
  }

  const q = questions[currentQuestion];

  let optionsHTML = "";

  q.options.forEach((option, index) => {

    optionsHTML += `
      <label class="option">
        <input
          type="radio"
          name="option"
          value="${option}"
          ${answers[currentQuestion] === option ? "checked" : ""}
        >
        ${option}
      </label>
    `;
  });

  quizContainer.innerHTML = `
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

  // Save selected answer
  document.querySelectorAll('input[name="option"]').forEach((radio) => {

    radio.addEventListener("change", (e) => {

      answers[currentQuestion] = e.target.value;
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
      'input[name="answer"]:checked'
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
    ((score / questions.length) * 100).toFixed(2);

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

  document.getElementById("result")
    .innerHTML =
    `
    <h2>${reaction}</h2>

    <h3>
      Score: ${score}/${questions.length}
    </h3>

    <h3>
      Percentage: ${percentage}%
    </h3>
  `;

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

  document.getElementById("timer")
    .innerHTML =
    `Time Left: ${mins}:${secs < 10 ? '0' : ''}${secs}`;

}


// ========================================
// Shuffle Questions
// ========================================

function shuffleArray(array) {

  for (
    let i = array.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] =
      [array[j], array[i]];

  }

}