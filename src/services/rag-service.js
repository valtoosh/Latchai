const natural = require('natural');
const TfIdf = natural.TfIdf;
const fs = require('fs');
const path = require('path');

class RAGService {
  constructor() {
    this.tfidf = new TfIdf();
    this.examples = [];
    this.isInitialized = false;
  }

  // Initialize with rizz examples
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load examples from the imported dataset
      const examplesPath = path.join(__dirname, '../../scripts/rizz-examples.json');
      
      if (fs.existsSync(examplesPath)) {
        const rawData = fs.readFileSync(examplesPath, 'utf8');
        const loadedExamples = JSON.parse(rawData);
        
        // Sample examples intelligently - use a diverse subset for TF-IDF
        // Keep all examples but only index a subset for performance
        const allExamples = loadedExamples.map(ex => ({
          context: ex.context || "Dating app conversation",
          prompt: ex.prompt,
          response: ex.response,
          effectiveness: ex.effectiveness >= 0.7 ? 'high' : 'medium'
        }));
        
        // Use every 10th example for TF-IDF index (~3k examples for reasonable memory)
        // Keep all for potential random sampling
        this.examples = allExamples;
        this.indexedExamples = allExamples.filter((_, i) => i % 10 === 0);
        
        console.log(`Loaded ${this.examples.length} examples from rizz dataset (indexing ${this.indexedExamples.length} for search)`);
      } else {
        console.log('Dataset file not found, using default examples');
        this.examples = this.getDefaultExamples();
        this.indexedExamples = this.examples;
      }
    } catch (error) {
      console.error('Error loading dataset:', error);
      this.examples = this.getDefaultExamples();
      this.indexedExamples = this.examples;
    }

    // Add indexed examples to TF-IDF for similarity search
    this.indexedExamples.forEach(example => {
      const text = `${example.context} ${example.prompt} ${example.response}`;
      this.tfidf.addDocument(text);
    });

    this.isInitialized = true;
    console.log('RAG Service initialized with', this.examples.length, 'total examples,', this.indexedExamples.length, 'indexed');
  }

  getDefaultExamples() {
    // Fallback examples if dataset file is not found
    return [
      {
        context: "First message on Hinge",
        prompt: "She likes travel and adventure",
        response: "I noticed you're into adventure travel - what's the most spontaneous trip you've ever taken?",
        effectiveness: "high"
      },
      {
        context: "Responding to her message",
        prompt: "She mentioned loving cooking",
        response: "A fellow chef! What's your signature dish? I need to know if I should be intimidated or inspired",
        effectiveness: "high"
      },
      {
        context: "First message",
        prompt: "Her profile says she's a foodie",
        response: "Your profile is making me hungry. What's your go-to spot that I absolutely need to try?",
        effectiveness: "high"
      },
      {
        context: "Follow up message",
        prompt: "Conversation about favorite activities",
        response: "That sounds amazing! I'm more of a [your activity] person but I'd love to hear what got you into that",
        effectiveness: "medium"
      },
      {
        context: "Asking about interests",
        prompt: "She mentioned music in her profile",
        response: "I saw you're into [genre] - concert buddy or more of a headphones in your room vibe?",
        effectiveness: "high"
      },
      {
        context: "First message on creative prompt",
        prompt: "Her prompt: 'I'll fall for you if...'",
        response: "I'll help you up if you fall, but only if you promise to teach me that thing you mentioned in your prompt",
        effectiveness: "medium"
      },
      {
        context: "Playful first message",
        prompt: "Her profile shows outdoor activities",
        response: "Okay but the real question is: sunrise hike or sunset beach?",
        effectiveness: "high"
      },
      {
        context: "Transitioning to date",
        prompt: "After good conversation flow",
        response: "This has been great! Want to continue this over coffee/drinks this week?",
        effectiveness: "high"
      },
      {
        context: "Response to her question",
        prompt: "She asked about weekend plans",
        response: "Still figuring that out - any recommendations? You seem like you know the good spots",
        effectiveness: "medium"
      },
      {
        context: "Flirty follow-up",
        prompt: "Building connection",
        response: "I have to say, your energy is infectious. When are you free to grab that coffee?",
        effectiveness: "high"
      },
      {
        context: "Opening with humor",
        prompt: "She has a funny bio",
        response: "Your bio made me laugh out loud. I feel like we'd either be best friends or terrible influences on each other",
        effectiveness: "high"
      },
      {
        context: "Deep conversation starter",
        prompt: "She values meaningful conversations",
        response: "Random question: if you could have dinner with anyone dead or alive, who would it be and why?",
        effectiveness: "medium"
      },
      {
        context: "Comment on photo",
        prompt: "She has travel photos",
        response: "Wait, is that [location]? I've always wanted to go there. What was the best part?",
        effectiveness: "high"
      },
      {
        context: "Showing interest in her hobbies",
        prompt: "She mentioned yoga/fitness",
        response: "A yogi! Do you have a go-to studio or are you more of a home practice person?",
        effectiveness: "medium"
      },
      {
        context: "Creating intrigue",
        prompt: "Starting conversation",
        response: "I have a theory about you based on your profile, but I need confirmation first",
        effectiveness: "high"
      }
    ];
  }

  // Find relevant examples based on context
  findSimilarExamples(query, limit = 3) {
    if (!this.isInitialized) {
      console.warn('RAG Service not initialized');
      return [];
    }

    const results = [];
    
    // Calculate similarity scores against indexed examples
    this.tfidf.tfidfs(query, (i, measure) => {
      results.push({
        index: i,
        score: measure,
        example: this.indexedExamples[i]
      });
    });

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter(r => r.score > 0)
      .map(r => r.example);
  }

  // Get examples formatted for prompt context
  getContextForPrompt(userQuery, matchProfile) {
    const interestsText = Array.isArray(matchProfile?.interests) 
      ? matchProfile.interests.join(' ') 
      : (matchProfile?.interests || '');
    const query = `${userQuery} ${interestsText} ${matchProfile?.bio || ''}`;
    const similarExamples = this.findSimilarExamples(query, 5); // Increased from 3 to 5

    if (similarExamples.length === 0) {
      return '';
    }

    const examplesText = similarExamples
      .map((ex, i) => {
        const effectivenessLabel = ex.effectiveness === 'high' ? '⭐ Highly Effective' : 'Effective';
        return `Example ${i + 1} (${effectivenessLabel}):\nContext: ${ex.context}\nMessage: "${ex.prompt}"\nResponse: "${ex.response}"`;
      })
      .join('\n\n');

    return `\n\n📚 SUCCESSFUL CONVERSATION EXAMPLES FROM DATABASE (${this.examples.length.toLocaleString()} total examples):\n\n${examplesText}\n\nUse these examples as inspiration for tone, creativity, and engagement style. Adapt them to fit the current context and the user's personality.`;
  }

  // Add new successful example (for learning)
  addExample(context, prompt, response, effectiveness = 'medium') {
    const newExample = { context, prompt, response, effectiveness };
    this.examples.push(newExample);
    
    // Add to TF-IDF
    const text = `${context} ${prompt} ${response}`;
    this.tfidf.addDocument(text);
    
    console.log('Added new example to RAG');
  }

  // Get statistics
  getStats() {
    return {
      totalExamples: this.examples.length,
      highEffectiveness: this.examples.filter(e => e.effectiveness === 'high').length,
      isInitialized: this.isInitialized
    };
  }
}

module.exports = RAGService;
