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
    section.querySelectorAll('li').forEach(function(e) {
      e.classList.remove('incorrect');
      e.classList.remove('correct');
    });
    
    if (target.checked) {
      var incorrect = target.value == '0';
      findParentTag(target, 'li').classList.add(incorrect ? 'incorrect' : 'correct');
      if (incorrect && (explanation = section.querySelector('p.explanation'))) {
        explanation.style.display = 'block';
      }
    }
  }
}

function renderAnswer(answer, id) {
  var el = document.createElement('li');

  var input = document.createElement('input');
  input.type = 'radio';
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

function renderQuestion(record) {
  var section = document.createElement('section');

  var question = document.createElement('h3');
  question.textContent = record.question;
  section.appendChild(question);

  var list = document.createElement('ul');
  section.appendChild(list);

  record.answers.shuffle().forEach(function(answer) {
    list.appendChild(renderAnswer(answer, record.id));
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
