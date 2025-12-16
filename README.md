# 🎯 Triads

<div align="center">

**A word puzzle game where you identify keywords that link three cue words to form a Triad**

[![Angular](https://img.shields.io/badge/Angular-20.1.6-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-Private-lightgrey.svg)]()

</div>

---

## 📖 About

Triads is a single-player, untimed word puzzle game where you identify a single keyword that links three different cue words to form a **Triad**. Once you solve three initial Triads, the three keywords become your final challenge—solve all four Triads to win!

The game features beautiful physics-based bubble animations, smooth gameplay, and comprehensive statistics tracking—all without requiring any login or personal information.

---

## 🎮 How to Play

### The Basics

You're given **9 bubbles** containing words or phrases called **cues**. Your goal is to find **3 cues** that share a common **key word** to form a **3-word Triad**. A key is a stand-alone word uniquely shared by the 3 cues.

**Example:** `SECOND-`, `POKER`, `SHAKE` → The key word is **"HAND"**, completing:

- SECOND-**HAND**
- POKER **HAND**
- **HAND**SHAKE

### Game Flow

1. **Initial State**: Start with 9 cue words in floating bubbles
2. **Find a Triad**: Select three cues that share a common keyword
3. **Solve the Triad**: Enter your guess for the keyword
4. **Repeat**: Solve a second and third Triad
5. **Final Challenge**: The three keywords from the first three Triads become new cues for the final, fourth Triad
6. **Win**: Solve all four Triads to win the game!

### Hints and Turns

- **3 turns** and **2 hints** available (any combination)
- **Miss a guess** = lose a turn
- **Take a hint** = lose a turn

**Hint Types:**

- **When 9 or 6 cues remain**: Highlights a Triad and shows the keyword length
- **When 3 cues remain**: Also shows the keyword's first letter

---

## 🏆 Scoring System

Every game is scored, tallied, and averaged. Your performance is tracked in your stats!

| Outcome           | Points | Description                                  |
| ----------------- | ------ | -------------------------------------------- |
| 🎯 **Perfect!**   | **15** | All 4 Triads solved with no misses, no hints |
| 😊 **Prideful**   | **12** | All 4 solved with either 1 miss or 1 hint    |
| 👍 **Proficient** | **10** | All 4 solved with 2 misses and/or hints      |
| ✅ **Passable**   | **8**  | Got 3 Triads, but couldn't solve the bonus   |
| 😕 **Piss-poor**  | **6**  | Got 2 Triads, no bonus round                 |
| 😢 **Pitiable**   | **3**  | Got 1 Triad before using up turns            |
| 💀 **Painful**    | **0**  | Went down in flames                          |

---

## 👤 Your Account

Triads has **no enrollment**—you never need to login or reveal anything about yourself!

- **First Visit**: You're given a randomly generated silly name (e.g., `HappyPenguin42`)
- **Change Your Name**: Click your name anytime to change it
- **View Stats**: Click your name to see your overall success rate, score distribution, and game history
- **New Identity**: Start fresh with a new username anytime
- **Local Storage**: Your progress is saved locally in your browser

---

## 🛠️ Tech Stack

### Core Framework

- **[Angular](https://angular.io/)** 20.1.6 - Modern web framework
- **[TypeScript](https://www.typescriptlang.org/)** 5.8 - Type-safe JavaScript
- **[NgRx Signals](https://ngrx.io/)** - Reactive state management

### Styling & UI

- **[Tailwind CSS](https://tailwindcss.com/)** 4.1 - Utility-first CSS framework
- **[DaisyUI](https://daisyui.com/)** - Component library for Tailwind
- **[Angular Material](https://material.angular.io/)** - Material Design components

### Animations & Effects

- **[GSAP](https://greensock.com/gsap/)** - High-performance animations
- **[Lottie](https://lottiefiles.com/)** - JSON-based animations
- **[Matter.js](https://brm.io/matter-js/)** - Physics engine for bubble interactions

### Charts & Visualization

- **[AG Charts](https://www.ag-grid.com/charts/)** - Data visualization for statistics

### Development Tools

- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Husky](https://typicode.github.io/husky/)** - Git hooks
- **[Commitlint](https://commitlint.js.org/)** - Commit message linting
- **[MSW](https://mswjs.io/)** - API mocking for development

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** (recommended) or npm/yarn

### Installation

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd triads-frontend
    ```

2. **Install dependencies**

    ```bash
    pnpm install
    ```

3. **Configure environment**

    Update `src/environments/environment.ts` with your API URL:

    ```typescript
    export const environment = {
    	production: false,
    	apiUrl: 'http://localhost:3000/api',
    	timeout: 10000,
    }
    ```

4. **Start development server**

    ```bash
    pnpm start
    ```

    Navigate to `http://localhost:4200/`

### Available Scripts

| Command       | Description               |
| ------------- | ------------------------- |
| `pnpm start`  | Start development server  |
| `pnpm build`  | Build for production      |
| `pnpm test`   | Run unit tests            |
| `pnpm lint`   | Lint and fix code         |
| `pnpm format` | Format code with Prettier |

---

## 🎨 Features

### Game Features

- ✨ **Physics-based animations** - Bubbles float and interact using Matter.js
- 🎬 **Smooth transitions** - GSAP-powered animations for game state changes
- 🎭 **Lottie animations** - Beautiful JSON animations for loading, success, and more
- 💡 **Smart hints** - Context-aware hints that adapt to game state
- 📊 **Statistics tracking** - Comprehensive stats with visual charts
- 🎯 **Solution reveal** - See solutions for unsolved triads when you lose

### User Experience

- 📱 **Responsive design** - Works seamlessly on desktop, tablet, and mobile
- 🎨 **Modern UI** - Clean, intuitive interface built with Tailwind CSS
- ⚡ **Fast performance** - Optimized with Angular's standalone components
- 💾 **Local storage** - Progress saved automatically in your browser
- 🔄 **State management** - Reactive state with NgRx Signals

---

## 🧪 Development

### Code Quality

This project follows strict code quality standards:

- **ESLint** - Configured via `eslint.config.mjs`
- **Prettier** - Automatic code formatting
- **Husky** - Pre-commit hooks for linting and formatting
- **Commitlint** - Enforces conventional commit messages

### Best Practices

- ✅ **Standalone Components** - All components are standalone
- ✅ **Signals** - Reactive state management with Angular Signals
- ✅ **Tailwind CSS** - Styling done exclusively with Tailwind classes
- ✅ **TypeScript** - Strict type checking enabled
- ✅ **OnPush Change Detection** - Optimized performance

<div align="center">

**Happy Triad Solving! 🎯**

</div>
