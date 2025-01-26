# AI Website Builder

AI Website Builder is a platform designed to transform natural language prompts into fully functional and deployable web applications. This project leverages cutting-edge technologies like React, TypeScript, WebContainers, Node.js, and AI integrations to streamline the web development process.

---

## Features

- **Natural Language to Web App**: Generate complete web applications using simple text prompts.
- **Real-Time Execution**: Powered by WebContainers for running Node.js directly in the browser.
- **AI-Driven**: Utilizes Claude AI SDK for advanced natural language processing.
- **Modular Architecture**: A clear separation of concerns with distinct backend, frontend, and terminal components.

---

## File Structure

```
AI-Website-Builder/
├── backend/               # Node.js backend logic
│   └── ...                # API and service files
├── be/node_modules/       # Backend dependencies
├── frontend/              # React and TypeScript-based frontend
│   └── ...                # UI components, pages, and assets
├── terminal-backend/      # Code for handling terminal-like functionality
├── README.md              # Documentation
├── package-lock.json      # Dependency lockfile
```

---

## Getting Started

### Prerequisites
- **Node.js**: v16+
- **npm**: v8+
- **Supported Browser**: Chrome or Edge (WebContainer compatibility)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/AI-Website-Builder.git
   cd AI-Website-Builder
   ```

2. Navigate to the backend and frontend directories, and install dependencies:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. Start both the backend and frontend servers:
   - Backend:
     ```bash
     cd backend
     npm start
     ```
   - Frontend:
     ```bash
     cd frontend
     npm start
     ```

4. Open your browser and navigate to the displayed URL.

---

## Tech Stack

- **Frontend**: React, TypeScript
- **Backend**: Node.js, Express
- **Runtime Environment**: WebContainers
- **AI Integration**: Claude AI SDK

---

## Contributing

Feel free to contribute! Open an issue or submit a pull request if you have ideas for new features or fixes.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Contact

**Author**: Supratip Bhattacharya  
**Email**: supratipbhattacharya2@gmail.com  
**Portfolio**: [supratip.tech](https://www.supratip.tech)
