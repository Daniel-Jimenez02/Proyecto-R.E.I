const state = {
  topics: [],
  quizzes: {},
  selectedTopicId: "",
  quizIndex: {},
  quizAnswered: {},
  knowledgeBase: null,
  curriculum: null,
  nluModel: null,
  conversation: {
    turns: [],
    lastIntent: "",
    lastTopic: "",
    lastLearningKey: ""
  },
  selectedGradeId: "",
  selectedAreaId: "",
  selectedLearningKey: "",
  activeGame: "memory",
  games: {
    learningKey: "",
    memoryCards: [],
    memoryOpen: [],
    memoryMatched: [],
    orderSource: [],
    orderPool: [],
    orderAnswer: [],
    orderDone: false,
    quickOptions: [],
    quickSelected: ""
  }
};

const topicGrid = document.querySelector("#topicGrid");
const topicDetail = document.querySelector("#topicDetail");
const askForm = document.querySelector("#askForm");
const questionInput = document.querySelector("#questionInput");
const chatLog = document.querySelector("#chatLog");
const aiStatus = document.querySelector("#aiStatus");
const gradeSelect = document.querySelector("#gradeSelect");
const areaSelect = document.querySelector("#areaSelect");
const learningSelect = document.querySelector("#learningSelect");
const learningInfo = document.querySelector("#learningInfo");
const miniGames = document.querySelector("#miniGames");

const STOP_WORDS = new Set([
  "a", "al", "algo", "como", "con", "cual", "cuando", "de", "del",
  "dime", "el", "ella", "en", "es", "eso", "esta", "estan", "este",
  "la", "las", "lo", "los", "me", "para", "por", "que", "quien",
  "se", "sobre", "son", "su", "sus", "un", "una", "unas", "unos", "y"
]);

const AREA_ALIASES = {
  "lengua castellana": "lenguaje",
  "espanol": "lenguaje",
  "español": "lenguaje",
  "lectura": "lenguaje",
  "matematica": "matematicas",
  "matematicas": "matematicas",
  "matemáticas": "matematicas",
  "naturales": "ciencias-naturales",
  "ciencias": "ciencias-naturales",
  "biologia": "ciencias-naturales",
  "biología": "ciencias-naturales",
  "sociales": "ciencias-sociales",
  "historia": "ciencias-sociales",
  "geografia": "ciencias-sociales",
  "geografía": "ciencias-sociales",
  "ingles": "ingles",
  "inglés": "ingles"
};

function resolveAssetPath(path) {
  if (window.location.protocol === "file:" && path.startsWith("/assets/")) {
    return `..${path}`;
  }
  return path;
}

async function loadJson(primaryPath, fallbackPath) {
  try {
    const response = await fetch(primaryPath, { cache: "no-store" });
    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    console.warn("No se pudo cargar", primaryPath, error);
  }

  const fallbackResponse = await fetch(fallbackPath, { cache: "no-store" });
  return fallbackResponse.json();
}

function cleanText(text, removeCommonWords = true) {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!removeCommonWords) {
    return normalized;
  }

  return normalized
    .split(" ")
    .filter((word) => word && !STOP_WORDS.has(word))
    .join(" ");
}

function detectIntent(question) {
  const normalized = cleanText(question, false);
  if (normalized.includes("que es") || normalized.includes("que son")) return "definicion";
  if (normalized.includes("porque") || normalized.includes("por que")) return "explicacion";
  if (normalized.includes("cuanto") || normalized.includes("cuantos")) return "cantidad";
  if (normalized.includes("donde")) return "ubicacion";
  return "general";
}

function keywordScore(cleanQuestion, keyword) {
  const cleanKeyword = cleanText(keyword);
  if (!cleanKeyword) return 0;
  if (cleanQuestion.includes(cleanKeyword)) {
    return cleanKeyword.includes(" ") ? 4 : 3;
  }

  return cleanKeyword
    .split(" ")
    .filter((word) => word.length > 2 && cleanQuestion.includes(word))
    .length;
}

function inferRelatedTopic(cleanQuestion) {
  if (["estrella", "planeta", "luna", "sol"].some((word) => cleanQuestion.includes(word))) {
    return "espacio";
  }
  if (["animal", "mamifero", "ave", "pez"].some((word) => cleanQuestion.includes(word))) {
    return "animales";
  }
  if (["cuerpo", "hueso", "corazon", "cerebro"].some((word) => cleanQuestion.includes(word))) {
    return "cuerpo-humano";
  }
  return "";
}

function learningMatchesTopic(selected, topicId) {
  if (!selected || !topicId) return false;
  const text = cleanText(`${selected.text} ${selected.path.student_goal || ""} ${(selected.path.keywords || []).join(" ")}`, false);

  const topicSignals = {
    "espacio": ["espacio", "sistema solar", "sol", "luna", "planeta", "estrella"],
    "animales": ["animal", "animales", "ser vivo", "seres vivos", "planta", "ecosistema", "habitat", "adaptacion", "ambiente"],
    "cuerpo-humano": ["cuerpo", "humano", "sistema", "organo", "organos", "corazon", "cerebro", "pulmon", "hueso", "salud"]
  };

  return (topicSignals[topicId] || []).some((signal) => text.includes(cleanText(signal, false)));
}

function rememberTurn(role, text, meta = {}) {
  state.conversation.turns.push({
    role,
    text,
    meta,
    at: Date.now()
  });
  state.conversation.turns = state.conversation.turns.slice(-8);
}

function chooseTemplate(intent) {
  const modelIntent = state.nluModel?.intents?.find((item) => item.id === intent);
  const templates = modelIntent?.templates || [];
  if (!templates.length) {
    return "Puedo ayudarte con el aprendizaje seleccionado: {learning}.";
  }
  return templates[Math.floor(Math.random() * templates.length)];
}

function fillTemplate(template, selected) {
  const evidence = selected?.path.evidence_examples?.join(" ") ||
    "Explica el aprendizaje con tus propias palabras.";
  const learning = (selected?.text || "el aprendizaje seleccionado").replace(/[.。]+$/, "");
  return template
    .replaceAll("{learning}", learning)
    .replaceAll("{student_goal}", selected?.path.student_goal || "puedes explicar la idea con ejemplos de tu contexto")
    .replaceAll("{activity}", selected?.path.rei_activity || "lee el aprendizaje, juega un minijuego y escribe una respuesta corta")
    .replaceAll("{evidence}", evidence)
    .replaceAll("{grade}", selected?.path.grade || "el grado seleccionado")
    .replaceAll("{area}", selected?.path.area || "el área seleccionada");
}

function detectNluIntent(question) {
  const normalized = cleanText(question, false);
  let best = { id: "desconocido", score: 0 };

  for (const intent of state.nluModel?.intents || []) {
    let score = 0;
    for (const pattern of intent.patterns || []) {
      const cleanPattern = cleanText(pattern, false);
      if (cleanPattern && normalized.includes(cleanPattern)) {
        score += cleanPattern.length > 8 ? 3 : 2;
      }
    }

    if (score > best.score) {
      best = { id: intent.id, score };
    }
  }

  if (best.score > 0) return best.id;
  return detectIntent(question);
}

function extractGradeFromText(question) {
  const normalized = cleanText(question, false);
  if (normalized.includes("transicion") || normalized.includes("transición")) return "transicion";

  const digitMatch = normalized.match(/\b(1|2|3|4|5|6|7|8|9|10|11)\b/);
  if (digitMatch) return digitMatch[1];

  const words = {
    primero: "1",
    segundo: "2",
    tercero: "3",
    cuarto: "4",
    quinto: "5",
    sexto: "6",
    septimo: "7",
    séptimo: "7",
    octavo: "8",
    noveno: "9",
    decimo: "10",
    décimo: "10",
    once: "11",
    undecimo: "11",
    undécimo: "11"
  };

  return Object.entries(words).find(([word]) => normalized.includes(word))?.[1] || "";
}

function extractAreaFromText(question) {
  const normalized = cleanText(question, false);

  for (const [alias, areaId] of Object.entries(AREA_ALIASES)) {
    if (normalized.includes(cleanText(alias, false))) {
      return areaId;
    }
  }

  return "";
}

function applyContextFromText(question) {
  const gradeId = extractGradeFromText(question);
  const areaId = extractAreaFromText(question);
  let changed = false;

  if (gradeId && state.curriculum?.grades?.some((grade) => grade.id === gradeId)) {
    state.selectedGradeId = gradeId;
    state.selectedAreaId = "";
    state.selectedLearningKey = "";
    changed = true;
  }

  if (areaId) {
    const gradeForArea = state.selectedGradeId || gradeId;
    const existsForGrade = getPathsByGrade(gradeForArea).some((path) => path.area_id === areaId);
    if (existsForGrade) {
      state.selectedAreaId = areaId;
      state.selectedLearningKey = "";
      changed = true;
    }
  }

  if (changed) {
    renderCurriculumControls();
    syncTopicWithLearning();
  }

  return changed;
}

function makeConversationalPrefix(intent, selected) {
  if (intent === "saludo" || intent === "ayuda") return "";
  if (!selected) return "";

  return `Estoy usando ${selected.path.grade} · ${selected.path.area}. `;
}

function generateNluAnswer(question, selected) {
  const intent = detectNluIntent(question);
  state.conversation.lastIntent = intent;
  state.conversation.lastLearningKey = selected?.key || "";

  if (["definicion", "explicacion", "cantidad", "ubicacion", "tema", "desconocido"].includes(intent)) {
    return null;
  }

  const template = chooseTemplate(intent);
  const answer = `${makeConversationalPrefix(intent, selected)}${fillTemplate(template, selected)}`;

  return {
    found: intent !== "desconocido",
    answer,
    topic: selected?.path.related_topics?.[0] || "",
    recommendation: ["saludo", "ayuda", "minijuego"].includes(intent) ? "" : selected?.path.related_topics?.find((id) => getTopic(id)) || "",
    matchedKeyword: intent,
    intent,
    score: intent === "desconocido" ? 1 : 12
  };
}

async function localAsk(question) {
  if (!state.knowledgeBase) {
    state.knowledgeBase = await loadJson("/data/knowledge_base.json", "../data/knowledge_base.json");
  }
  if (!state.curriculum) {
    state.curriculum = await loadJson("/api/curriculum", "../data/curriculum_map.json");
  }
  if (!state.nluModel) {
    state.nluModel = await loadJson("/data/nlu_model.json", "../data/nlu_model.json");
  }

  applyContextFromText(question);

  const cleanQuestion = cleanText(question);
  const intent = detectIntent(question);
  const selectedLearning = getSelectedLearning();
  const fallback = state.knowledgeBase.default_response ||
    "Aún no tengo esa respuesta, pero puedes explorar los temas disponibles.";

  const nluAnswer = generateNluAnswer(question, selectedLearning);
  if (nluAnswer?.found) {
    return nluAnswer;
  }

  if (selectedLearning && asksAboutLearning(question)) {
    return buildLearningAnswer(selectedLearning, question);
  }

  let best = {
    found: false,
    answer: fallback,
    topic: "",
    recommendation: inferRelatedTopic(cleanQuestion),
    matchedKeyword: "",
    intent,
    score: 0
  };

  for (const entry of state.knowledgeBase.entries || []) {
    let score = 0;
    let matchedKeyword = "";

    if (entry.topic && cleanQuestion.includes(cleanText(entry.topic))) {
      score += 2;
    }

    if (selectedLearning && selectedLearning.path.related_topics?.includes(entry.topic)) {
      score += 2;
    }

    if ((entry.intent || "general") === intent) {
      score += 1;
    }

    for (const keyword of entry.keywords || []) {
      const currentScore = keywordScore(cleanQuestion, keyword);
      if (currentScore > 0) {
        score += currentScore;
        if (!matchedKeyword || currentScore >= 3) {
          matchedKeyword = keyword;
        }
      }
    }

    if (score > best.score) {
      best = {
        found: score >= 3,
        answer: entry.answer,
        topic: entry.topic,
        recommendation: entry.recommendation || selectedLearning?.path.related_topics?.[0] || entry.topic,
        matchedKeyword,
        intent,
        score
      };
    }
  }

  if (!best.found) {
    const curriculumAnswer = findCurriculumAnswer(question);
    if (curriculumAnswer.found) {
      return curriculumAnswer;
    }

    if (selectedLearning) {
      return buildLearningAnswer(selectedLearning, question);
    }

    best.answer = fallback;
  } else if (learningMatchesTopic(selectedLearning, best.topic)) {
    best.answer = `${best.answer} Este tema se conecta con el aprendizaje seleccionado: ${selectedLearning.text}`;
  }

  return best;
}

async function askQuestion(question) {
  try {
    return await localAsk(question);
  } catch (error) {
    console.warn("No se pudo usar la base curricular del navegador", error);
  }

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        grade: state.selectedGradeId,
        area: state.selectedAreaId,
        learning: state.selectedLearningKey
      })
    });

    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    console.warn("Usando busqueda local del navegador", error);
  }

  return {
    found: false,
    answer: "No pude leer la base local de REI. Revisa que los archivos JSON estén en la microSD.",
    topic: "",
    recommendation: "",
    matchedKeyword: "",
    intent: detectIntent(question),
    score: 0
  };
}

function getTopic(topicId) {
  return state.topics.find((topic) => topic.id === topicId);
}

function shortText(text, maxLength = 105) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function uniqueWords(words) {
  const seen = new Set();
  return words.filter((word) => {
    const clean = cleanText(word, false);
    if (!clean || seen.has(clean)) return false;
    seen.add(clean);
    return true;
  });
}

function getPathsByGrade(gradeId) {
  return (state.curriculum?.learning_paths || [])
    .filter((path) => path.grade_id === gradeId);
}

function getPathsByGradeAndArea(gradeId, areaId) {
  return getPathsByGrade(gradeId)
    .filter((path) => path.area_id === areaId);
}

function getLearningOptions(gradeId = state.selectedGradeId, areaId = state.selectedAreaId) {
  return getPathsByGradeAndArea(gradeId, areaId).flatMap((path) =>
    (path.essential_learnings || []).map((text, index) => ({
      key: `${path.id}::${index}`,
      path,
      index,
      text
    }))
  );
}

function getSelectedLearning() {
  const options = getLearningOptions();
  return options.find((option) => option.key === state.selectedLearningKey) || options[0] || null;
}

function setSelectOptions(select, options, value) {
  select.innerHTML = options.map((option) =>
    `<option value="${option.value}">${option.label}</option>`
  ).join("");
  select.value = value;
}

function renderCurriculumControls() {
  if (!state.curriculum) return;

  const gradeOptions = state.curriculum.grades.map((grade) => ({
    value: grade.id,
    label: `${grade.label} · ${grade.level}`
  }));

  if (!state.selectedGradeId) {
    state.selectedGradeId = state.curriculum.grades.find((grade) => grade.id === "4")?.id ||
      state.curriculum.grades[0]?.id ||
      "";
  }

  const areasForGrade = getPathsByGrade(state.selectedGradeId)
    .map((path) => ({ value: path.area_id, label: path.area }));

  const uniqueAreas = areasForGrade.filter((area, index, list) =>
    list.findIndex((item) => item.value === area.value) === index
  );

  if (!state.selectedAreaId || !uniqueAreas.some((area) => area.value === state.selectedAreaId)) {
    state.selectedAreaId = uniqueAreas.find((area) => area.value === "ciencias-naturales")?.value ||
      uniqueAreas[0]?.value ||
      "";
  }

  const learningOptions = getLearningOptions().map((option) => ({
    value: option.key,
    label: `${option.index + 1}. ${option.text}`
  }));

  if (!state.selectedLearningKey || !learningOptions.some((option) => option.value === state.selectedLearningKey)) {
    state.selectedLearningKey = learningOptions[0]?.value || "";
  }

  setSelectOptions(gradeSelect, gradeOptions, state.selectedGradeId);
  setSelectOptions(areaSelect, uniqueAreas, state.selectedAreaId);
  setSelectOptions(learningSelect, learningOptions, state.selectedLearningKey);
  renderLearningInfo();
  prepareMiniGames();
  renderMiniGames();
}

function renderLearningInfo() {
  const selected = getSelectedLearning();
  if (!selected) {
    learningInfo.innerHTML = `<p>No hay aprendizaje cargado para esta selección.</p>`;
    return;
  }

  const evidence = selected.path.evidence_examples?.[0] || "Explica el aprendizaje con sus propias palabras.";
  learningInfo.innerHTML = `
    <strong>${selected.path.grade} · ${selected.path.area}</strong>
    <p>${selected.text}</p>
    <span>Evidencia: ${evidence}</span>
  `;
}

function syncTopicWithLearning() {
  const selected = getSelectedLearning();
  const topicId = selected?.path.related_topics?.find((id) => getTopic(id));
  if (topicId) {
    state.selectedTopicId = topicId;
    renderTopics();
    renderDetail();
  }
}

function getGameTerms(selected) {
  if (!selected) return [];

  const fromKeywords = selected.path.keywords || [];
  const fromLearning = selected.text
    .split(" ")
    .map((word) => word.replace(/[.,;:¿?¡!()]/g, ""))
    .filter((word) => word.length > 5);

  return uniqueWords([...fromKeywords, ...fromLearning])
    .slice(0, 6);
}

function prepareMiniGames() {
  const selected = getSelectedLearning();
  if (!selected || state.games.learningKey === selected.key) return;

  const terms = getGameTerms(selected);
  const memoryTerms = terms.slice(0, 4);
  const orderSource = selected.text
    .replace(/[.,;:¿?¡!()]/g, "")
    .split(" ")
    .filter((word) => word.length > 3)
    .slice(0, 7);

  const samePathOptions = (selected.path.essential_learnings || [])
    .map((text, index) => ({ key: `${selected.path.id}::${index}`, text }))
    .filter((option) => option.key !== selected.key);

  state.games = {
    learningKey: selected.key,
    memoryCards: shuffle([...memoryTerms, ...memoryTerms]).map((term, index) => ({
      id: `${term}-${index}`,
      term
    })),
    memoryOpen: [],
    memoryMatched: [],
    orderSource,
    orderPool: shuffle(orderSource),
    orderAnswer: [],
    orderDone: false,
    quickOptions: shuffle([
      { key: selected.key, text: selected.text, correct: true },
      ...samePathOptions.slice(0, 2).map((option) => ({ ...option, correct: false }))
    ]),
    quickSelected: ""
  };
}

function renderMiniGames() {
  const selected = getSelectedLearning();
  if (!selected) {
    miniGames.innerHTML = "";
    return;
  }

  const tabs = [
    { id: "memory", label: "Memoria" },
    { id: "order", label: "Ordena" },
    { id: "quick", label: "Reto" }
  ];

  miniGames.innerHTML = `
    <div class="mini-games-head">
      <div>
        <p class="section-kicker">Minijuegos</p>
        <h3>Practica el aprendizaje</h3>
      </div>
      <div class="game-tabs">
        ${tabs.map((tab) => `
          <button class="${state.activeGame === tab.id ? "active" : ""}" type="button" data-game-tab="${tab.id}">
            ${tab.label}
          </button>
        `).join("")}
      </div>
    </div>
    <div class="game-stage">
      ${state.activeGame === "memory" ? renderMemoryGame() : ""}
      ${state.activeGame === "order" ? renderOrderGame() : ""}
      ${state.activeGame === "quick" ? renderQuickGame() : ""}
    </div>
  `;

  bindMiniGames();
}

function renderMemoryGame() {
  const matchedCount = state.games.memoryMatched.length / 2;
  const totalPairs = state.games.memoryCards.length / 2;

  return `
    <p class="game-hint">Encuentra las parejas de palabras clave del aprendizaje.</p>
    <div class="memory-grid">
      ${state.games.memoryCards.map((card, index) => {
        const isOpen = state.games.memoryOpen.includes(index) || state.games.memoryMatched.includes(index);
        return `
          <button class="memory-card ${isOpen ? "open" : ""}" type="button" data-memory-card="${index}">
            ${isOpen ? card.term : "REI"}
          </button>
        `;
      }).join("")}
    </div>
    <p class="game-feedback">${matchedCount === totalPairs ? "Muy bien. Completaste la memoria." : `Parejas: ${matchedCount}/${totalPairs}`}</p>
  `;
}

function renderOrderGame() {
  const answerText = state.games.orderAnswer.join(" ");
  const targetText = state.games.orderSource.join(" ");
  const isCorrect = state.games.orderDone && answerText === targetText;

  return `
    <p class="game-hint">Ordena las palabras para reconstruir una parte del aprendizaje.</p>
    <div class="order-answer">${answerText || "Toca las palabras en orden"}</div>
    <div class="word-pool">
      ${state.games.orderPool.map((word, index) => `
        <button type="button" data-order-word="${index}">${word}</button>
      `).join("")}
    </div>
    <div class="game-actions">
      <button class="secondary-button" type="button" data-check-order>Revisar</button>
      <button class="secondary-button quiet" type="button" data-reset-game>Reiniciar</button>
    </div>
    <p class="game-feedback">${state.games.orderDone ? (isCorrect ? "Correcto. Reconstruiste la idea." : "Casi. Reinicia e intenta otra vez.") : ""}</p>
  `;
}

function renderQuickGame() {
  return `
    <p class="game-hint">Elige el aprendizaje que corresponde a la selección actual.</p>
    <div class="quick-options">
      ${state.games.quickOptions.map((option) => {
        const selected = state.games.quickSelected === option.key;
        const className = selected ? (option.correct ? "correct" : "incorrect") : "";
        return `
          <button class="${className}" type="button" data-quick-option="${option.key}">
            ${option.text}
          </button>
        `;
      }).join("")}
    </div>
    <p class="game-feedback">${state.games.quickSelected ? (state.games.quickOptions.find((option) => option.key === state.games.quickSelected)?.correct ? "Correcto. Ese es el aprendizaje seleccionado." : "No es ese. Revisa el texto resaltado arriba.") : ""}</p>
  `;
}

function bindMiniGames() {
  miniGames.querySelectorAll("[data-game-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeGame = button.dataset.gameTab;
      renderMiniGames();
    });
  });

  miniGames.querySelectorAll("[data-memory-card]").forEach((button) => {
    button.addEventListener("click", () => handleMemoryClick(Number(button.dataset.memoryCard)));
  });

  miniGames.querySelectorAll("[data-order-word]").forEach((button) => {
    button.addEventListener("click", () => handleOrderClick(Number(button.dataset.orderWord)));
  });

  const checkOrder = miniGames.querySelector("[data-check-order]");
  if (checkOrder) {
    checkOrder.addEventListener("click", () => {
      state.games.orderDone = true;
      renderMiniGames();
    });
  }

  const resetGame = miniGames.querySelector("[data-reset-game]");
  if (resetGame) {
    resetGame.addEventListener("click", () => {
      state.games.learningKey = "";
      prepareMiniGames();
      renderMiniGames();
    });
  }

  miniGames.querySelectorAll("[data-quick-option]").forEach((button) => {
    button.addEventListener("click", () => {
      state.games.quickSelected = button.dataset.quickOption;
      renderMiniGames();
    });
  });
}

function handleMemoryClick(index) {
  if (state.games.memoryMatched.includes(index) || state.games.memoryOpen.includes(index)) return;
  if (state.games.memoryOpen.length >= 2) return;

  state.games.memoryOpen.push(index);

  if (state.games.memoryOpen.length === 2) {
    const [first, second] = state.games.memoryOpen;
    if (state.games.memoryCards[first].term === state.games.memoryCards[second].term) {
      state.games.memoryMatched.push(first, second);
      state.games.memoryOpen = [];
      renderMiniGames();
    } else {
      renderMiniGames();
      setTimeout(() => {
        state.games.memoryOpen = [];
        renderMiniGames();
      }, 650);
    }
    return;
  }

  renderMiniGames();
}

function handleOrderClick(index) {
  const [word] = state.games.orderPool.splice(index, 1);
  if (word) {
    state.games.orderAnswer.push(word);
    state.games.orderDone = false;
    renderMiniGames();
  }
}

function asksAboutLearning(question) {
  const normalized = cleanText(question, false);
  return [
    "aprendizaje",
    "aprender",
    "debo aprender",
    "objetivo",
    "evidencia",
    "actividad",
    "grado",
    "materia",
    "area",
    "dba",
    "men"
  ].some((word) => normalized.includes(word));
}

function buildLearningAnswer(selected, question) {
  const normalized = cleanText(question, false);
  let answer = `Para ${selected.path.grade} en ${selected.path.area}, el aprendizaje esencial seleccionado es: ${selected.text}`;

  if (normalized.includes("evidencia") || normalized.includes("evaluar")) {
    answer += ` Una evidencia posible es: ${selected.path.evidence_examples?.join(" ")}`;
  } else if (normalized.includes("actividad") || normalized.includes("practicar") || normalized.includes("practico")) {
    answer += ` Puedes practicarlo así: ${selected.path.rei_activity}`;
  } else {
    answer += ` En palabras sencillas: ${selected.path.student_goal}`;
  }

  return {
    found: true,
    answer,
    topic: selected.path.related_topics?.[0] || "",
    recommendation: selected.path.related_topics?.find((id) => getTopic(id)) || "",
    matchedKeyword: selected.path.area,
    intent: detectIntent(question),
    score: 10
  };
}

function findCurriculumAnswer(question) {
  const cleanQuestion = cleanText(question);
  let best = null;
  let bestScore = 0;

  for (const path of state.curriculum?.learning_paths || []) {
    let score = 0;
    if (cleanQuestion.includes(cleanText(path.grade))) score += 2;
    if (cleanQuestion.includes(cleanText(path.area))) score += 2;

    for (const keyword of path.keywords || []) {
      score += keywordScore(cleanQuestion, keyword);
    }

    for (const [index, text] of (path.essential_learnings || []).entries()) {
      const textScore = keywordScore(cleanQuestion, text);
      if (textScore > 0 && score + textScore > bestScore) {
        bestScore = score + textScore;
        best = { key: `${path.id}::${index}`, path, index, text };
      }
    }
  }

  if (!best || bestScore < 4) {
    return { found: false };
  }

  return buildLearningAnswer(best, question);
}

function renderTopics() {
  topicGrid.innerHTML = "";

  state.topics.forEach((topic) => {
    const button = document.createElement("button");
    button.className = `topic-card ${topic.id === state.selectedTopicId ? "active" : ""}`;
    button.type = "button";
    button.addEventListener("click", () => selectTopic(topic.id));

    button.innerHTML = `
      <img src="${resolveAssetPath(topic.image)}" alt="Ilustración de ${topic.title}">
      <div>
        <span class="topic-kicker">${topic.area}</span>
        <h3>${topic.title}</h3>
        <p>${shortText(topic.description)}</p>
      </div>
    `;

    topicGrid.appendChild(button);
  });
}

function renderFacts(topic) {
  return `
    <ul class="facts-list">
      ${topic.curiousFacts.map((fact) => `<li>${fact}</li>`).join("")}
    </ul>
  `;
}

function renderFaqs(topic) {
  return `
    <div class="faq-list">
      ${topic.faqs.map((faq) => `
        <div class="faq-item">
          <strong>${faq.question}</strong>
          <p>${faq.answer}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderQuiz(topicId) {
  const quiz = state.quizzes[topicId] || [];
  if (!quiz.length) {
    return "<p>No hay quiz para este tema.</p>";
  }

  const index = state.quizIndex[topicId] || 0;
  const question = quiz[index];
  const answered = state.quizAnswered[topicId];

  return `
    <div class="quiz" data-topic="${topicId}">
      <h3>${question.question}</h3>
      <div class="quiz-options">
        ${question.options.map((option, optionIndex) => {
          let className = "quiz-option";
          if (answered && optionIndex === question.answerIndex) className += " correct";
          if (answered && optionIndex === answered.selected && optionIndex !== question.answerIndex) className += " incorrect";
          return `<button class="${className}" type="button" data-option="${optionIndex}">${option}</button>`;
        }).join("")}
      </div>
      <p class="quiz-feedback">${answered ? question.explanation : ""}</p>
      <div class="quiz-actions">
        <button class="secondary-button" type="button" data-next-quiz>Siguiente</button>
      </div>
    </div>
  `;
}

function bindQuiz(topicId) {
  topicDetail.querySelectorAll("[data-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = Number(button.dataset.option);
      state.quizAnswered[topicId] = { selected };
      renderDetail();
    });
  });

  const nextButton = topicDetail.querySelector("[data-next-quiz]");
  if (nextButton) {
    nextButton.addEventListener("click", () => {
      const quiz = state.quizzes[topicId] || [];
      state.quizIndex[topicId] = ((state.quizIndex[topicId] || 0) + 1) % quiz.length;
      state.quizAnswered[topicId] = null;
      renderDetail();
    });
  }
}

function renderDetail() {
  const topic = getTopic(state.selectedTopicId);
  if (!topic) return;

  topicDetail.innerHTML = `
    <article>
      <div class="topic-hero">
        <img src="${resolveAssetPath(topic.image)}" alt="Ilustración de ${topic.title}">
        <div>
          <span class="area-label">${topic.area}</span>
          <h2>${topic.title}</h2>
          <p>${topic.description}</p>
        </div>
      </div>
      <div class="content-block">
        <h3>Datos curiosos</h3>
        ${renderFacts(topic)}
      </div>
      <div class="content-block">
        <h3>Preguntas frecuentes</h3>
        ${renderFaqs(topic)}
      </div>
      <div class="content-block">
        <h3>Mini quiz</h3>
        ${renderQuiz(topic.id)}
      </div>
    </article>
  `;

  bindQuiz(topic.id);
}

function selectTopic(topicId) {
  state.selectedTopicId = topicId;
  renderTopics();
  renderDetail();
}

function handleGradeChange() {
  state.selectedGradeId = gradeSelect.value;
  state.selectedAreaId = "";
  state.selectedLearningKey = "";
  renderCurriculumControls();
  syncTopicWithLearning();
}

function handleAreaChange() {
  state.selectedAreaId = areaSelect.value;
  state.selectedLearningKey = "";
  renderCurriculumControls();
  syncTopicWithLearning();
}

function handleLearningChange() {
  state.selectedLearningKey = learningSelect.value;
  renderLearningInfo();
  syncTopicWithLearning();
}

function addMessage(role, text, recommendation = "") {
  const message = document.createElement("div");
  message.className = `message ${role}`;

  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  message.appendChild(paragraph);

  if (recommendation && getTopic(recommendation)) {
    const button = document.createElement("button");
    button.className = "recommendation";
    button.type = "button";
    button.textContent = `Explorar ${getTopic(recommendation).title}`;
    button.addEventListener("click", () => selectTopic(recommendation));
    message.appendChild(button);
  }

  chatLog.appendChild(message);
  chatLog.scrollTop = chatLog.scrollHeight;
  rememberTurn(role, text, { recommendation });
}

async function handleAsk(event) {
  event.preventDefault();

  const question = questionInput.value.trim();
  if (!question) return;

  questionInput.value = "";
  addMessage("user", question);
  aiStatus.textContent = "Pensando";

  const response = await askQuestion(question);
  addMessage("ai", response.answer, response.recommendation);
  aiStatus.textContent = "Lista";
}

async function init() {
  try {
    const topicsData = await loadJson("/api/topics", "../data/topics.json");
    const quizzesData = await loadJson("/api/quizzes", "../data/quizzes.json");
    const curriculumData = await loadJson("/api/curriculum", "../data/curriculum_map.json");
    const nluData = await loadJson("/data/nlu_model.json", "../data/nlu_model.json");

    state.topics = topicsData.topics || [];
    state.quizzes = quizzesData.quizzes || {};
    state.curriculum = curriculumData;
    state.nluModel = nluData;
    state.selectedTopicId = state.topics[0]?.id || "";

    renderCurriculumControls();
    renderTopics();
    renderDetail();
    addMessage("ai", "Hola. Soy REI. Elige grado, área y aprendizaje esencial; luego escribe tu pregunta por texto.");
  } catch (error) {
    topicDetail.innerHTML = `<div class="loading">No se pudieron cargar los archivos JSON locales.</div>`;
    aiStatus.textContent = "Sin datos";
    console.error(error);
  }
}

gradeSelect.addEventListener("change", handleGradeChange);
areaSelect.addEventListener("change", handleAreaChange);
learningSelect.addEventListener("change", handleLearningChange);
askForm.addEventListener("submit", handleAsk);
init();
