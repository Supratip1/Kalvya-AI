// src/index.ts

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Import your custom prompts and base prompts
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";

// 1) Load environment variables
dotenv.config();

// 2) Retrieve API key from .env with validation
const apiKey: string = process.env.GEMINI_API_KEY || (() => {
  throw new Error("Missing GEMINI_API_KEY in .env");
})();

// 3) Initialize the Gemini client
const genAI = new GoogleGenerativeAI(apiKey);

// 4) Grab the generative model (as per official docs)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 5) Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// 6) Add a root GET endpoint for testing
app.get("/", (req: Request, res: Response): void => {
  res.send("Gemini Express Server is running.");
});

// --------------------------------------------------------------------
// Types
// --------------------------------------------------------------------
interface ChatMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

// --------------------------------------------------------------------
// Endpoint: /template
// --------------------------------------------------------------------
// Determines whether the project should use "node" or "react"
app.post("/template", async (req: Request, res: Response): Promise<void> => {
  console.log("Received POST /template request");

  try {
    const prompt: string = req.body.prompt;
    console.log("Prompt received:", prompt);

    if (!prompt || typeof prompt !== "string") {
      console.log("Invalid prompt");
      res.status(400).json({ error: "Missing or invalid 'prompt' in request body" });
      return;
    }

    // System instruction to guide Gemini's response
    const systemInstruction = 
      "Return either 'node' or 'react' based on what you think this project should be. " +
      "Only return a single word: either 'node' or 'react'. Do not return anything extra.";

    // Combine system instruction and user prompt into a single string
    const fullPrompt = `${systemInstruction}\n\n${prompt}`;
    console.log("Full prompt sent to Gemini:", fullPrompt);

    // Generate content using the combined prompt
    const result = await model.generateContent(fullPrompt);
    const answer = result.response.text().trim().toLowerCase();
    console.log("Gemini response:", answer);

    if (answer === "react") {
      console.log("Detected framework: React");
      res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\n` +
          `Consider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\n` +
          `Here is a list of files that exist on the file system but are not being shown to you:\n\n` +
          `  - .gitignore\n` +
          `  - package-lock.json\n`
        ],
        uiPrompts: [reactBasePrompt],
      });
      return;
    }

    if (answer === "node") {
      console.log("Detected framework: Node.js");
      res.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.\n` +
          `Consider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\n` +
          `Here is a list of files that exist on the file system but are not being shown to you:\n\n` +
          `  - .gitignore\n` +
          `  - package-lock.json\n`
        ],
        uiPrompts: [nodeBasePrompt],
      });
      return;
    }

    // If neither "node" nor "react" is determined
    console.log("Unable to determine framework");
    res.status(403).json({ message: "You can't access this" });
  } catch (error) {
    console.error("Error in /template:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --------------------------------------------------------------------
// Endpoint: /chat
// --------------------------------------------------------------------
// Handles chat interactions by accepting an array of messages
app.post("/chat", async (req: Request, res: Response): Promise<void> => {
  console.log("Received POST /chat request");

  try {
    const messages: ChatMessage[] = req.body.messages;
    console.log("Messages received:", JSON.stringify(messages, null, 2));

    if (!Array.isArray(messages) || messages.some((msg) => typeof msg.content !== "string" || !['user', 'system', 'assistant'].includes(msg.role))) {
      console.log("Invalid messages format");
      res.status(400).json({ error: "'messages' must be an array of objects with 'role' and 'content' properties" });
      return;
    }

    // System instruction for the chat model
    const systemText = getSystemPrompt(); // e.g., "You are a helpful coding assistant..."
    console.log("System prompt:", systemText);

    // Format messages for the model
    const formattedMessages = messages.map(msg => {
      if (msg.role === 'user') {
        return `User: ${msg.content}`;
      } else if (msg.role === 'assistant') {
        return `Assistant: ${msg.content}`;
      } else {
        return `System: ${msg.content}`;
      }
    }).join("\n\n");

    const fullPrompt = `${systemText}\n\n${formattedMessages}`;
    console.log("Full chat prompt sent to Gemini:", fullPrompt);

    // Generate content using the combined prompt
    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text().trim();
    console.log("Gemini chat response:", responseText);

    res.json({
      response: responseText || "No response",
    });
  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --------------------------------------------------------------------
// Start Server
// --------------------------------------------------------------------
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
