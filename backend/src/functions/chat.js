import { app } from "@azure/functions";
import { getClients } from "../lib/clients.js";
import { retrieveSources } from "../lib/retrieval.js";
import { buildMessages } from "../lib/prompting.js";

app.http("chat", {
  route: "chat",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const startedAt = Date.now();

    try {
      const body = await request.json();
      const question = body?.question?.trim();
      const history = Array.isArray(body?.history) ? body.history : [];
      const settings = body?.settings || {};
      const topK = clampNumber(settings.topK, 4, 1, 8);
      const temperature = clampNumber(settings.temperature, 0.2, 0, 1);

      if (!question) {
        return jsonResponse({ error: "Question is required." }, 400);
      }

      const { config, credential, openAiApiKey } = getClients();
      const matches = await retrieveSources(question, topK);
      const messages = buildMessages({
        systemPrompt: config.systemPrompt,
        question,
        history,
        matches
      });

      const headers = {
        "Content-Type": "application/json"
      };

      if (openAiApiKey) {
        headers["api-key"] = openAiApiKey;
      } else {
        const token = await credential.getToken("https://cognitiveservices.azure.com/.default");
        headers.Authorization = `Bearer ${token.token}`;
      }

      const completionResponse = await fetch(
        `${config.openAiEndpoint}openai/deployments/${config.chatDeployment}/chat/completions?api-version=${config.openAiApiVersion}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages,
            temperature
          })
        }
      );

      if (!completionResponse.ok) {
        throw new Error(`Chat completion failed: ${completionResponse.status} ${await completionResponse.text()}`);
      }

      const completion = await completionResponse.json();
      const answer = normalizeAnswerContent(completion.choices[0]?.message?.content) || "No answer returned.";

      return jsonResponse({
        answer,
        citations: matches,
        retrieval: {
          topK,
          matches
        },
        latencyMs: Date.now() - startedAt
      });
    } catch (error) {
      context.error(error);
      return jsonResponse(
        {
          error: "Chat request failed.",
          details: error.message
        },
        500
      );
    }
  }
});

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

function jsonResponse(body, status = 200) {
  return {
    status,
    jsonBody: body
  };
}

function normalizeAnswerContent(content) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map((item) => item.text || "").join("\n").trim();
  }

  return "";
}
