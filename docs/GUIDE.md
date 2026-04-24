# User & Integration Guide

Welcome to RepoMind. This guide will help you master the tool and integrate it into your development workflow.

## 1. Getting Started

### 1.1 Setting Up API Keys
1. Open the **Settings** modal (Gear icon in the sidebar).
2. Enter your API keys for the providers you wish to use:
   - **Google Gemini**: Get keys from [AI Studio](https://aistudio.google.com/).
   - **Anthropic**: Get keys from [Anthropic Console](https://console.anthropic.com/).
   - **OpenAI**: Get keys from [OpenAI Dashboard](https://platform.openai.com/).
   - **DeepSeek**: Get keys from [DeepSeek Platform](https://platform.deepseek.com/).

### 1.2 Connecting Your Code
- **Local Files**: Use the "Add Files" button to upload specific files for analysis.
- **Whole Repository**: Drag and drop a folder (if supported by your browser) or select all files to provide full project context.

---

## 2. Advanced Features

### 2.1 Design Mode (Architecture Diagrams)
RepoMind can automatically generate diagrams. Try asking:
> "Generate a Mermaid diagram showing the authentication flow of this project."

The system will render an interactive diagram that you can download or copy.

### 2.2 Reasoning Mode (Deep Thinking)
For complex debugging, switch to **Reasoning Mode** (Brain icon). This uses models like **DeepSeek R1** or **Gemini 2.0 Thinking** to perform multi-step logical analysis before providing an answer.

---

## 3. Power User Tips

- **Context Pinning**: You can "pin" specific files to keep them in the context of every message, even if you switch topics.
- **Markdown Export**: Click the **Download** icon on any message to save the analysis as a `.md` file for your own documentation.
- **Theme Switching**: Use the theme toggle in the sidebar or landing page to switch between **Monochrome Dark** and **Light High-Contrast** modes.

---

## 4. Troubleshooting

### 4.1 Response Terminated
If a response stops unexpectedly, it may be due to:
- **Token Limits**: The repository context might be too large for the selected model.
- **Network Timeout**: Check your internet connection.
- **Invalid Key**: Verify your API keys in the settings.

### 4.2 UI Glitches
If the UI becomes unresponsive, use the **Reboot** button in the top corner (if the error boundary triggers) or refresh the page. Your keys and history are persisted locally.

---

## 5. Security & Privacy

RepoMind is designed with a **Zero-Server** philosophy.
- **No Analytics**: We do not track your prompts or code.
- **No Database**: Your history is stored only on your machine.
- **Direct Connection**: Your browser talks directly to Google/OpenAI/Anthropic APIs.
