document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // GLOBAL VARIABLES
  // ===============================

  let questions = [];
  let selectedQuestions = [];

  let currentQuestionIndex = 0;
  let userAnswers = [];

  let timer;
  let totalSeconds = 0;

  // ===============================
  // ELEMENTS
  // ===============================

  const homeScreen = document.getElementById("homeScreen");
  const quizScreen = document.getElementById("quizScreen");
  const resultScreen = document.getElementById("resultScreen");

  const mainCategory = document.getElementById("mainCategory");
  const subCategory = document.getElementById("subCategory");
  const difficulty = document.getElementById("difficulty");
  const questionCount = document.getElementById("questionCount");

  const totalTimeDisplay = document.getElementById("totalTimeDisplay");

  const startQuizBtn = document.getElementById("startQuizBtn");

  const questionText = document.getElementById("questionText");
  const optionsContainer = document.getElementById("optionsContainer");

  const currentQuestion = document.getElementById("currentQuestion");
  const totalQuestions = document.getElementById("totalQuestions");

  const timerElement = document.getElementById("timer");

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");

  const progressBar = document.getElementById("progressBar");

  const scorePercent = document.getElementById("scorePercent");
  const resultReaction = document.getElementById("resultReaction");

  const correctAnswers = document.getElementById("correctAnswers");
  const wrongAnswers = document.getElementById("wrongAnswers");
  const finalTotal = document.getElementById("finalTotal");

  const restartQuizBtn = document.getElementById("restartQuizBtn");

  const themeToggle = document.getElementById("themeToggle");

  // ===============================
  // CATEGORY MAP
  // ===============================

  const categoryMap = {

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
    ]
  };

  // ===============================
  // LOAD MAIN CATEGORY
  // ===============================

  Object.keys(categoryMap).forEach(category => {

    const option = document.createElement("option");

    option.value = category;

    option.textContent =
      category.charAt(0).toUpperCase() +
      category.slice(1);

    mainCategory.appendChild(option);

  });

  // ===============================
  // UPDATE SUB CATEGORY
  // ===============================

  mainCategory.addEventListener("change", () => {

    const selectedMain = mainCategory.value;

    subCategory.innerHTML =
      `<option value="">Select Sub Category</option>`;

    if (!selectedMain) return;

    categoryMap[selectedMain].forEach(category => {

      const option = document.createElement("option");

      option.value = category;

      option.textContent =
        category
          .replace(/-/g, " ")
          .replace(/\b\w/g, c => c.toUpperCase());

      subCategory.appendChild(option);

    });

  });

  // ===============================
  // AUTO UPDATE TIME
  // ===============================

  questionCount.addEventListener("change", () => {

    totalTimeDisplay.textContent =
      questionCount.value;

  });

  // ===============================
  // START QUIZ
  // ===============================

  startQuizBtn.addEventListener("click", async () => {

    const main = mainCategory.value;
    const sub = subCategory.value;
    const level = difficulty.value;

    const total =
      parseInt(questionCount.value);

    if (!main || !sub) {

      alert(
        "Please select category and sub category"
      );

      return;

    }

    try {

      const filePath =
        `./${main}/${sub}/${level}.json`;

      const response =
        await fetch(filePath);

      if (!response.ok) {

        throw new Error("JSON not found");

      }

      questions = await response.json();

      if (!questions.length) {

        alert("No questions found");

        return;

      }

      selectedQuestions =
        shuffleArray([...questions]).slice(0, total);

      userAnswers =
        new Array(selectedQuestions.length).fill(null);

      currentQuestionIndex = 0;

      totalSeconds =
        selectedQuestions.length * 60;

      homeScreen.classList.remove("active");
      resultScreen.classList.remove("active");

      quizScreen.classList.add("active");

      totalQuestions.textContent =
        selectedQuestions.length;

      loadQuestion();

      startTimer();

    } catch (error) {

      console.error(error);

      alert(
        "Unable to load questions JSON file"
      );

    }

  });

  // ===============================
  // LOAD QUESTION
  // ===============================

  function loadQuestion() {

    const current =
      selectedQuestions[currentQuestionIndex];

    currentQuestion.textContent =
      currentQuestionIndex + 1;

    questionText.textContent =
      current.question;

    optionsContainer.innerHTML = "";

    current.options.forEach(option => {

      const optionBtn =
        document.createElement("button");

      optionBtn.classList.add("option-btn");

      optionBtn.textContent = option;

      if (
        userAnswers[currentQuestionIndex] === option
      ) {

        optionBtn.classList.add("selected");

      }

      optionBtn.addEventListener("click", () => {

        userAnswers[currentQuestionIndex] = option;

        loadQuestion();

      });

      optionsContainer.appendChild(optionBtn);

    });

    updateProgress();

    updateButtons();

  }

  // ===============================
  // UPDATE BUTTONS
  // ===============================

  function updateButtons() {

    prevBtn.style.display =
      currentQuestionIndex === 0
        ? "none"
        : "inline-block";

    nextBtn.style.display =
      currentQuestionIndex ===
      selectedQuestions.length - 1
        ? "none"
        : "inline-block";

    submitBtn.style.display =
      currentQuestionIndex ===
      selectedQuestions.length - 1
        ? "inline-block"
        : "none";

  }

  // ===============================
  // NEXT BUTTON
  // ===============================

  nextBtn.addEventListener("click", () => {

    if (
      currentQuestionIndex <
      selectedQuestions.length - 1
    ) {

      currentQuestionIndex++;

      loadQuestion();

    }

  });

  // ===============================
  // PREVIOUS BUTTON
  // ===============================

  prevBtn.addEventListener("click", () => {

    if (currentQuestionIndex > 0) {

      currentQuestionIndex--;

      loadQuestion();

    }

  });

  // ===============================
  // TIMER
  // ===============================

  function startTimer() {

    updateTimerDisplay();

    timer = setInterval(() => {

      totalSeconds--;

      updateTimerDisplay();

      if (totalSeconds <= 0) {

        clearInterval(timer);

        submitQuiz();

      }

    }, 1000);

  }

  function updateTimerDisplay() {

    const minutes =
      Math.floor(totalSeconds / 60);

    const seconds =
      totalSeconds % 60;

    timerElement.textContent =
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  }

  // ===============================
  // PROGRESS BAR
  // ===============================

  function updateProgress() {

    const progress =
      ((currentQuestionIndex + 1) /
        selectedQuestions.length) * 100;

    progressBar.style.width =
      `${progress}%`;

  }

  // ===============================
  // SUBMIT QUIZ
  // ===============================

  submitBtn.addEventListener("click", () => {

    submitQuiz();

  });

  function submitQuiz() {

    clearInterval(timer);

    let correct = 0;

    selectedQuestions.forEach(
      (question, index) => {

        if (
          userAnswers[index] ===
          question.answer
        ) {

          correct++;

        }

      }
    );

    const wrong =
      selectedQuestions.length - correct;

    const percentage =
      Math.round(
        (correct / selectedQuestions.length) * 100
      );

    quizScreen.classList.remove("active");

    resultScreen.classList.add("active");

    scorePercent.textContent =
      `${percentage}%`;

    correctAnswers.textContent = correct;

    wrongAnswers.textContent = wrong;

    finalTotal.textContent =
      selectedQuestions.length;

    // REACTIONS

    if (percentage < 55) {

      resultReaction.innerHTML =
        "😢 Failed! Keep Practicing";

    } else if (
      percentage >= 55 &&
      percentage < 75
    ) {

      resultReaction.innerHTML =
        "🙂 Good Job!";

    } else if (
      percentage >= 75 &&
      percentage < 90
    ) {

      resultReaction.innerHTML =
        "🔥 Excellent Work!";

    } else if (
      percentage >= 90 &&
      percentage < 100
    ) {

      resultReaction.innerHTML =
        "🚀 Outstanding Performance!";

    } else {

      resultReaction.innerHTML =
        "🏆 Perfect Score!";

    }

  }

  // ===============================
  // RESTART QUIZ
  // ===============================

  restartQuizBtn.addEventListener("click", () => {

    resultScreen.classList.remove("active");

    homeScreen.classList.add("active");

  });

  // ===============================
  // SHUFFLE ARRAY
  // ===============================

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

    return array;

  }

  // ===============================
  // DARK MODE
  // ===============================

  themeToggle.addEventListener("click", () => {

    document.body.classList.toggle(
      "dark-mode"
    );

    const icon =
      themeToggle.querySelector("i");

    if (
      document.body.classList.contains(
        "dark-mode"
      )
    ) {

      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");

    } else {

      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");

    }

  });

});