// src/components/Builder.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StepsList } from '../components/StepsList';
import { FileExplorer } from '../components/FileExplorer';
import { TabView } from '../components/TabView';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import { Step, FileItem, StepType } from '../types';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import { FileNode } from '@webcontainer/api';
import { Loader } from '../components/Loader';
import Terminal from '../components/terminal';

const MOCK_FILE_CONTENT = `// This is a sample file content
import React from 'react';

function Component() {
  return <div>Hello World</div>;
}

export default Component;`;

export function Builder() {
  const location = useLocation();
  const { prompt } = location.state as { prompt: string };
  const [userPrompt, setPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<{ role: "user" | "assistant", content: string; }[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps.filter(({ status }) => status === "pending").forEach(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
        let currentFileStructure = [...originalFiles]; // {}
        let finalAnswerRef = currentFileStructure;

        let currentFolder = ""
        while (parsedPath.length) {
          currentFolder = `${currentFolder}/${parsedPath[0]}`;
          let currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);

          if (!parsedPath.length) {
            // final file
            let file = currentFileStructure.find(x => x.path === currentFolder)
            if (!file) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code
              })
            } else {
              file.content = step.code;
            }
          } else {
            /// in a folder
            let folder = currentFileStructure.find(x => x.path === currentFolder)
            if (!folder) {
              // create the folder
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: []
              })
            }

            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
          }
        }
        originalFiles = finalAnswerRef;
      }

    })

    if (updateHappened) {
      setFiles(originalFiles)
      setSteps(steps => steps.map((s: Step) => ({
        ...s,
        status: "completed"
      })))
    }
    console.log(files);
  }, [steps, files]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};

      const processFile = (file: FileItem, isRootFolder: boolean) => {
        if (file.type === 'folder') {
          // For folders, create a directory entry
          mountStructure[file.name] = {
            directory: file.children ?
              Object.fromEntries(
                file.children.map(child => [child.name, processFile(child, false)])
              )
              : {}
          };
        } else if (file.type === 'file') {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || ''
              }
            };
          } else {
            // For files, create a file entry with contents
            return {
              file: {
                contents: file.content || ''
              }
            };
          }
        }

        return mountStructure[file.name];
      };

      // Process each top-level file/folder
      files.forEach(file => processFile(file, true));

      return mountStructure;
    };

    const mountStructure = createMountStructure(files);

    // Mount the structure if WebContainer is available
    console.log(mountStructure);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  const handleCodeChange = (path: string, newContent: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.path === path
          ? { ...file, content: newContent }
          : file
      )
    );
  };

  async function init() {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt.trim()
    });
    setTemplateSet(true);

    const { prompts, uiPrompts } = response.data;

    setSteps(parseXml(uiPrompts[0]).map((x: Step) => ({
      ...x,
      status: "pending"
    })));

    setLoading(true);
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      messages: [...prompts, prompt].map(content => ({
        role: "user",
        content
      }))
    })

    setLoading(false);

    setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
      ...x,
      status: "pending" as "pending"
    }))]);

    setLlmMessages([...prompts, prompt].map(content => ({
      role: "user",
      content
    })));

    setLlmMessages(x => [...x, { role: "assistant", content: stepsResponse.data.response }])
  }

  useEffect(() => {
    init();
  }, [])

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col font-poppins">
      <header className="bg-[#007acc] border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-100">CodeForge</h1> {/* Updated Title */}
        <p className="text-sm text-gray-300">Prompt: {prompt}</p>
      </header>

      <div className="flex-1 overflow-hidden">
        {/* Adjusted Grid Columns from 5 to 6 */}
        <div className="h-full grid grid-cols-6 gap-4 p-4">
          {/* Steps List */}
          <div className="col-span-1 space-y-4 overflow-auto bg-[#252526] rounded-lg p-3 shadow-lg">
            <div className="max-h-[75vh] overflow-y-auto">
              <StepsList
                steps={steps}
                currentStep={currentStep}
                onStepClick={setCurrentStep}
              />
            </div>
            <div className="mt-4">
              <div className='flex flex-col space-y-2'>
                {(loading || !templateSet) && <Loader />}
                {!(loading || !templateSet) && (
                  <>
                    <textarea
                      value={userPrompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className='p-2 w-full bg-[#1e1e1e] text-gray-100 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder="Enter your prompt here..."
                      rows={3}
                    ></textarea>
                    <button
                      onClick={async () => {
                        const newMessage = {
                          role: "user" as "user",
                          content: userPrompt
                        };

                        setLoading(true);
                        const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
                          messages: [...llmMessages, newMessage]
                        });
                        setLoading(false);

                        setLlmMessages(x => [...x, newMessage, {
                          role: "assistant",
                          content: stepsResponse.data.response
                        }]);

                        setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
                          ...x,
                          status: "pending" as "pending"
                        }))]);

                        setPrompt(""); // Clear input after sending
                      }}
                      className='bg-[#007acc] text-white px-4 py-2 rounded hover:bg-[#005a9e] transition duration-200'
                    >
                      Send
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* File Explorer */}
          <div className="col-span-1 bg-[#252526] rounded-lg shadow-lg p-2 overflow-auto"> {/* Further reduced padding for narrower width */}
            <FileExplorer
              files={files}
              onFileSelect={setSelectedFile}
            />
          </div>

          {/* Code Editor & Preview */}
          <div className="col-span-4 bg-[#1e1e1e] rounded-lg shadow-lg p-4 flex flex-col">
            {/* Tab View */}
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-[#1e1e1e] rounded mt-2">
              {activeTab === 'code' ? (
                <CodeEditor file={selectedFile} onCodeChange={handleCodeChange} />
              ) : (
                <PreviewFrame webContainer={webcontainer} files={files} />
              )}
            </div>

            {/* Terminal */}
            <div className="mt-4 bg-[#1e1e1e] rounded p-2 border-t border-gray-700 h-40 overflow-hidden">
              <Terminal />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
