const fs = require('fs');

function parseQuestions(fileText) {
  // Replace windows newlines and strip comments
  const contents = raw_contents.replace(/\r/g, "").replace(/^'.*$/gm, '').trim();
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
      question.a = answer_a;
      question.b = answer_b;
      question.c = answer_c;
      question.d = answer_d;
      question.reason = reason;

      section.questions.push(question);
    }

    questions.sections.push(section);
  }

  return questions;
}

// Questions from https://www.rac.ca/exhaminer-v2-5/
const raw_contents = fs.readFileSync('Questions_Basic.txt').toString();
console.log(JSON.stringify(parseQuestions(raw_contents)));
