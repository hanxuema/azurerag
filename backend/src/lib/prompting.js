export function buildMessages({ systemPrompt, question, history = [], matches = [] }) {
  const context = matches.length
    ? matches
        .map((match, index) => `[${index + 1}] ${match.title}\n${match.content}`)
        .join("\n\n")
    : "No relevant sources were retrieved.";

  return [
    {
      role: "system",
      content: `${systemPrompt}\n\nUse citations like [1], [2] when you rely on sources.\nIf the sources do not support the answer, say so.`
    },
    ...history.map((entry) => ({
      role: entry.role,
      content: entry.content
    })),
    {
      role: "user",
      content: `Question: ${question}\n\nSources:\n${context}`
    }
  ];
}
