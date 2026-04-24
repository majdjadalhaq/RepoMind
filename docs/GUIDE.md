# User & Integration Guide

Welcome to RepoMind. This guide will help you master the tool and integrate it into your development workflow.

---

## 1. Getting Started

### 1.1 Setting Up API Keys
1. Open the **[CONFIG] Settings** modal (Gear icon in the sidebar).
2. Enter your API keys for the providers you wish to use:
   - **Google Gemini**: Get keys from [AI Studio](https://aistudio.google.com/).
   - **Anthropic**: Get keys from [Anthropic Console](https://console.anthropic.com/).
   - **OpenAI**: Get keys from [OpenAI Dashboard](https://platform.openai.com/).
   - **DeepSeek**: Get keys from [DeepSeek Platform](https://platform.deepseek.com/).

### 1.2 Connecting Your Code
- **[UPLOAD] Local Files**: Use the "Add Files" button to upload specific files for analysis.
- **[SYNC] Whole Repository**: Drag and drop a folder or select multiple files to provide full project context.

---

## 2. Advanced Features

### 2.1 Design Mode (Architecture Diagrams)
RepoMind can automatically generate diagrams. Try asking:
> "Generate a Mermaid diagram showing the authentication flow of this project."

The system will render an interactive diagram that you can download or copy.

### 2.2 Reasoning Mode (Deep Thinking)
For complex debugging, switch to **[BRAIN] Reasoning Mode**. This uses models like **DeepSeek R1** or **Gemini 2.0 Thinking** to perform multi-step logical analysis before providing an answer.

---

## 3. Power User Tips

- **[PIN] Context Pinning**: Keep critical files in memory across all conversation turns.
- **[DOCS] Markdown Export**: Export any analysis turn directly to a `.md` file.
- **[THEME] Visual Personalization**: Seamlessly toggle between **Monochrome Dark** and **Light High-Contrast** modes.

---

## 4. Troubleshooting

### 4.1 Response Terminated
If a response stops unexpectedly, it may be due to:
- **[LIMIT] Token Overflow**: Repository context exceeding model limits.
- **[NET] Timeout**: Interrupted connection to provider gateways.
- **[AUTH] Invalid Key**: Credential mismatch in configuration.

### 4.2 System Recovery
If the UI becomes unresponsive, the **[REBOOT] Global Boundary** will allow you to refresh while preserving encrypted session data.

---

## 5. Security & Privacy

RepoMind is built on a **Zero-Server** philosophy.
- **[DATA] No Analytics**: Zero tracking of prompts or codebase signatures.
- **[LOCAL] Local Storage**: Encryption-ready persistence for history and keys.
- **[DIRECT] Gateway**: Browser-to-API direct communication (No proxy).

---

<div align="center">
  <sub>User Guide v1.0.0</sub>
</div>
