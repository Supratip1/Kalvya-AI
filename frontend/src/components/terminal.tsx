import React, { useState } from 'react';

const Terminal: React.FC = () => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');

  const handleRunCommand = async () => {
    try {
      const response = await fetch('http://localhost:5000/run-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const data = await response.json();

      if (data.error) {
        setOutput(`Error: ${data.error}`);
      } else {
        setOutput(data.output);
      }
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1e1e1e', color: '#c7c7c7' }}>
      <h2>Terminal</h2>
      <div style={{ display: 'flex', marginBottom: '10px' }}>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter npm command"
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '5px',
          }}
        />
        <button
          onClick={handleRunCommand}
          style={{
            marginLeft: '10px',
            padding: '10px 20px',
            backgroundColor: '#007acc',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          Run
        </button>
      </div>
      <pre
        style={{
          padding: '10px',
          backgroundColor: '#111',
          color: '#0f0',
          border: '1px solid #333',
          borderRadius: '5px',
          overflow: 'auto',
          maxHeight: '200px',
        }}
      >
        {output || 'Output will appear here...'}
      </pre>
    </div>
  );
};

export default Terminal;
