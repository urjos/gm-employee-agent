require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { DefaultAzureCredential } = require("@azure/identity");
const { AIProjectClient } = require("@azure/ai-projects");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const {
  AZURE_AI_PROJECT_ENDPOINT,
  AZURE_AI_AGENT_ID,
  AZURE_AI_AGENT_VERSION = "1",
  PORT = 3000,
} = process.env;

if (!AZURE_AI_PROJECT_ENDPOINT || !AZURE_AI_AGENT_ID) {
  console.error("Check your .env file. Missing required variables.");
  process.exit(1);
}

const projectClient = new AIProjectClient(
  AZURE_AI_PROJECT_ENDPOINT,
  new DefaultAzureCredential(),
);
const openAIClient = projectClient.getOpenAIClient();

app.post("/api/thread", async (req, res) => {
  try {
    const conversation = await openAIClient.conversations.create();
    res.json({ threadId: conversation.id });
  } catch (err) {
    console.error("Error creating conversation:", err);
    res.status(500).json({ error: "Failed to create conversation thread." });
  }
});

app.post("/api/message", async (req, res) => {
  const { threadId, message } = req.body;

  if (!threadId || !message) {
    return res
      .status(400)
      .json({ error: "threadID and message are required." });
  }

  try {
    const response = await openAIClient.responses.create(
      {
        conversation: threadId,
        input: message,
      },
      {
        body: {
          agent_reference: {
            name: AZURE_AI_AGENT_ID,
            version: AZURE_AI_AGENT_VERSION,
            type: "agent_reference",
          },
        },
      },
    );

    res.json({
      response: response.output_text || "No response from the agent.",
    });
  } catch (err) {
    console.error("Error in /api/message:", err);
    res.status(500).json({ error: "Error processing the message." });
  }
});

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
