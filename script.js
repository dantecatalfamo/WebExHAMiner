'ues strict';

const fileInput = document.getElementById("fileInput");
const fileError = document.getElementById("fileError");
// const questionSection = document.getElementById("questionSection");
const questionId = document.getElementById("questionId");
const questionText = document.getElementById("questionText");
const answerA = document.getElementById("answerA");
const answerB = document.getElementById("answerB");
const answerC = document.getElementById("answerC");
const answerD = document.getElementById("answerD");
const reason = document.getElementById("reason");
const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");
const answerEls = [answerA, answerB, answerC, answerD];
const correntEl = document.getElementById("correctValue");
const incorrentEl = document.getElementById("incorrectValue");
const unansweredEl = document.getElementById("unansweredValue");
const scoreEl = document.getElementById("scoreValue");

let allQuestions = null;
let examQuestions = [];
let questionHistory = [];
let questionHistoryIndex = -1;
let correctAnswers = 0;
let incorrectAnswers = 0;
let questionsLeft = 0;

fileInput.addEventListener('change', handleFileInput);
answerEls.forEach(answerEl => answerEl.addEventListener('click', handleAnswerClick));
nextButton.addEventListener('click', nextQuestion);
previousButton.addEventListener('click', previousQuestion);

async function handleFileInput(event) {
  try {
    const file = event.target.files[0];
    const text = await file.text();
    allQuestions = parseQuestions(text);
    allQuestions.sections.forEach(section => {
      examQuestions = examQuestions.concat(section.questions);
    });
    questionsLeft = examQuestions.length;
    nextQuestion();
  } catch (e) {
    console.error(`Unable to load questions: ${e}`);
    fileError.innerText = "Unable to load questions";
  }
}

function handleAnswerClick(event) {
  event.target.style.backgroundColor = "var(--bg-selected)";
  if (event.target.dataset.correct) {
    correctAnswers++;
  } else {
    incorrectAnswers++;
  }
  questionsLeft--;
  answerEls.forEach(answerEl => {
    answerEl.disabled = true;
    if (answerEl.dataset.correct) {
      answerEl.style.backgroundColor = "var(--bg-correct)";
    }
  });
  reason.style.display = "block";
  questionHistory[questionHistoryIndex].selected = event.target.dataset.option;
}

function nextQuestion() {
  if (examQuestions.length == 0) {
    // score
  } else if (questionHistoryIndex == questionHistory.length - 1) {
    questionHistory.push(examQuestions.shift());
    questionHistoryIndex++;
  } else {
    questionHistoryIndex++;
  }
  displayQuestion();
}

function previousQuestion() {
  if (questionHistoryIndex > 0) {
    questionHistoryIndex--;
    displayQuestion();
  }
}

function displayQuestion() {
  const q = questionHistory[questionHistoryIndex];
  if (q)
    setQuestion(q);
}

function setQuestion(question) {
  questionId.innerText = question.id;
  questionText.innerText = question.text;
  answerA.innerText = question.options.a;
  answerB.innerText = question.options.b;
  answerC.innerText = question.options.c;
  answerD.innerText = question.options.d;
  reason.innerText = question.reason;
  answerEls.forEach(answerEl => {
    answerEl.style = {};
    answerEl.disabled = false;
    if (answerEl.dataset.option == question.answer) {
      answerEl.dataset.correct = "true";
    } else {
      answerEl.dataset.correct = "";
    }
  });
  reason.style.display = "none";

  // Already answered
  if (question.selected) {
    answerEls.forEach(answerEl => {
      answerEl.disabled = true;
      if (answerEl.dataset.option == question.answer) {
        answerEl.style.backgroundColor = "var(--bg-selected)";
      }
      if (answerEl.dataset.correct) {
        answerEl.style.backgroundColor = "var(--bg-correct)";
      }
    });
    reason.style.display = "block";
  }
}

function parseQuestions(fileText) {
  // Replace windows newlines and strip comments
  const contents = fileText.replace(/\r/g, "").replace(/^'.*$/gm, '').trim();
  const header = contents.match(/^\^.*$/m)[0];
  const header_split = header.split("^");
  const answer_designation = header_split[4];

  const questions = {};

  questions.name = header_split[1].trim();
  questions.num_questions = header_split[2].trim();
  questions.pass_mark = header_split[3].trim();

  questions.sections = [];
  // Split sections and remove header
  const sections = contents.split(/({\w+}) ([^\n]+)/gm).slice(1);

  for (let section_idx = 0; section_idx < sections.length / 3; section_idx++) {
    const section = {};

    const section_id = sections[section_idx * 3].replace(/[{}]/g, '');
    const section_name = sections[section_idx * 3 + 1];
    const section_body = sections[section_idx * 3 + 2];

    section.id = section_id;
    section.name = section_name;
    section.questions = [];

    const body_lines = section_body.trim().replace("\n\n", "\n").split("\n");
    for (let body_idx = 0; body_idx < body_lines.length / 6; body_idx++) {
      const question = {};

      const question_header = body_lines[body_idx * 6];
      const question_parts = question_header.match(/([\w\-]+) \((\w)\) (.*)/);
      const question_id = question_parts[1];
      const question_answer = question_parts[2];
      const question_text = question_parts[3];

      const answer_a = body_lines[body_idx * 6 + 1].slice(2);
      const answer_b = body_lines[body_idx * 6 + 2].slice(2);
      const answer_c = body_lines[body_idx * 6 + 3].slice(2);
      const answer_d = body_lines[body_idx * 6 + 4].slice(2);
      const reason = body_lines[body_idx * 6 + 5].slice(2);

      question.id = question_id;
      question.answer = question_answer;
      question.text = question_text;
      question.options = {};
      question.options.a = answer_a;
      question.options.b = answer_b;
      question.options.c = answer_c;
      question.options.d = answer_d;
      question.selected = null;
      question.reason = reason;

      section.questions.push(question);
    }

    questions.sections.push(section);
  }

  return questions;
}

// Questions from https://www.rac.ca/exhaminer-v2-5/
