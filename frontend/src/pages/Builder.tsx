// src/components/Builder.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

import { FileExplorer } from '../components/FileExplorer';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import Terminal from '../components/terminal';
import { Loader } from '../components/Loader';
import { TabView } from '../components/TabView';

import { useWebContainer } from '../hooks/useWebContainer';
import { Step, FileItem, StepType } from '../types';
import { BACKEND_URL } from '../config';
import { parseXml } from '../steps';

// Icons
import { FaMobileAlt, FaDesktop, FaGithub } from 'react-icons/fa'; // Added FaGithub
import { SiSupabase, SiNetlify } from 'react-icons/si'; // Added SiSupabase and SiNetlify

/* -----------------------------
   Chat Bubble
----------------------------- */
function ChatBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-lg text-white whitespace-pre-wrap break-words ${
          isUser ? 'bg-blue-600' : 'bg-gray-700'
        }`}
        style={{ lineHeight: '1.6' }}
        dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }}
      />
    </div>
  );
}

/* -----------------------------
   Summarize newly-created files 
   in numeric points
----------------------------- */
function createNumberedFileList(newSteps, isInitial) {
  // Filter only CreateFile steps that have a valid path
  const created = newSteps.filter(
    (st) => st.type === StepType.CreateFile && st.path
  );

  if (!created.length) {
    return 'No new files created. Anything else you want to do?';
  }

  if (isInitial) {
    // Build a numeric list for the initial summary
    const lines = created.map((step, i) => `${i + 1}) Created ${step.path}`);
    lines.push('All set! Anything else you\'d like to do?');
    return lines.join('\n');
  } else {
    // Generic one-liner for subsequent replies
    return `${created.length} new file(s) created. What would you like to do next?`;
  }
}

export function Builder() {
  const location = useLocation();
  const { prompt } = location.state as { prompt: string };

  // Chat messages
  const [chatMessages, setChatMessages] = useState([
    { role: 'user', content: prompt }
  ]);

  // Loading spinner (model is thinking)
  const [loading, setLoading] = useState(false);

  // Steps array (for file creation in background)
  const [steps, setSteps] = useState([]);

  // User input
  const [userPrompt, setUserPrompt] = useState('');

  // Files for code editor
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Tab states
  const [activeTab, setActiveTab] = useState('code');
  const [previewMode, setPreviewMode] = useState('web');

  // Terminal
  const [terminals, setTerminals] = useState([0]);
  const addTerminal = () => setTerminals((prev) => [...prev, prev.length]);

  // WebContainer
  const webcontainer = useWebContainer();

  // Track if initial summary has been sent
  const [hasSentInitialSummary, setHasSentInitialSummary] = useState(false);

  /* ------------------------------------------------------
   * 1) Steps => update files
   * ------------------------------------------------------ */
  useEffect(() => {
    let updated = false;
    const newFiles = [...files];

    // For each pending step, create files
    steps
      .filter((s) => s.status === 'pending')
      .forEach((step) => {
        updated = true;

        if (step.type === StepType.CreateFile && step.path) {
          const parsed = step.path.split('/');
          let current = newFiles;
          let currPath = '';

          while (parsed.length) {
            currPath += `/${parsed[0]}`;
            const folderName = parsed[0];
            parsed.shift();

            if (!parsed.length) {
              // final is a file
              const existingFile = current.find((f) => f.path === currPath);
              if (!existingFile) {
                current.push({
                  name: folderName,
                  type: 'file',
                  path: currPath,
                  content: step.code || ''
                });
              } else {
                existingFile.content = step.code || '';
              }
            } else {
              // folder
              let folder = current.find((f) => f.path === currPath);
              if (!folder) {
                folder = {
                  name: folderName,
                  type: 'folder',
                  path: currPath,
                  children: []
                };
                current.push(folder);
              }
              current = folder.children;
            }
          }
        }

        step.status = 'completed';
      });

    if (updated) {
      setFiles(newFiles);
      setSteps([...steps]); // force re-render
    }
  }, [steps, files]);

  /* ------------------------------------------------------
   * 2) Mount in WebContainer
   * ------------------------------------------------------ */
  useEffect(() => {
    if (!webcontainer) return;

    const createMountStructure = (items) => {
      const struct = {};

      const processItem = (item, isRoot) => {
        if (item.type === 'folder') {
          struct[item.name] = {
            directory: item.children
              ? Object.fromEntries(
                  item.children.map((c) => [c.name, processItem(c, false)])
                )
              : {}
          };
          return struct[item.name];
        } else {
          // file
          if (isRoot) {
            struct[item.name] = { file: { contents: item.content || '' } };
          } else {
            return { file: { contents: item.content || '' } };
          }
        }
      };

      items.forEach((x) => processItem(x, true));
      return struct;
    };

    webcontainer.mount(createMountStructure(files));
  }, [files, webcontainer]);

  /* ------------------------------------------------------
   * 3) On first mount, call template => parse => call LLM => parse => reply
   * ------------------------------------------------------ */
  useEffect(() => {
    async function init() {
      setLoading(true);

      try {
        // 1) Call template
        const response = await axios.post(`${BACKEND_URL}/template`, {
          prompt: prompt.trim()
        });
        const { prompts, uiPrompts } = response.data;

        // 2) Parse initial steps from UI prompt
        const initSteps = parseXml(uiPrompts[0]).map((st) => ({
          ...st,
          status: 'pending'
        }));
        setSteps(initSteps);

        // 3) Call LLM with "prompts" + final user prompt
        const chatRes = await axios.post(`${BACKEND_URL}/chat`, {
          messages: [...prompts, prompt].map((c) => ({ role: 'user', content: c }))
        });

        // 4) Parse new steps from LLM
        const newSteps = parseXml(chatRes.data.response).map((st) => ({
          ...st,
          status: 'pending'
        }));
        setSteps((prev) => [...prev, ...newSteps]);

        // 5) Summarize newly created files (no undefined) with numeric points
        const replyText = createNumberedFileList(newSteps, !hasSentInitialSummary);
        await streamChatMessages([replyText]);

        // If initial summary sent, update the flag
        if (!hasSentInitialSummary) {
          setHasSentInitialSummary(true);
        }

      } catch (error) {
        console.error('Initialization Error:', error);
        setChatMessages((prev) => [...prev, { role: 'assistant', content: 'An error occurred during initialization. Please try again.' }]);
      }

      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------
   * 4) Handle user sending a message
   * ------------------------------------------------------ */
  async function handleSend() {
    if (!userPrompt.trim()) return;

    // user message
    const userMsg = { role: 'user', content: userPrompt };
    setChatMessages((prev) => [...prev, userMsg]);
    setUserPrompt('');

    setLoading(true);
    try {
      // call LLM
      const chatResp = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...chatMessages, userMsg]
      });

      // parse steps
      const parsed = parseXml(chatResp.data.response).map((st) => ({
        ...st,
        status: 'pending'
      }));
      setSteps((prev) => [...prev, ...parsed]);

      // Summarize
      const reply = createNumberedFileList(parsed, !hasSentInitialSummary);
      await streamChatMessages([reply]);

      // If initial summary sent, update the flag
      if (!hasSentInitialSummary) {
        setHasSentInitialSummary(true);
      }

    } catch (error) {
      console.error('Chat Error:', error);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'An error occurred while processing your request. Please try again.' }]);
    }
    setLoading(false);
  }

  /* ------------------------------------------------------
   * 5) Stream chat messages one by one with delay
   * ------------------------------------------------------ */
  async function streamChatMessages(messages, delayMs = 1000) {
    for (let msg of messages) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      setChatMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
    }
  }

  /* ------------------------------------------------------
   * 6) Placeholder Functions for New Buttons
   * ------------------------------------------------------ */
  function createRepository() { // Renamed for clarity
    alert('Creating a new Git repository... (placeholder)');
  }

  function connectToSupabase() { // New function
    alert('Connecting to Supabase... (placeholder)');
  }

  function deployToNetlify() { // New function
    alert('Deploying to Netlify... (placeholder)');
  }

  /* ------------------------------------------------------
   * 7) Render
   * ------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e293b] to-[#0f172a] flex flex-col font-poppins">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex items-center justify-between shadow-lg">
        <h1 className="text-2xl font-bold text-white">CodeForge</h1>
        {/* Buttons Container */}
        <div className="flex space-x-2">
          {/* Create Repository Button */}
          <button
            onClick={createRepository}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition duration-200"
          >
            <FaGithub className="mr-2" /> {/* GitHub Icon */}
            Create Repository
          </button>
          {/* Connect to Supabase Button */}
          <button
            onClick={connectToSupabase}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition duration-200"
          >
            <SiSupabase className="mr-2" /> {/* Supabase Icon */}
            Connect to Supabase
          </button>
          {/* Deploy to Netlify Button */}
          <button
            onClick={deployToNetlify}
            className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow transition duration-200"
          >
            <SiNetlify className="mr-2" /> {/* Netlify Icon */}
            Deploy to Netlify
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section */}
        <div className="w-96 bg-[#1e1e2e] border-r border-gray-700 flex flex-col">
          <div className="flex-1 overflow-auto p-4">
            {chatMessages.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} content={msg.content} />
            ))}
            {loading && <Loader />}
          </div>
          <div className="p-4 border-t border-gray-700">
            <textarea
              rows={2}
              className="p-2 w-full bg-[#1e1e2e] text-gray-100 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Anything else?"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
            />
            <button
              onClick={handleSend}
              className="mt-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded hover:shadow-lg transition duration-200 w-full"
            >
              Send
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-[#0f172a]">
          <div className="flex flex-1 overflow-hidden">
            {/* File Explorer */}
            <div
              className={`w-64 bg-[#1e293b] border-r border-gray-700 p-4 overflow-auto ${
                activeTab === 'preview' ? 'hidden' : 'block'
              }`}
            >
              <FileExplorer files={files} onFileSelect={setSelectedFile} />
            </div>

            {/* Code Editor or Preview */}
            <div className="flex-1 p-4 flex flex-col">
              <TabView activeTab={activeTab} onTabChange={setActiveTab} />

              {activeTab === 'preview' && (
                <div className="flex items-center space-x-4 mb-2">
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`inline-flex items-center px-3 py-1 border rounded ${
                      previewMode === 'mobile'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <FaMobileAlt className="mr-2" />
                    Mobile
                  </button>
                  <button
                    onClick={() => setPreviewMode('web')}
                    className={`inline-flex items-center px-3 py-1 border rounded ${
                      previewMode === 'web'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <FaDesktop className="mr-2" />
                    Web
                  </button>
                  {/* Removed the Deploy to Git button from here */}
                </div>
              )}

              <div className="flex-1 overflow-auto mt-2 bg-[#121212] rounded flex justify-center items-center">
                {activeTab === 'code' ? (
                  <CodeEditor
                    file={selectedFile}
                    onCodeChange={(path, newContent) => {
                      setFiles((prev) =>
                        prev.map((f) =>
                          f.path === path ? { ...f, content: newContent } : f
                        )
                      );
                    }}
                  />
                ) : (
                  <div className="flex justify-center items-center w-full h-full overflow-hidden">
                    {loading ? (
                      <div className="text-gray-400 animate-pulse">
                        <p>Loading Preview...</p>
                      </div>
                    ) : previewMode === 'mobile' ? (
                      <div
                        className="border border-gray-600 rounded shadow-lg overflow-hidden"
                        style={{ width: '375px', height: '667px' }} // Fixed size for mobile
                      >
                        <PreviewFrame webContainer={webcontainer} files={files} />
                      </div>
                    ) : (
                      <div
                        className="border border-gray-600 rounded shadow-lg overflow-hidden"
                        style={{ width: '960px', height: '540px' }} // Fixed size for web
                      >
                        <PreviewFrame webContainer={webcontainer} files={files} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Terminal Section */}
          <div className="h-64 bg-[#1e1e2e] p-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold">Terminal</span>
              <button
                className="text-white border border-gray-500 rounded px-2 py-1 hover:bg-gray-700 transition"
                onClick={addTerminal}
              >
                +
              </button>
            </div>
            <div className="h-full overflow-x-auto flex space-x-4">
              {terminals.map((tid) => (
                <div
                  key={tid}
                  className="flex-shrink-0 w-96 border border-gray-600 rounded bg-[#121212] p-2"
                >
                  <Terminal />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
