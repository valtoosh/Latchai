const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const RAGService = require('./rag-service');

class AIService {
  constructor() {
    this.provider = 'gemini'; // 'gemini' or 'ollama'
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.ollamaUrl = 'http://localhost:11434';
    this.ollamaModel = 'llama3.2:3b';
    
    if (this.geminiApiKey) {
      this.gemini = new GoogleGenerativeAI(this.geminiApiKey);
    }
    
    // Initialize RAG service
    this.rag = new RAGService();
    this.initializeRAG();
  }

  async initializeRAG() {
    await this.rag.initialize();
    console.log('RAG Service ready:', this.rag.getStats());
  }

  setProvider(provider) {
    this.provider = provider;
  }

  setGeminiApiKey(apiKey) {
    this.geminiApiKey = apiKey;
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  setOllamaConfig(url, model) {
    this.ollamaUrl = url;
    this.ollamaModel = model;
  }

  async chat(messages, matchContext) {
    if (this.provider === 'gemini') {
      return await this.chatWithGemini(messages, matchContext);
    } else if (this.provider === 'ollama') {
      return await this.chatWithOllama(messages, matchContext);
    }
    throw new Error('Invalid AI provider');
  }

  async chatWithGemini(messages, matchContext) {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not set. Please add it in Settings.');
    }

    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
      
      const systemPrompt = this.buildSystemPrompt(matchContext);
      const conversationHistory = this.formatMessagesForGemini(messages);
      
      const chat = model.startChat({
        history: conversationHistory,
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
      });

      const result = await chat.sendMessage(systemPrompt + '\n\n' + messages[messages.length - 1].content);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini error: ${error.message}`);
    }
  }

  async chatWithOllama(messages, matchContext) {
    try {
      const systemPrompt = this.buildSystemPrompt(matchContext);
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ];

      const response = await axios.post(`${this.ollamaUrl}/api/chat`, {
        model: this.ollamaModel,
        messages: formattedMessages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      });

      return response.data.message.content;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama is not running. Please start Ollama first.');
      }
      console.error('Ollama API error:', error);
      throw new Error(`Ollama error: ${error.message}`);
    }
  }

  formatMessagesForGemini(messages) {
    // Gemini uses 'user' and 'model' roles
    return messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
  }

  buildSystemPrompt(matchContext) {
    const { match, conversation } = matchContext;
    
    let prompt = `You are a dating conversation coach helping a user have better conversations on Hinge. 

MATCH PROFILE:
- Name: ${match.name}
- Age: ${match.age}
- Location: ${match.location}
- Occupation: ${match.occupation || 'Not specified'}
- Dating Intentions: ${match.dating_intentions || 'Not specified'}
- Bio: ${match.bio || 'No bio available'}
`;

    if (match.profile_data?.prompts?.length > 0) {
      prompt += '\nHINGE PROMPTS:\n';
      match.profile_data.prompts.forEach(p => {
        prompt += `- ${p.question}: ${p.answer}\n`;
      });
    }

    if (match.profile_data?.interests?.length > 0) {
      prompt += `\nInterests: ${match.profile_data.interests.join(', ')}\n`;
    }

    if (conversation?.length > 0) {
      prompt += '\nCONVERSATION HISTORY:\n';
      conversation.slice(-10).forEach(msg => {
        const sender = msg.sender === 'user' ? 'You' : match.name;
        prompt += `${sender}: ${msg.text}\n`;
      });
    }

    prompt += `
YOUR ROLE:
- Give practical, actionable advice for continuing this conversation
- Suggest specific message ideas based on their profile and conversation
- Help the user be authentic, engaging, and show genuine interest
- Point out conversation patterns and opportunities
- Be encouraging but honest
- Keep responses concise and friendly

The user will ask you questions or request advice about what to say next. Provide thoughtful, specific suggestions.`;

    // Add RAG examples to the prompt
    const lastUserMessage = matchContext.lastMessage || '';
    const ragContext = this.rag.getContextForPrompt(lastUserMessage, match);
    if (ragContext) {
      prompt += ragContext;
    }

    return prompt;
  }

  async getSuggestions(matchContext) {
    const messages = [{
      role: 'user',
      content: 'Based on our conversation so far, what are 3 good ways I could continue this conversation? Give me specific message suggestions.'
    }];

    return await this.chat(messages, matchContext);
  }
}

module.exports = AIService;
