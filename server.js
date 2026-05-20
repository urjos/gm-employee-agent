require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const {
  AZURE_AI_PROJECT_ENDPOINT,
  AZURE_AI_AGENT_ID,
  AZURE_AI_API_KEY,
  AZURE_AI_API_VERSION = "2024-05-01-preview",
  PORT = 3000,
} = process.env;

// Validate env vars on startup
if (!AZURE_AI_PROJECT_ENDPOINT || !AZURE_AI_AGENT_ID || !AZURE_AI_API_KEY) {
  console.error("❌ Faltan variables de entorno. Revisa tu archivo .env");
  process.exit(1);
}

const BASE = `${AZURE_AI_PROJECT_ENDPOINT.replace(/\/$/, "")}/openai`;
const HEADERS = {
  "Content-Type": "application/json",
  "api-key": AZURE_AI_API_KEY,
};

// Helper: fetch with error handling
async function azureFetch(url, options = {}) {
  const { default: fetch } = await import("node-fetch");
  const res = await fetch(url, { ...options, headers: { ...HEADERS, ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, detail: data };
  return data;
}

// POST /api/thread — crear nuevo hilo
app.post("/api/thread", async (req, res) => {
  try {
    const data = await azureFetch(
      `${BASE}/threads?api-version=${AZURE_AI_API_VERSION}`,
      { method: "POST", body: JSON.stringify({}) }
    );
    res.json({ threadId: data.id });
  } catch (err) {
    console.error("Error creando thread:", err);
    res.status(err.status || 500).json({ error: "No se pudo crear el hilo de conversación." });
  }
});

// POST /api/message — enviar mensaje y obtener respuesta
app.post("/api/message", async (req, res) => {
  const { threadId, message } = req.body;

  if (!threadId || !message) {
    return res.status(400).json({ error: "threadId y message son requeridos." });
  }

  try {
    // 1. Agregar mensaje al hilo
    await azureFetch(
      `${BASE}/threads/${threadId}/messages?api-version=${AZURE_AI_API_VERSION}`,
      {
        method: "POST",
        body: JSON.stringify({ role: "user", content: message }),
      }
    );

    // 2. Ejecutar el agente
    const run = await azureFetch(
      `${BASE}/threads/${threadId}/runs?api-version=${AZURE_AI_API_VERSION}`,
      {
        method: "POST",
        body: JSON.stringify({ assistant_id: AZURE_AI_AGENT_ID }),
      }
    );

    // 3. Polling hasta completar
    let runStatus = run;
    let attempts = 0;
    while (
      ["queued", "in_progress", "cancelling"].includes(runStatus.status) &&
      attempts < 30
    ) {
      await new Promise((r) => setTimeout(r, 1500));
      runStatus = await azureFetch(
        `${BASE}/threads/${threadId}/runs/${run.id}?api-version=${AZURE_AI_API_VERSION}`
      );
      attempts++;
    }

    if (runStatus.status !== "completed") {
      return res.status(500).json({ error: `El agente terminó con estado: ${runStatus.status}` });
    }

    // 4. Obtener la respuesta
    const messages = await azureFetch(
      `${BASE}/threads/${threadId}/messages?api-version=${AZURE_AI_API_VERSION}&order=desc&limit=1`
    );

    const lastMsg = messages.data?.[0];
    const responseText =
      lastMsg?.content?.find((c) => c.type === "text")?.text?.value ||
      "Sin respuesta del agente.";

    res.json({ response: responseText });
  } catch (err) {
    console.error("Error en /api/message:", err);
    res.status(err.status || 500).json({ error: "Error al procesar el mensaje." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor GM Ingenieros corriendo en http://localhost:${PORT}`);
});
