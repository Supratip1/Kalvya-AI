const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API to run commands
app.post('/run-command', (req, res) => {
  const { command } = req.body;

  // Validate the command to prevent dangerous operations
  if (!command.startsWith('npm install')) {
    return res.status(400).send('Only npm install commands are allowed.');
  }

  exec(command, { cwd: './sandbox' }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      return res.status(400).json({ error: stderr });
    }
    return res.status(200).json({ output: stdout });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
