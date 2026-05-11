# SentryQA - Senior Strategic QA Architect

SentryQA is an AI-powered QA strategy and testing tool that decomposes complex requirements into bulletproof validation strategies.

## Local Development Setup

To run this project on your local machine, follow these steps:

### Prerequisites

- **Node.js**: Ensure you have Node.js (v18 or later) installed.
- **npm**: Standard Node package manager.

### Installation

1. **Clone or Download**: Export your code from AI Studio (Settings > Export as ZIP) and extract it to a folder.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Environment Setup**:
   - Create a `.env` file in the root directory.
   - Copy the contents from `.env.example`:
     ```bash
     cp .env.example .env
     ```
   - Ensure your `GEMINI_API_KEY` is set in the `.env` file. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Running the App

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## AI Studio Integration & Remixing

This project is optimized for the **Google AI Studio** environment:

- **Automatic Key Fallback**: The app first checks if you've provided a custom API key in the settings menu. If not, it automatically falls back to `process.env.GEMINI_API_KEY`.
- **User Secrets & Remixing**: When another user remixes (clones) this project in AI Studio, they don't need to configure anything. AI Studio securely injects their own `GEMINI_API_KEY` from their workspace secrets into the app's environment. This ensures that:
  - Your secrets are never shared.
  - Remixers have a "plug-and-play" experience using their own quota.

## Key Features

- **AI Requirement Analysis**: Generates test cases, edge cases, and automated test strategies.
- **Mermaid Diagrams**: Visualizes logic flows and system components.
- **Custom API Key Support**: Users can provide their own Gemini API key via the settings gear icon.
- **Export Options**: Export analysis results to PDF or Word documents.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **AI**: Google Gemini API (@google/genai)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Diagrams**: Mermaid.js
