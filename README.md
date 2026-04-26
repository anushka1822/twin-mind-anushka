# TwinMind — Live Suggestions

A purely client-side AI meeting copilot that listens to live audio, generates contextual suggestions on the fly, and lets you deep-dive into the conversation via chat.

---

### 🚀 Setup & Quick Start
1.  **Install dependencies**: `npm install`
2.  **Run locally**: `npm run dev`
3.  **Configure**: Open the app in your browser. You'll hit a settings modal first—paste your Groq API key there. It saves to your browser's local storage so you don't have to deal with .env files.

---

### 🏗️ Stack Choices
*   **React + Vite**: I went with Vite for a fast, snappy Single Page Application. It handles the live audio and state changes easily and keeps the architecture brutally simple.
*   **Zustand**: I picked Zustand for global state management. Between chunking audio, polling the LLM, and updating the chat history, there are a lot of asynchronous updates happening at once. Zustand keeps the state clean without the boilerplate or re-render issues you get with React Context.
*   **Tailwind CSS**: Used for styling to quickly match the layout requirements.

---

### 🧠 Prompt Strategy
Getting an open-source 120B model to behave inside a strict UI required some heavy prompt engineering:

*   **Dynamic JSON Generation**: For the live suggestions, I locked the model down to output strict JSON arrays. I instructed it to analyze the recent transcript and dynamically pick the right suggestion type (e.g., generating an answer if someone just asked a question, or a `fact_check` for a bold claim).
*   **The "Hidden Query" Pattern**: To keep the middle column visually clean, the LLM generates a short `ui_preview` for the card, and a much longer, detailed `editable_chat_text`. When you click a card, the detailed text drops into your chat box so you can tweak it before sending.
*   **UI-Aware Chat Responses**: Open-source models love generating massive markdown tables and giant headers. I explicitly forbade those in the chat system prompt, forcing the LLM into a concise, bulleted, conversational format that actually looks good in a narrow chat column.

---

### ⚖️ Tradeoffs & Future Scaling
*   **Audio Chunking vs. Streaming**: Right now, I'm using the browser's native `MediaRecorder` API to slice audio into 30-second chunks for Whisper. It works surprisingly well for an MVP, but stopping and starting the recorder can drop tiny fractions of a second of audio. At production scale, I'd swap this for a continuous WebSocket stream to a dedicated ingest server.
*   **Client-Side API Calls**: Since the assignment specifically required users to paste their own API key in the UI, I kept the architecture entirely client-side. It makes deployment frictionless and keeps latency incredibly low. Obviously, in a real SaaS environment where TwinMind provides the API keys, I'd migrate the Groq calls to a secure backend proxy to protect the credentials and handle rate-limiting.
