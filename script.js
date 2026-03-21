// Copyright (c) 2026 Dante Catalfamo

// This program is free software: you can redistribute it and/or
// modify it under the terms of the GNU General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.

// This program is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program. If not, see
// <https://www.gnu.org/licenses/>.

'ues strict';

const fileInput = document.getElementById("fileInput");
const restartButton = document.getElementById("restart")
const eraseButton = document.getElementById("erase");
const randomizeButtion = document.getElementById("randomize");
const buttons = document.getElementById("buttons");
const fileEl = document.getElementById("file");
const fileError = document.getElementById("fileError");
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
const correctValue = document.getElementById("correctValue");
const incorrectValue = document.getElementById("incorrectValue");
const unansweredValue = document.getElementById("unansweredValue");
const scoreValue = document.getElementById("scoreValue");

let questionHistory = [];
let questionHistoryIndex = -1;
let correctAnswers = 0;
let incorrectAnswers = 0;
let passingMark = 0;

fileInput.addEventListener('change', handleFileInput);
restartButton.addEventListener('click', handleRestartExam);
eraseButton.addEventListener('click', eraseData);
randomizeButtion.addEventListener('click', randomizeOrder);
answerEls.forEach(answerEl => answerEl.addEventListener('click', handleAnswerClick));
nextButton.addEventListener('click', nextQuestion);
previousButton.addEventListener('click', previousQuestion);

if (localStorage["questionHistory"]) {
  questionHistory = JSON.parse(localStorage["questionHistory"]);
  questionHistoryIndex = JSON.parse(localStorage["questionHistoryIndex"]);
  passingMark = JSON.parse(localStorage["passingMark"]);
  questionHistory.forEach(question => {
    if (question.selected == null) {
      return;
    }
    if (question.selected == question.answer) {
      correctAnswers++;
    } else {
      incorrectAnswers++;
    }
  });
  if (questionHistory && questionHistory.length != 0) {
    displayQuestion();
  }
} else {
  fileEl.style.display = undefined;
  buttons.style.display = "none";
}

function eraseData() {
  if (questionHistory.length != 0 && !confirm("Erase exam data? This will remove all questions.")) {
    return;
  }
  questionHistory = [];
  questionHistoryIndex = -1;
  correctAnswers = 0;
  incorrectAnswers = 0;
  passingMark = 0;
  fileError.innerText = "";
  localStorage.removeItem("passingMark");
  localStorage.removeItem("questionHistory");
  localStorage.removeItem("questionHistoryIndex");
  localStorage.removeItem("parsedInput");
  location.reload();
}

function handleRestartExam() {
  if (questionHistory.length != 0 && !confirm("Restart exam?")) {
    return;
  }
  restartExam();
}

function randomizeOrder() {
  shuffleArray(questionHistory);
  questionHistoryIndex = 0;
  displayQuestion();
}

// https://stackoverflow.com/a/12646864
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function selectQuestions(parsedInput) {
  let allQuestions = [];
  parsedInput.sections.forEach(section => {
    allQuestions = allQuestions.concat(section.questions);
  });
  const buckets = {};
  allQuestions.forEach(question => {
    var bucketName = `${question.idParts.type}-${question.idParts.section.toString().padStart(2, 0)}-${question.idParts.subsection.toString().padStart(2, 0)}`;
    buckets[bucketName] ||= [];
    buckets[bucketName].push(question);
  });
  const outputQuestions = [];
  const bucketKeys = Object.keys(buckets).sort();
  bucketKeys.forEach(key => {
    const bucket = buckets[key];
    outputQuestions.push(bucket[Math.floor(Math.random()*bucket.length)]);
  });
  return outputQuestions;
}

async function handleFileInput(event) {
  fileError.innerText = "";
  try {
    const file = event.target.files[0];
    const text = await file.text();
    const parsedInput = parseQuestions(text);
    passingMark = parsedInput.passMark;
    localStorage["parsedInput"] = JSON.stringify(parsedInput);
    restartExam();
  } catch (e) {
    console.error(`Unable to load questions: ${e}`);
    fileError.innerText = "Unable to load questions";
    throw(e);
  }
}

function restartExam() {
  const parsedInput = JSON.parse(localStorage["parsedInput"]);
    questionHistory = selectQuestions(parsedInput);
    questionHistoryIndex = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    displayQuestion();
}

function handleAnswerClick(event) {
  const question = questionHistory[questionHistoryIndex];
  question.selected = event.target.dataset.option;
  if (question.selected == question.answer) {
    correctAnswers++;
  } else {
    incorrectAnswers++;
  }
  displayQuestion();
}

function nextQuestion() {
  if (questionHistoryIndex < questionHistory.length) {
    questionHistoryIndex++;
    displayQuestion();
  }
}

function previousQuestion() {
  if (questionHistoryIndex > 0) {
    questionHistoryIndex--;
    displayQuestion();
  }
}

function displayQuestion() {
  const question = questionHistory[questionHistoryIndex];
  localStorage["questionHistory"] = JSON.stringify(questionHistory);
  localStorage["questionHistoryIndex"] = questionHistoryIndex;
  localStorage["passingMark"] = passingMark;
  fileEl.style.display = "none"
  buttons.style.display = "";
  setQuestion(question);
}

function setQuestion(question) {
  correctValue.innerText = correctAnswers;
  incorrectValue.innerText = incorrectAnswers;
  const unansweredQuestions = questionHistory.length - correctAnswers - incorrectAnswers;
  unansweredValue.innerText = unansweredQuestions == 0 ? "Completed" : unansweredQuestions;
  const scoreFloat = (correctAnswers * 100 / (correctAnswers + incorrectAnswers)) || 0;
  const passing = scoreFloat >= passingMark;
  scoreValue.style.color = passing ? "" : "var(--fg-error)";
  scoreValue.innerText = `${scoreFloat.toFixed()}%`;
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
  });
  reason.style.display = "none";

  // Already answered
  if (question.selected) {
    answerEls.forEach(answerEl => {
      answerEl.disabled = true;
      if (answerEl.dataset.option == question.selected) {
        answerEl.style.backgroundColor = "var(--bg-selected)";
      }
      if (answerEl.dataset.option == question.answer) {
        answerEl.style.backgroundColor = "var(--bg-correct)";
      }
    });
    reason.style.display = "block";
  }

  previousButton.disabled = questionHistoryIndex < 1;
  nextButton.disabled = questionHistoryIndex >= questionHistory.length - 1;
}

function parseQuestions(fileText) {
  // Replace windows newlines and strip comments
  const contents = fileText.replace(/\r/g, "").replace(/^'.*$/gm, '').trim();
  const header = contents.match(/^\^.*$/m)[0];
  const headerSplit = header.split("^");
  const formatVersion = headerSplit[5].trim();

  if (formatVersion !== "V2") {
    console.error("Questions are not in V2 format")
  }

  const questions = {};

  questions.name = headerSplit[1].trim();
  questions.numQuestions = headerSplit[2].trim();
  questions.passMark = headerSplit[3].trim();

  questions.sections = [];
  // Split sections and remove header
  const sections = contents.split(/({\w+}) ([^\n]+)/gm).slice(1);

  for (let sectionIdx = 0; sectionIdx < sections.length / 3; sectionIdx++) {
    const section = {};

    const sectionId = sections[sectionIdx * 3].replace(/[{}]/g, '');
    const sectionName = sections[sectionIdx * 3 + 1];
    const sectionBody = sections[sectionIdx * 3 + 2];

    section.id = sectionId;
    section.name = sectionName;
    section.questions = [];


    const bodyLines = sectionBody.trim().split("\n").filter(line => line.length != 0);
    for (let bodyIdx = 0; bodyIdx < bodyLines.length / 7; bodyIdx++) {
      const question = {};

      const questionId = bodyLines[bodyIdx * 7].split(/\s+/)[0];
      const questionText = bodyLines[bodyIdx * 7 + 1]
      const answerCorrect = bodyLines[bodyIdx * 7 + 2]
      const answerOther1 = bodyLines[bodyIdx * 7 + 3]
      const answerOther2 = bodyLines[bodyIdx * 7 + 4]
      const answerOther3 = bodyLines[bodyIdx * 7 + 5]
      // Strip "> "
      const reason = bodyLines[bodyIdx * 7 + 6].slice(2)

      const idParts = questionId.split("-");
      const questionType = idParts[0];
      const questionSection = parseInt(idParts[1]);
      const questionSubsection = parseInt(idParts[2]);
      const questionVariant = parseInt(idParts[3]);

      let answerKeys = ["a", "b", "c", "d"]
      shuffleArray(answerKeys);
      const correctKey = answerKeys.shift()
      const other1Key = answerKeys.shift()
      const other2Key = answerKeys.shift()
      const other3Key = answerKeys.shift()

      question.id = questionId;
      question.idParts = {};
      question.idParts.type = questionType;
      question.idParts.section = questionSection;
      question.idParts.subsection = questionSubsection;
      question.idParts.variant = questionVariant;
      question.answer = correctKey;
      question.text = questionText;
      question.options = {};
      question.options[correctKey] = answerCorrect;
      question.options[other1Key] = answerOther1;
      question.options[other2Key] = answerOther2;
      question.options[other3Key] = answerOther3;
      question.selected = null;
      question.reason = reason;

      section.questions.push(question);
    }

    questions.sections.push(section);
  }

  return questions;
}

// Questions from https://www.rac.ca/exhaminer-v2-5/
