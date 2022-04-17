function findParent(el, pred) {
  while ((el = el.parentElement) && !pred(el));
  return el;
}

function findParentTag(el, tagName) {
  return findParent(el, function(el) { return el.tagName.toLowerCase() == tagName })
}

Array.prototype.shuffle = function() {
  return this.sort(function() {
    return Math.random() > 0.5 ? 1 : -1;
  });
}

function onAnswerChange(e) {
  var target = e.target;
  if (section = findParentTag(target, 'section')) {
    section.querySelectorAll('li').forEach(function(li) {
      li.classList.remove('incorrect');
      li.classList.remove('correct');

      var input = li.querySelector('input');
      if (input.checked) {
        var incorrect = input.value == '0';
        li.classList.add(incorrect ? 'incorrect' : 'correct');
        if (incorrect && (explanation = section.querySelector('p.explanation'))) {
          explanation.style.display = 'block';
        }
      }
    });
  }
}

function renderAnswer(answer, id, type) {
  var el = document.createElement('li');

  var input = document.createElement('input');
  input.type = type;
  input.name = id;
  input.value = answer.correct ? '1' : '0';
  input.addEventListener('change', onAnswerChange);

  var label = document.createElement('label');
  label.appendChild(input);
  label.append(' ');
  label.append(answer.text);

  el.appendChild(label);

  return el;
}

function questionType(record) {
  return record.answers.filter(function(answer) {
    return answer.correct;
  }).length > 1 ? 'checkbox' : 'radio';
}

function renderQuestion(record) {
  var section = document.createElement('section');

  var question = document.createElement('h3');
  question.textContent = record.question;
  section.appendChild(question);

  var list = document.createElement('ul');
  section.appendChild(list);

  var type = questionType(record);

  record.answers.shuffle().forEach(function(answer) {
    list.appendChild(renderAnswer(answer, record.id, type));
  });

  if (record.explanation) {
    var explanation = document.createElement('p');
    explanation.classList.add('explanation');
    explanation.textContent = record.explanation;
    section.appendChild(explanation);
    explanation.style.display = 'none';
  }

  return section;
}

function renderQuestions(questions) {
  var testContainer = document.getElementById('test-container');
  testContainer.textContent = '';
  questions.forEach(function(q) {
    testContainer.appendChild(renderQuestion(q));
  });
}

function randomTest() {
  Questions.shuffle();
  renderQuestions(Questions.slice(0, 24));
}

randomTest()

document.getElementById('restart').addEventListener('click', function(){
  randomTest();
  window.scrollTo(0, 0);
});
