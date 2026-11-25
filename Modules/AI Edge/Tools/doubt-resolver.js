(() => {
  const byId = (id) => document.getElementById(id);
  const form = byId("doubt-form");
  const question = byId("doubt-question");
  const send = byId("doubt-send");
  const voice = byId("doubt-voice");
  const math = byId("doubt-math");
  const symbols = byId("doubt-symbols");
  const feedback = byId("doubt-feedback");
  const answer = byId("doubt-answer");
  const examples = {
    photosynthesis: {
      question: "Explain photosynthesis in simple biological terms.",
      answer: "Plants use energy from sunlight to turn water and carbon dioxide into sugar. The green pigment chlorophyll captures the light, and the plant releases oxygen during the process."
    },
    equation: {
      question: "Solve for x in 3x + 7 = 19, step by step.",
      answer: "Subtract 7 from both sides to get 3x = 12.\nDivide both sides by 3 to get x = 4.\nCheck by substituting 4 into the original equation. 3 × 4 + 7 = 19."
    }
  };

  function updateQuestion() {
    send.disabled = !question.value.trim();
    feedback.textContent = "";
    answer.hidden = true;
  }

  question.addEventListener("input", updateQuestion);
  document.querySelectorAll(".doubt-example").forEach((button) => {
    button.addEventListener("click", () => {
      question.value = examples[button.dataset.example].question;
      updateQuestion();
      question.focus();
    });
  });

  math.addEventListener("click", () => {
    symbols.hidden = !symbols.hidden;
    math.setAttribute("aria-expanded", String(!symbols.hidden));
  });

  symbols.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    question.setRangeText(button.textContent, question.selectionStart, question.selectionEnd, "end");
    updateQuestion();
    question.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = question.value.trim();
    if (!text) return;
    const example = Object.values(examples).find((entry) => entry.question === text);
    if (!example) {
      feedback.textContent = "Answers to custom questions require a connected AI service.";
      return;
    }
    byId("doubt-answer-text").textContent = example.answer;
    answer.hidden = false;
    byId("doubt-answer-title").focus();
  });

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voice.addEventListener("click", () => {
      feedback.textContent = "Voice input is unavailable in this browser. Type your question instead.";
    });
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = document.documentElement.lang || "en";
  recognition.onstart = () => {
    voice.setAttribute("aria-pressed", "true");
    feedback.textContent = "Listening…";
  };
  recognition.onend = () => {
    voice.setAttribute("aria-pressed", "false");
    if (feedback.textContent === "Listening…") feedback.textContent = "";
  };
  recognition.onerror = () => {
    feedback.textContent = "Voice input was interrupted. Try again or type your question.";
  };
  recognition.onresult = (event) => {
    question.value = event.results[0][0].transcript;
    updateQuestion();
    question.focus();
  };
  voice.addEventListener("click", () => {
    try {
      if (voice.getAttribute("aria-pressed") === "true") recognition.stop();
      else recognition.start();
    } catch {
      feedback.textContent = "Voice input is unavailable. Try again or type your question.";
    }
  });
})();
