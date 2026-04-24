# System Architecture Specification

This document provides a deep technical analysis of the RepoMind architecture, design patterns, and data flow.

## 1. High-Level Design

RepoMind is built as a **Local-First Static Application**. It bypasses the need for a backend proxy by implementing secure, client-side adapters for all major LLM providers.

### 1.1 Core Principles
- **Privacy by Design**: API keys are stored in `localStorage` and optionally encrypted. No data is sent to intermediate servers.
- **Interaction Priority**: Using React 19's `useTransition` and `useOptimistic` to ensure the UI remains fluid during heavy network I/O.
- **Modular Adapters**: New LLM providers can be added by implementing the `LLMProvider` interface.

---

## 2. Data Flow & Orchestration

The application uses a **Streaming Orchestrator** to handle responses.

### 2.1 The Response Pipeline
1. **Input Capture**: User prompt is normalized and combined with repository context (file contents, structure).
2. **Context Compression**: Relevant file snippets are prioritized based on token limits.
3. **Provider Selection**: The `LLMFactory` instantiates the correct adapter (Google, Anthropic, etc.).
4. **Dual-Track Streaming**:
   - **Track A**: Model output (Text/Markdown).
   - **Track B**: Internal "Thinking" or metadata (for models like DeepSeek R1 or Gemini 2.0).

---

## 3. State Management Strategy

We use **Zustand** for global state management, partitioned into specialized stores:

- **Config Store**: Handles API keys, provider settings, and model capabilities.
- **Chat Store**: Manages conversation history, streaming state, and optimistic message updates.
- **UI Store**: Controls application appearance (Dark/Light mode), modals, and sidebar state.
- **Repo Store**: Tracks uploaded files and repository metadata.

---

## 4. Security Model

### 4.1 Key Management
Keys are handled through the `EncryptionService`, which provides an abstraction layer for storage.
- **Development**: Keys are stored as raw strings in `localStorage` for ease of use.
- **Production-Ready**: Interface supports AES-GCM encryption if a master password is provided by the user.

---

## 5. UI/UX Engine

### 5.1 Animation Systems
- **GSAP**: Used for complex sequence animations and entrance choreography.
- **Framer Motion**: Used for declarative UI transitions (modals, list reordering, sidebars).

### 5.2 Visualization
- **Mermaid.js**: Integrated as a dynamic renderer. The system detects mermaid code blocks in LLM responses and automatically renders them as interactive SVG diagrams.

---

## 6. Development Workflow

- **Integrity Gate**: A pre-merge script (`scripts/integrity-gate.sh`) that runs Lint, Type-Check, and Vitest suites.
- **Static Export**: The app is optimized for `next export`, allowing deployment on GitHub Pages, Vercel, or Netlify with zero configuration.
