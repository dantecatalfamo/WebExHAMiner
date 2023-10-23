// Copyright (c) 2023 Dante Catalfamo

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

fileInput.addEventListener('change', handleFileInput);
answerEls.forEach(answerEl => answerEl.addEventListener('click', handleAnswerClick));
nextButton.addEventListener('click', nextQuestion);
previousButton.addEventListener('click', previousQuestion);

function selectQuestions(parsedInput) {
  let allQuestions = [];
  parsedInput.sections.forEach(section => {
    allQuestions = allQuestions.concat(section.questions);
  });
  const buckets = {};
  allQuestions.forEach(question => {
    var bucketName = `${question.id_parts.type}-${question.id_parts.section.toString().padStart(2, 0)}-${question.id_parts.subsection.toString().padStart(2, 0)}`;
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
    questionHistory = selectQuestions(parsedInput);
    questionHistoryIndex = -1;
    nextQuestion();
  } catch (e) {
    console.error(`Unable to load questions: ${e}`);
    fileError.innerText = "Unable to load questions";
    throw(e);
  }
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
  const q = questionHistory[questionHistoryIndex];
  if (q)
    setQuestion(q);
}

function setQuestion(question) {
  correctValue.innerText = correctAnswers;
  incorrectValue.innerText = incorrectAnswers;
  unansweredValue.innerText = questionHistory.length - correctAnswers - incorrectAnswers;
  const scoreFloat = correctAnswers * 100 / (correctAnswers + incorrectAnswers);
  scoreValue.innerText = `${(scoreFloat || 0).toFixed()}%`;
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

    const body_lines = section_body.trim().split("\n").filter(line => line.length != 0);
    for (let body_idx = 0; body_idx < body_lines.length / 6; body_idx++) {
      const question = {};

      const question_header = body_lines[body_idx * 6];
      const question_parts = question_header.match(/([\w\-]+) \((\w)\) (.*)/);
      if (!question_parts) {
        console.log(body_lines.slice(body_idx * 6 - 5, body_idx * 6 + 10));
        console.log(question_header);
      }
      const question_id = question_parts[1];
      const question_answer = question_parts[2];
      const question_text = question_parts[3];

      const id_parts = question_id.split("-");
      const question_type = id_parts[0];
      const question_section = parseInt(id_parts[1]);
      const question_subsection = parseInt(id_parts[2]);
      const question_variant = parseInt(id_parts[3]);

      const answer_a = body_lines[body_idx * 6 + 1].slice(2);
      const answer_b = body_lines[body_idx * 6 + 2].slice(2);
      const answer_c = body_lines[body_idx * 6 + 3].slice(2);
      const answer_d = body_lines[body_idx * 6 + 4].slice(2);
      const reason = body_lines[body_idx * 6 + 5].slice(2);

      question.id = question_id;
      question.id_parts = {};
      question.id_parts.type = question_type;
      question.id_parts.section = question_section;
      question.id_parts.subsection = question_subsection;
      question.id_parts.variant = question_variant;
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
