# AI Integration Setup

Latchai supports two AI providers for conversation assistance:

## Option 1: Google Gemini (Recommended for Testing)

### Advantages
- ✅ Free tier available (15 req/min, 1500 req/day)
- ✅ Cloud-based (no local setup)
- ✅ Fast responses
- ✅ No credit card required

### Setup
1. Get a free API key: https://aistudio.google.com/apikey
2. Open Latchai → Go to **Settings**
3. Select **Google Gemini** as provider
4. Paste your API key
5. Click **Save AI Settings**

## Option 2: Ollama (Free, Local)

### Advantages
- ✅ Completely free forever
- ✅ Unlimited usage
- ✅ Privacy - all data stays local
- ✅ Works offline

### Setup
1. Install Ollama:
   ```bash
   brew install ollama
   ```

2. Start Ollama service:
   ```bash
   ollama serve
   ```

3. Pull a model (in a new terminal):
   ```bash
   # Lightweight, fast (recommended):
   ollama pull llama3.2:3b
   
   # Better quality:
   ollama pull llama3.1:8b
   
   # Or try others:
   ollama pull qwen2.5:7b
   ollama pull gemma2:9b
   ```

4. Configure in Latchai:
   - Open Latchai → Go to **Settings**
   - Select **Ollama** as provider
   - Select your downloaded model
   - Click **Save AI Settings**

## Using the AI Assistant

1. Go to **Matches**
2. Open a match detail
3. Click the **Plan** tab
4. Start chatting with the AI assistant!

### What can the AI help with?
- Conversation starters and opening lines
- Response suggestions based on match profile
- Dating strategy and timing advice
- Compatibility analysis
- General dating coaching

## Troubleshooting

### Gemini Errors
- **"API key not set"**: Add your API key in Settings
- **Rate limit exceeded**: You've hit the free tier limit (wait or upgrade)
- **Invalid API key**: Check your key at https://aistudio.google.com/apikey

### Ollama Errors
- **"Ollama is not running"**: Make sure `ollama serve` is running
- **Connection refused**: Check Ollama is at http://localhost:11434
- **Model not found**: Pull the model with `ollama pull <model-name>`

## Models Comparison

| Model | Provider | Speed | Quality | Cost |
|-------|----------|-------|---------|------|
| Gemini 1.5 Flash | Google | Fast | Good | Free* |
| llama3.2:3b | Ollama | Very Fast | Decent | Free |
| llama3.1:8b | Ollama | Fast | Good | Free |
| qwen2.5:7b | Ollama | Fast | Good | Free |
| gemma2:9b | Ollama | Medium | Great | Free |

*Free tier limits apply

## Switching Providers

You can switch between Gemini and Ollama anytime in Settings. Your conversation history is preserved regardless of provider.
