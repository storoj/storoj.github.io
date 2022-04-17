// to get questions from https://lifeintheuktestweb.co.uk

console.log(JSON.stringify((function() {
  var res = [];
  document.querySelectorAll('li.wpProQuiz_listItem').forEach(function(el){
    var questionList = el.querySelector('.wpProQuiz_questionList');
    var id = questionList.dataset['question_id'];
    var correct = wpProQuizInitList[0].init.json[id].correct;
    var answers = [];
    questionList.querySelectorAll('.wpProQuiz_questionListItem').forEach(function(item) {
      answers.push({
        text: item.querySelector('label').innerText.trim(),
        correct: Boolean(correct[item.dataset['pos']]),
      });
    });

    res.push({
      id: id,
      question: el.querySelector('.wpProQuiz_question_text > p > strong').innerText,
      answers: answers,
      explanation: el.querySelector('.wpProQuiz_incorrect p').textContent.trim(),
    });
  });
  return res;
})()))
