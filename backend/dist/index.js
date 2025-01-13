"use strict";
// src/index.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
// Import your custom prompts and base prompts
const prompts_1 = require("./prompts");
const node_1 = require("./defaults/node");
const react_1 = require("./defaults/react");
// 1) Load environment variables
dotenv_1.default.config();
// 2) Retrieve API key from .env with validation
const apiKey = process.env.ANTHROPIC_API_KEY || (() => {
    throw new Error("Missing ANTHROPIC_API_KEY in .env");
})();
// 3) Initialize the Anthropic client
const anthropic = new sdk_1.default({
    apiKey: apiKey,
    // Optionally, set other configurations here
});
// 4) Initialize Express
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// 5) Add a root GET endpoint for testing
app.get("/", (req, res) => {
    res.send("Anthropic Express Server is running.");
});
// --------------------------------------------------------------------
// Endpoint: /template
// --------------------------------------------------------------------
// Determines whether the project should use "node" or "react"
app.post("/template", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Received POST /template request");
    try {
        const prompt = req.body.prompt;
        console.log("Prompt received:", prompt);
        if (!prompt || typeof prompt !== "string") {
            console.log("Invalid prompt");
            res.status(400).json({ error: "Missing or invalid 'prompt' in request body" });
            return;
        }
        // System instruction to guide Anthropic's response
        const systemInstruction = "Return either 'node' or 'react' based on what you think this project should be. " +
            "Only return a single word: either 'node' or 'react'. Do not return anything extra.";
        // Combine system instruction and user prompt into a single string
        const fullPrompt = `${systemInstruction}\n\n${prompt}`;
        console.log("Full prompt sent to Anthropic:", fullPrompt);
        // Generate content using the combined prompt
        const response = yield anthropic.messages.create({
            messages: [{
                    role: 'user',
                    content: fullPrompt
                }],
            model: 'claude-3-5-sonnet-20241022', // Ensure this is the correct model name
            max_tokens: 200,
            temperature: 0.7, // Adjust as needed
        });
        // Extract the answer
        const answer = response.content[0].text.trim().toLowerCase(); // 'react' or 'node'
        console.log("Anthropic response:", answer);
        if (answer === "react") {
            console.log("Detected framework: React");
            res.json({
                prompts: [
                    prompts_1.BASE_PROMPT,
                    `Here is an artifact that contains all files of the project visible to you.\n` +
                        `Consider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\n` +
                        `Here is a list of files that exist on the file system but are not being shown to you:\n\n` +
                        `  - .gitignore\n` +
                        `  - package-lock.json\n`
                ],
                uiPrompts: [react_1.basePrompt],
            });
            return;
        }
        if (answer === "node") {
            console.log("Detected framework: Node.js");
            res.json({
                prompts: [
                    `Here is an artifact that contains all files of the project visible to you.\n` +
                        `Consider the contents of ALL files in the project.\n\n${node_1.basePrompt}\n\n` +
                        `Here is a list of files that exist on the file system but are not being shown to you:\n\n` +
                        `  - .gitignore\n` +
                        `  - package-lock.json\n`
                ],
                uiPrompts: [node_1.basePrompt],
            });
            return;
        }
        // If neither "node" nor "react" is determined
        console.log("Unable to determine framework");
        res.status(403).json({ message: "You can't access this" });
    }
    catch (error) {
        console.error("Error in /template:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// --------------------------------------------------------------------
// Endpoint: /chat
// --------------------------------------------------------------------
// Handles chat interactions by accepting an array of messages
app.post("/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Received POST /chat request");
    try {
        const messages = req.body.messages;
        console.log("Messages received:", JSON.stringify(messages, null, 2));
        if (!Array.isArray(messages) || messages.some((msg) => typeof msg.content !== "string" || !['user', 'system', 'assistant'].includes(msg.role))) {
            console.log("Invalid messages format");
            res.status(400).json({ error: "'messages' must be an array of objects with 'role' and 'content' properties" });
            return;
        }
        // System instruction for the chat model
        const systemText = (0, prompts_1.getSystemPrompt)(); // e.g., "You are a helpful coding assistant..."
        console.log("System prompt:", systemText);
        // Format messages for the model
        const formattedMessages = messages.map(msg => {
            if (msg.role === 'user') {
                return `User: ${msg.content}`;
            }
            else if (msg.role === 'assistant') {
                return `Assistant: ${msg.content}`;
            }
            else {
                return `System: ${msg.content}`;
            }
        }).join("\n\n");
        const fullPrompt = `${systemText}\n\n${formattedMessages}`;
        console.log("Full chat prompt sent to Anthropic:", fullPrompt);
        // Generate content using the combined prompt
        const response = yield anthropic.messages.create({
            messages: [{
                    role: 'user',
                    content: fullPrompt
                }],
            model: 'claude-3-5-sonnet-20241022', // Ensure this is the correct model name
            max_tokens: 8000,
            temperature: 0.7, // Adjust as needed
        });
        const responseText = (_a = response.content[0]) === null || _a === void 0 ? void 0 : _a.text.trim();
        console.log("Anthropic chat response:", responseText);
        res.json({
            response: responseText || "No response",
        });
    }
    catch (error) {
        console.error("Error in /chat:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// --------------------------------------------------------------------
// Start Server
// --------------------------------------------------------------------
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
