# Contributing to RepoMind

First off, thank you for considering contributing to RepoMind! It's people like you that make RepoMind such a great tool.

## 1. Code of Conduct

By participating in this project, you agree to abide by the terms of our Code of Conduct. We expect all contributors to be respectful and professional.

## 2. Getting Started

### 2.1 Branching Strategy
We use a strict **Feature-Branch** workflow:
1. **Fork** the repository and clone it locally.
2. Create a new branch from `master`: `git checkout -b feat/your-feature-name`.
3. Keep your commits atomic and descriptive following [Conventional Commits](https://www.conventionalcommits.org/).

### 2.2 Local Development
```bash
npm install
npm run dev
```

---

## 3. Technical Standards

### 3.1 TypeScript & Code Quality
- **No `any`**: All variables and function parameters must be typed. Use `unknown` with type guards if necessary.
- **Strict Mode**: Ensure `tsc` passes with 0 errors.
- **Linting**: Run `npm run lint` before committing. We enforce a zero-warning policy.

### 3.2 UI/UX Guidelines
- **Premium Aesthetics**: All new components must adhere to the monochrome glassmorphic design system.
- **Animations**: Use `motion/react` for UI transitions and `GSAP` for complex sequences. Always include cleanup logic (`ctx.revert()`).
- **Responsive**: All features must work on mobile, tablet, and desktop (ultra-wide).

### 3.3 Privacy First
- **Client-Side Only**: Do NOT implement any features that require a backend server for processing repository data or API keys.
- **Encryption**: Any storage of sensitive data must use the `EncryptionService`.

---

## 4. Submission Process

1. **Pull Request**: Open a PR against the `master` branch.
2. **Description**: Clearly explain the purpose of the changes and link any related issues.
3. **Integrity Gate**: Your PR must pass all CI/CD checks (Lint, Type-Check, Tests).
4. **Review**: At least one maintainer must approve the PR before merging.

---

## 5. Development Scripts

- `npm run dev`: Start the development server.
- `npm run build`: Build the production-ready static site.
- `npm run lint`: Run ESLint checks.
- `npm run test`: Execute the Vitest suite.

---

Thank you for helping make RepoMind better!
