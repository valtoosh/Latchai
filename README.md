# Latchai 🤖💬

**AI-powered Hinge conversation assistant** that helps you craft authentic, engaging messages and personalized pickup lines.

## Features

### 🎯 AI-Powered Signature Vibe
- **5-Step Personality Assessment** (27 questions) analyzes your:
  - Interests & hobbies
  - Communication style & humor
  - Values & dealbreakers
  - Dating approach & preferences
  - Personal philosophy
- **AI-Generated Profile** creates your unique vibe tagline, personality traits, and personalized pickup lines
- Retake assessment anytime to refresh your vibe

### 💬 Smart Conversation Assistant
- **Context-Aware Suggestions** using RAG (Retrieval-Augmented Generation) with 29,852 real conversation examples
- **Personality-Matched Responses** that mirror your authentic tone
- Message analysis and improvement recommendations
- Real-time AI chat for brainstorming replies

### 📊 Match Management
- Import and manage Hinge matches
- Track conversation history
- Store match details and preferences
- Quick access to conversation context

### 🧠 Advanced AI Integration
- **Ollama + Gemini** dual AI backend for enhanced responses
- **RAG Service** with effectiveness-ranked example database
- Natural language processing for context understanding
- Personalized response generation based on your profile

## Tech Stack

- **Electron** - Desktop app framework
- **Node.js** - Backend runtime
- **Ollama** - Local AI model (gemma2:2b)
- **Google Gemini** - Cloud AI fallback
- **Natural.js** - NLP text processing
- **JSON Database** - Local data storage

## Setup

### Prerequisites
- Node.js 16+
- Ollama installed and running

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/valtoosh/Latchai.git
   cd latchai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   OLLAMA_HOST=http://localhost:11434
   ```

4. **Start Ollama**
   ```bash
   brew services start ollama
   ```

5. **Run the app**
   ```bash
   npm start
   ```

## Usage

### First Time Setup
1. **Complete your profile** - Add your name, age, bio, dating goals
2. **Take personality assessment** - Answer 27 questions across 5 steps
3. **Get your signature vibe** - AI generates your unique personality profile and pickup lines
4. **Add matches** - Import or manually add Hinge matches

### Getting Conversation Help
1. Click on a match to view conversation
2. Use "AI Suggestions" to get personalized message ideas
3. Chat with AI to brainstorm creative responses
4. Send messages that match your authentic tone

### Retaking Assessment
- Go to Profile page
- Click "Retake" button in Signature Vibe section
- Complete the assessment again
- AI will regenerate your vibe and pickup lines

## Project Structure

```
latchai/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.js     # App entry point & IPC handlers
│   │   └── preload.js  # Context bridge API
│   ├── renderer/       # Frontend UI
│   │   ├── index.html
│   │   ├── js/
│   │   │   └── app.js  # Main app logic
│   │   └── styles/
│   │       └── main.css
│   ├── services/       # Backend services
│   │   ├── ai-service.js   # AI model integration
│   │   └── rag-service.js  # RAG with example database
│   └── database/       # Data layer
│       ├── json-db.js  # Database operations
│       └── schema.js   # Data schemas
├── scripts/            # Utility scripts
│   ├── import-rizz-dataset.js
│   └── check-import-progress.sh
└── package.json
```

## Features in Detail

### Personality Assessment
The 5-step assessment covers:
1. **Interests** - Hobbies, activities, passions
2. **Communication Style** - Humor type, flirting approach, conversation preferences
3. **Values** - Priorities, dealbreakers, lifestyle goals
4. **Dating Approach** - First date preferences, relationship pace, spontaneity
5. **Personal Philosophy** - Growth mindset, conflict resolution, life perspectives

### RAG Service
- 29,852 conversation examples from high-effectiveness interactions
- Semantic search using TF-IDF vectorization
- Context-aware retrieval for relevant examples
- Effectiveness scoring for quality responses

### AI Generation
- Analyzes personality + profile data
- Generates witty taglines (5-7 words)
- Creates 3 personality trait descriptors
- Crafts 3 personalized pickup lines
- Matches your humor style and communication approach

## Development

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- RAG dataset from [the-rizz-corpus](https://huggingface.co/datasets/the-rizz/the-rizz-corpus)
- Built with Electron and powered by Ollama + Gemini AI

---

**Note:** This is a personal AI assistant tool. Always be authentic and respectful in your conversations. The AI is here to help, not replace genuine connection.
