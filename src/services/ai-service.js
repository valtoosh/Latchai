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
    const { match, conversation, userProfile, personalityAssessment } = matchContext;
    
    let prompt = `You are a dating conversation coach helping a user have better conversations on Hinge.

USER'S PROFILE:`;

    // Add user's personality assessment if available
    if (personalityAssessment) {
      prompt += `
PERSONALITY & COMMUNICATION STYLE:
- Communication Style: ${personalityAssessment.communication_approach || 'Not specified'}
- Conversation Preference: ${personalityAssessment.conversation_depth || 'Not specified'}
- Humor Style: ${personalityAssessment.humor_style || 'Not specified'}
- Ideal Date Vibe: ${personalityAssessment.date_vibe || 'Not specified'}
- Values: ${Array.isArray(personalityAssessment.core_values) ? personalityAssessment.core_values.join(', ') : (personalityAssessment.core_values || 'Not specified')}
- Dealbreakers: ${Array.isArray(personalityAssessment.dealbreakers) ? personalityAssessment.dealbreakers.join(', ') : (personalityAssessment.dealbreakers || 'Not specified')}
- Interests: ${Array.isArray(personalityAssessment.interests) ? personalityAssessment.interests.join(', ') : (personalityAssessment.interests || 'Not specified')}`;

      if (personalityAssessment.signature_vibe) {
        prompt += `
- Signature Vibe: ${personalityAssessment.signature_vibe}`;
      }
      
      if (personalityAssessment.personality_traits) {
        prompt += `
- Personality Traits: ${JSON.stringify(personalityAssessment.personality_traits)}`;
      }
    }

    // Add basic user profile info if available
    if (userProfile) {
      if (userProfile.name) prompt += `\n- Name: ${userProfile.name}`;
      if (userProfile.age) prompt += `\n- Age: ${userProfile.age}`;
      if (userProfile.occupation) prompt += `\n- Occupation: ${userProfile.occupation}`;
      if (userProfile.location) prompt += `\n- Location: ${userProfile.location}`;
    }

    // Add match profile if available
    if (match) {
      prompt += `

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

      if (match.profile_data?.interests) {
        const interestsText = Array.isArray(match.profile_data.interests) 
          ? match.profile_data.interests.join(', ') 
          : match.profile_data.interests;
        if (interestsText) {
          prompt += `\nInterests: ${interestsText}\n`;
        }
      }

      if (conversation?.length > 0) {
        prompt += '\nCONVERSATION HISTORY:\n';
        conversation.slice(-10).forEach(msg => {
          const sender = msg.sender === 'user' ? 'You' : match.name;
          prompt += `${sender}: ${msg.text}\n`;
        });
      }
    }

    prompt += `

YOUR ROLE:
- Give practical, actionable advice for continuing this conversation
- Suggest specific message ideas that match the USER'S personality and communication style${match ? `\n- Consider compatibility between the user's values/interests and ${match.name}'s profile` : ''}
- Help the user be authentic, engaging, and show genuine interest
- Tailor suggestions to match the user's humor style and conversation preferences${match ? '\n- Point out conversation patterns and opportunities based on both personalities' : ''}
- Be encouraging but honest
- Keep responses concise and friendly

The user will ask you questions or request advice about what to say next. Provide thoughtful, specific suggestions that feel natural to THEIR communication style.`;

    // Add RAG examples to the prompt
    const lastUserMessage = matchContext.lastMessage || '';
    const ragContext = this.rag.getContextForPrompt(lastUserMessage, match || {});
    if (ragContext) {
      prompt += ragContext;
    }

    return prompt;
  }

  async getSuggestions(matchContext) {
    const { personalityAssessment, match } = matchContext;
    
    let suggestionPrompt = 'Based on our conversation so far and my personality, what are 3 good ways I could continue this conversation? Give me specific message suggestions that:';
    
    if (personalityAssessment) {
      suggestionPrompt += `
- Match my ${personalityAssessment.communication_approach || 'natural'} communication style
- Reflect my ${personalityAssessment.humor_style || 'authentic'} humor approach`;
      
      if (personalityAssessment.conversation_depth) {
        suggestionPrompt += `\n- Align with my preference for ${personalityAssessment.conversation_depth} conversations`;
      }
      
      if (Array.isArray(personalityAssessment.interests) && personalityAssessment.interests.length > 0) {
        suggestionPrompt += `\n- Could reference shared interests or my passions (${personalityAssessment.interests.slice(0, 3).join(', ')})`;
      }
    } else {
      suggestionPrompt += `
- Feel authentic and natural
- Show genuine interest in ${match.name}`;
    }
    
    suggestionPrompt += '\n\nFor each suggestion, briefly explain why it would work well given our compatibility.';

    const messages = [{
      role: 'user',
      content: suggestionPrompt
    }];

    return await this.chat(messages, matchContext);
  }
}

module.exports = AIService;
