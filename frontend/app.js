const form = document.getElementById("chat-form");
const answerEl = document.getElementById("answer");
const citationsEl = document.getElementById("citations");
const latencyEl = document.getElementById("latency");
const topKInput = document.getElementById("topK");
const temperatureInput = document.getElementById("temperature");
const topKValue = document.getElementById("topKValue");
const temperatureValue = document.getElementById("temperatureValue");

const apiBase = window.__RAG_CONFIG__?.apiBaseUrl || "/api";

topKInput.addEventListener("input", () => {
  topKValue.textContent = topKInput.value;
});

temperatureInput.addEventListener("input", () => {
  temperatureValue.textContent = temperatureInput.value;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = new FormData(form).get("question")?.toString().trim();
  if (!question) {
    return;
  }

  setLoadingState();

  try {
    const response = await fetch(`${apiBase}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        history: [],
        settings: {
          topK: Number(topKInput.value),
          temperature: Number(temperatureInput.value)
        }
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.details || payload.error || "Request failed.");
    }

    renderAnswer(payload);
  } catch (error) {
    answerEl.textContent = error.message;
    answerEl.className = "answer-output error-state";
    citationsEl.textContent = "No evidence available because the request failed.";
    citationsEl.className = "evidence-list empty-state";
    latencyEl.textContent = "Error";
  }
});

function setLoadingState() {
  answerEl.textContent = "Thinking through the retrieved sources...";
  answerEl.className = "answer-output";
  citationsEl.textContent = "Searching the knowledge base...";
  citationsEl.className = "evidence-list";
  latencyEl.textContent = "Working";
}

function renderAnswer(payload) {
  answerEl.textContent = payload.answer || "No answer returned.";
  answerEl.className = "answer-output";
  latencyEl.textContent = `${payload.latencyMs} ms`;

  const citations = Array.isArray(payload.citations) ? payload.citations : [];
  if (citations.length === 0) {
    citationsEl.textContent = "No matching sources were retrieved.";
    citationsEl.className = "evidence-list empty-state";
    return;
  }

  citationsEl.className = "evidence-list";
  citationsEl.innerHTML = citations
    .map((citation, index) => {
      return `
        <article class="citation-card">
          <div class="citation-head">
            <span class="citation-badge">[${index + 1}]</span>
            <div>
              <h3>${escapeHtml(citation.title || "Untitled source")}</h3>
              <p>${escapeHtml(citation.documentPath || "")}</p>
            </div>
            <strong>${formatScore(citation.score)}</strong>
          </div>
          <p>${escapeHtml(citation.content || "")}</p>
        </article>
      `;
    })
    .join("");
}

function formatScore(value) {
  if (typeof value !== "number") {
    return "n/a";
  }
  return value.toFixed(2);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
