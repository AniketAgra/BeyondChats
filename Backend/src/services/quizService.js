function makeMcq(idx, topic) {
  const options = ['Option A', 'Option B', 'Option C', 'Option D'];
  const answerIndex = idx % 4;
  return {
    id: `q${idx + 1}`,
    type: 'MCQ',
    question: `What is a key concept of ${topic || 'this chapter'}?`,
    options,
    answerIndex,
    explanation: `The chapter emphasizes ${options[answerIndex]}.`
  };
}

export async function generateQuiz({ text, difficulty, types, topic }) {
  const count = 10;
  const questions = Array.from({ length: count }).map((_, i) => makeMcq(i, topic));
  return { difficulty, types, topic, questions };
}

export async function submitQuiz({ questions, responses }) {
  let correct = 0;
  questions.forEach((q, idx) => {
    if (q.type === 'MCQ' && responses[idx] === q.answerIndex) correct += 1;
  });
  const score = Math.round((correct / questions.length) * 100);
  return { score, correct, total: questions.length };
}
