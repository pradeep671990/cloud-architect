let selectedQuestions = [];
let currentQuestion = 0;
let userAnswers = [];
let startTime;
let totalTime = 10 * 60;
let timerInterval;


/* =========================
   SHUFFLE ARRAY
========================= */

function shuffleArray(array) {

  for (let i = array.length - 1; i > 0; i--) {

    const j =
      Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] =
      [array[j], array[i]];
  }

  return array;
}


/* =========================
   START QUIZ
========================= */

async function startQuiz() {

  const studentName =
    document.getElementById('studentName').value;

  if (studentName.trim() === "") {

    alert("Please enter student name");

    return;
  }

  document.getElementById('quiz').innerHTML = "";

  document.getElementById('result').innerHTML = "";

  clearInterval(timerInterval);

  const limit =
    parseInt(
      document.getElementById('questionLimit').value
    );

  const selectedCategory =
    document.getElementById('categorySelect').value;


  /* =========================
     TIMER
  ========================= */

  totalTime = limit * 60;

  const totalMinutes = limit;


  /* =========================
     WARNING MESSAGE
  ========================= */

  const warningMessage = `

You will get:

✔ 1 minute for each question
✔ Total Time: ${totalMinutes} Minutes
✔ No negative marking

Click OK to start quiz.

`;

  const confirmStart =
    confirm(warningMessage);

  if (!confirmStart) return;

  startTime = new Date();

  let loadedQuestions = [];


  /* =========================
     LOAD QUESTIONS
  ========================= */

  if (selectedCategory === "all") {

    const files = [

      'aws/questions.json',

      'gcp/questions.json',

      'azure/questions.json',

      'cicd/questions.json',

      'security/questions.json',

      'terraform/questions.json',

      'k8s/questions.json'
    ];

    for (const file of files) {

      const response =
        await fetch(file);

      const data =
        await response.json();

      loadedQuestions =
        loadedQuestions.concat(data);
    }

  }

  else {

    const response =
      await fetch(selectedCategory);

    loadedQuestions =
      await response.json();
  }


  /* =========================
     RANDOMIZE QUESTIONS
  ========================= */

  selectedQuestions =
    shuffleArray(loadedQuestions)
    .slice(
      0,
      Math.min(limit, loadedQuestions.length)
    );


  /* =========================
     RESET TRACKING
  ========================= */

  currentQuestion = 0;

  userAnswers = [];


  /* =========================
     LOAD QUESTIONS
  ========================= */

  loadQuestions();

  startTimer();
}


/* =========================
   LOAD SINGLE QUESTION
========================= */

function loadQuestions() {

  const quizDiv =
    document.getElementById('quiz');

  quizDiv.innerHTML = "";

  document.getElementById('questionCount').innerHTML =
    `Question ${currentQuestion + 1}
     of ${selectedQuestions.length}`;

  const q =
    selectedQuestions[currentQuestion];

  const options =
    shuffleArray([...q.options]);

  let html = `

    <div class="question">

      <p>

        <b>
          Q${currentQuestion + 1}.
          ${q.question}
        </b>

      </p>
  `;

  options.forEach((option, i) => {

    const checked =
      userAnswers[currentQuestion] === option
      ? 'checked'
      : '';

    html += `

      <label>

        <input
          type="radio"
          name="question"
          value="${option.replace(/"/g, '&quot;')}"
          data-option="${i}"
          ${checked}
        >

        ${option}

      </label>

      <br>
    `;
  });

  html += `</div>`;

  quizDiv.innerHTML = html;


  /* =========================
     ATTACH EVENT LISTENERS
  ========================= */

  quizDiv
    .querySelectorAll('input[type="radio"]')
    .forEach(input => {

      input.addEventListener(
        'change',
        () => saveAnswer(input.value)
      );

    });

  updateProgressBar();
}


/* =========================
   SAVE ANSWER
========================= */

function saveAnswer(answer) {

  userAnswers[currentQuestion] = answer;
}


/* =========================
   NEXT QUESTION
========================= */

function nextQuestion() {

  if (
    currentQuestion <
    selectedQuestions.length - 1
  ) {

    currentQuestion++;

    loadQuestions();
  }
}


/* =========================
   PREVIOUS QUESTION
========================= */

function previousQuestion() {

  if (currentQuestion > 0) {

    currentQuestion--;

    loadQuestions();
  }
}


/* =========================
   PROGRESS BAR
========================= */

function updateProgressBar() {

  const progress =
    (
      (currentQuestion + 1)
      / selectedQuestions.length
    ) * 100;

  const progressBar =
    document.getElementById('progressBar');

  progressBar.style.width =
    `${progress}%`;

  progressBar.innerHTML =
    `${Math.round(progress)}%`;
}


/* =========================
   TIMER
========================= */

function startTimer() {

  timerInterval = setInterval(() => {

    const minutes =
      Math.floor(totalTime / 60);

    const seconds =
      String(totalTime % 60)
      .padStart(2, '0');

    document.getElementById('timer').innerHTML =
      `Time Left: ${minutes}:${seconds}`;

    totalTime--;


    /* =========================
       AUTO SUBMIT
    ========================= */

    if (totalTime < 0) {

      clearInterval(timerInterval);

      alert(
        "Time is over! Quiz will be submitted automatically."
      );

      submitQuiz();
    }

  }, 1000);
}


/* =========================
   SUBMIT QUIZ
========================= */

function submitQuiz() {

  clearInterval(timerInterval);

  let score = 0;

  let resultHTML = "";

  const endTime = new Date();

  const timeTaken =
    Math.floor(
      (endTime - startTime) / 1000
    );

  const selectedCategory =
    document.getElementById('categorySelect').value;

  // SHOW EXPLANATION ONLY FOR MATHS

  const showExplanation =
    selectedCategory.includes("maths");

  selectedQuestions.forEach((q, index) => {

    const selected =
      userAnswers[index];

    /* =========================
       CORRECT ANSWER
    ========================= */

    if (selected) {

      if (selected === q.answer) {

        score++;

        resultHTML += `

          <div class="correct">

            ✅ Q${index + 1}: Correct

            ${showExplanation ? `

              <br><br>

              <b>Explanation:</b>

              ${q.explanation || "No explanation available."}

            ` : ""}

          </div>
        `;
      }

      /* =========================
         WRONG ANSWER
      ========================= */

      else {

        resultHTML += `

          <div class="wrong">

            ❌ Q${index + 1}: Wrong

            <br><br>

            <b>Your Answer:</b>
            ${selected}

            <br><br>

            <b>Correct Answer:</b>
            ${q.answer}

            ${showExplanation ? `

              <br><br>

              <b>Explanation:</b>

              ${q.explanation || "No explanation available."}

            ` : ""}

          </div>
        `;
      }

    }

    /* =========================
       NOT ATTEMPTED
    ========================= */

    else {

      resultHTML += `

        <div class="wrong">

          ⚠️ Q${index + 1}: Not Attempted

          <br><br>

          <b>Correct Answer:</b>
          ${q.answer}

          ${showExplanation ? `

            <br><br>

            <b>Explanation:</b>

            ${q.explanation || "No explanation available."}

          ` : ""}

        </div>
      `;
    }

  });


  /* =========================
     PERCENTAGE
  ========================= */

  const percentage =
    (
      (score / selectedQuestions.length) * 100
    ).toFixed(2);


  /* =========================
     REACTIONS
  ========================= */

  let reaction = "";

  const pct =
    parseFloat(percentage);

  if (pct < 55) {

    reaction =
      "😢 Fail! Keep practicing and try again.";

  }

  else if (pct < 75) {

    reaction =
      "🙂 Good Job! You can do even better.";

  }

  else if (pct < 90) {

    reaction =
      "😃 Very Good Performance!";

  }

  else if (pct < 100) {

    reaction =
      "🔥 Excellent Work! Outstanding Score!";
  }

  else {

    reaction =
      "🏆 PERFECT SCORE! GENIUS!";
  }


  /* =========================
     SAVE HISTORY
  ========================= */

  const studentName =
    document.getElementById('studentName').value;

  saveHistory({

    studentName: studentName,

    category: selectedCategory,

    score: score,

    total: selectedQuestions.length,

    percentage: percentage,

    timeTaken:
      `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`,

    date:
      new Date().toLocaleString()
  });


  /* =========================
     RESULT DISPLAY
  ========================= */

  document.getElementById('result').innerHTML = `

    <h2>
      Your Score:
      ${score}/${selectedQuestions.length}
    </h2>

    <h2>
      Percentage:
      ${percentage}%
    </h2>

    <h2>
      ${reaction}
    </h2>

    <h3>
      Time Taken:
      ${Math.floor(timeTaken / 60)}m
      ${timeTaken % 60}s
    </h3>

    <hr>

    ${resultHTML}
  `;
}


/* =========================
   SAVE HISTORY
========================= */

function saveHistory(data) {

  let history =
    JSON.parse(
      localStorage.getItem('quizHistory')
    ) || [];

  history.push(data);

  localStorage.setItem(
    'quizHistory',
    JSON.stringify(history)
  );

  loadHistory();
}


/* =========================
   LOAD HISTORY
========================= */

function loadHistory() {

  let history =
    JSON.parse(
      localStorage.getItem('quizHistory')
    ) || [];

  let html = "";

  [...history]
    .reverse()
    .forEach((item, index) => {

      html += `

        <div class="question">

          <p>
            <b>
              Attempt ${index + 1}
            </b>
          </p>

          <p>
            Student:
            <b>${item.studentName}</b>
          </p>

          <p>
            Category:
            ${item.category}
          </p>

          <p>
            Score:
            ${item.score}/${item.total}
          </p>

          <p>
            Percentage:
            ${item.percentage}%
          </p>

          <p>
            Time Taken:
            ${item.timeTaken}
          </p>

          <p>
            Date:
            ${item.date}
          </p>

        </div>
      `;
    });

  document.getElementById('history').innerHTML =
    html;
}


/* =========================
   LOAD HISTORY ON PAGE LOAD
========================= */

loadHistory();