<div align="center">
  <img src="public/favicon.png" width="120" height="120" alt="RepoMind Logo" />
  <h1>RepoMind</h1>
  <p><strong>Advanced Code Intelligence & Repository Orchestration</strong></p>

  <p>
    <a href="https://repo-mind-one.vercel.app/">
      <img src="https://img.shields.io/badge/Live-Deployment-6366f1?style=for-the-badge&logo=vercel" alt="Live Demo" />
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Status-Production--Ready-black?style=flat-square" alt="Status" />
    <img src="https://img.shields.io/badge/Architecture-Local--First-blue?style=flat-square" alt="Architecture" />
    <img src="https://img.shields.io/badge/Security-Zero--Knowledge-green?style=flat-square" alt="Security" />
    <img src="https://img.shields.io/badge/License-MIT-gray?style=flat-square" alt="License" />
  </p>
</div>

---

## Technical Overview

**RepoMind** is a state-of-the-art repository intelligence engine designed for developers who require deep, context-aware analysis of complex codebases. Unlike traditional AI wrappers, RepoMind leverages a **Multi-Track Orchestration Engine** to handle simultaneous reasoning and generation, providing real-time architectural insights and automated diagramming.

### Core Capabilities

- **Unified LLM Adapter**: Direct, secure integration with Gemini 2.0 (Thinking), GPT-4o, Claude 3.5+, and DeepSeek R1.
- **Architectural Visualization**: Automated Mermaid.js diagram generation via natural language requests.
- **Data Sovereignty**: Zero-server architecture ensures API keys and repository data never leave the client environment.
- **Performance Optimized**: 60fps glassmorphic UI driven by Framer Motion and TanStack Virtualization.

---

## Interface Showcase

<div align="center">
  <h3>Neural Hub (Desktop)</h3>
  <img src="public/docs/screenshots/dashboard_dark.png" width="800" alt="Neural Hub Desktop" />
  <br/><br/>
  <table>
    <tr>
      <td align="center"><b>Mobile Dashboard</b></td>
      <td align="center"><b>Mobile Sidebar</b></td>
    </tr>
    <tr>
      <td><img src="public/docs/screenshots/mobile_dark.png" width="400" alt="Mobile Dashboard" /></td>
      <td><img src="public/docs/screenshots/mobile_sidebar.png" width="400" alt="Mobile Sidebar" /></td>
    </tr>
  </table>
  <br/>
  <table>
    <tr>
      <td align="center"><b>Usage Insights (Dark)</b></td>
      <td align="center"><b>Usage Insights (Light)</b></td>
    </tr>
    <tr>
      <td><img src="public/docs/screenshots/usage_insights_dark.png" width="400" alt="Usage Insights Dark" /></td>
      <td><img src="public/docs/screenshots/usage_insights_light.png" width="400" alt="Usage Insights Light" /></td>
    </tr>
  </table>
  <br/>
  <table>
    <tr>
      <td align="center"><b>API & Security (Dark)</b></td>
      <td align="center"><b>API & Security (Light)</b></td>
    </tr>
    <tr>
      <td><img src="public/docs/screenshots/api_security_dark.png" width="400" alt="API Security Dark" /></td>
      <td><img src="public/docs/screenshots/api_security_light.png" width="400" alt="API Security Light" /></td>
    </tr>
  </table>
</div>

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Next.js 16, TypeScript 5 |
| **Styling** | Tailwind CSS v4, Framer Motion |
| **State** | Zustand, TanStack Query |
| **Graphics** | Mermaid.js, Lucide Icons |
| **Infrastructure** | Vercel (Production), GitHub Actions (CI/CD) |

---

## Architecture Design

RepoMind implements a robust, event-driven architecture that prioritizes user safety and interaction speed.

```mermaid
graph TD
    User[Developer] -->|Input| UI[Orchestration Layer]
    UI -->|Stream| Store[Zustand State Engine]
    Store -->|Encrypted| Local[LocalStorage]
    UI -->|Adapter| Providers[LLM Gateways]
    
    subgraph "Intelligent Providers"
        Providers --> G[Google Gemini]
        Providers --> O[OpenAI]
        Providers --> A[Anthropic]
        Providers --> D[DeepSeek]
    end
    
    UI -->|Render| Viz[Mermaid Engine]
```

Detailed technical specifications can be found in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/majdjadalhaq/RepoMind.git
   cd RepoMind
   ```

2. **Initialize Environment**
   ```bash
   npm install
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```

4. **Production Build**
   ```bash
   npm run build
   ```

---

## Resilience & Quality

- **Error Boundaries**: Global crash recovery with persistent state preservation.
- **Accessibility**: WAI-ARIA compliant components with keyboard-first navigation.
- **Responsive Design**: Fluid layouts optimized for ultra-wide monitors and mobile devices.

---

## Contributing

We maintain strict quality gates for contributions. Please ensure:
- **TypeScript**: No `any` types allowed.
- **Performance**: No layout thrashing or unnecessary re-renders.
- **Security**: Client-side logic only; no server-side key handling.

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

<div align="center">
  <sub>Developed for the next generation of code intelligence.</sub>
</div>
