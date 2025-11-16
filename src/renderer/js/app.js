// Main application logic
class LatchaiApp {
  constructor() {
    this.currentPage = 'dashboard';
    this.matches = [];
    this.currentMatch = null;
    this.currentMatchMode = 'history'; // 'history' or 'plan'
    this.currentConversation = [];
    this.aiMessages = []; // Store AI chat messages
  }

  init() {
    this.setupNavigation();
    this.setupModal();
    this.loadMatches();
    this.loadPage('dashboard');
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.getAttribute('data-page');
        this.navigateTo(page);
      });
    });
  }

  setupModal() {
    const modal = document.getElementById('add-match-modal');
    const closeBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-modal');
    const form = document.getElementById('add-match-form');

    // Close modal handlers
    closeBtn.addEventListener('click', () => this.closeModal());
    cancelBtn.addEventListener('click', () => this.closeModal());
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleAddMatch();
    });
  }

  openModal() {
    const modal = document.getElementById('add-match-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    const modal = document.getElementById('add-match-modal');
    const form = document.getElementById('add-match-form');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    form.reset();
  }

  async loadMatches() {
    try {
      const matches = await window.api.getMatches();
      this.matches = matches || [];
    } catch (error) {
      console.error('Error loading matches:', error);
      this.matches = [];
    }
  }

  async handleAddMatch() {
    const name = document.getElementById('match-name').value;
    const age = parseInt(document.getElementById('match-age').value);
    const location = document.getElementById('match-location').value;
    const occupation = document.getElementById('match-occupation').value;
    const datingIntentions = document.getElementById('match-dating-intentions').value;
    const bio = document.getElementById('match-bio').value;
    const interests = document.getElementById('match-interests').value;
    const notes = document.getElementById('match-notes').value;

    // Collect prompts
    const promptItems = document.querySelectorAll('.prompt-item');
    const prompts = [];
    promptItems.forEach(item => {
      const question = item.querySelector('.prompt-question').value;
      const answer = item.querySelector('.prompt-answer').value;
      if (question && answer) {
        prompts.push({ question, answer });
      }
    });

    const matchData = {
      name,
      age,
      location,
      occupation,
      bio,
      dating_intentions: datingIntentions,
      profile_data: {
        prompts,
        interests: interests.split(',').map(i => i.trim()).filter(i => i)
      },
      notes,
      status: 'active',
      created_at: new Date().toISOString()
    };

    try {
      await window.api.addMatch(matchData);
      
      // Reload matches from database
      await this.loadMatches();
      
      this.closeModal();
      
      // Navigate to matches page to show the new match
      this.navigateTo('matches');
      
      alert(`${name} added successfully!`);
    } catch (error) {
      console.error('Error adding match:', error);
      alert('Error adding match. Please try again.');
    }
  }

  navigateTo(page) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Load page content
    this.loadPage(page);
    this.currentPage = page;
  }

  loadPage(page) {
    const container = document.getElementById('page-container');
    
    // Generate only the page we need
    let pageContent;
    try {
      switch(page) {
        case 'dashboard':
          pageContent = this.getDashboardPage();
          break;
        case 'profile':
          pageContent = this.getProfilePage();
          break;
        case 'matches':
          pageContent = this.getMatchesPage();
          break;
        case 'match-detail':
          pageContent = this.getMatchDetailPage();
          break;
        case 'library':
          pageContent = this.getLibraryPage();
          break;
        case 'analytics':
          pageContent = this.getAnalyticsPage();
          break;
        case 'settings':
          pageContent = this.getSettingsPage();
          break;
        default:
          pageContent = this.getDashboardPage();
      }
    } catch (error) {
      console.error('Error generating page content:', error);
      pageContent = '<p>Error loading page</p>';
    }
    
    container.innerHTML = pageContent;
    
    // Initialize page-specific functionality
    if (page === 'dashboard') {
      this.initDashboardPage();
    } else if (page === 'profile') {
      this.initProfilePage();
    } else if (page === 'matches') {
      this.initMatchesPage();
    } else if (page === 'match-detail') {
      this.initMatchDetailPage();
    } else if (page === 'settings') {
      this.initSettingsPage();
    }
  }

  initDashboardPage() {
    const viewMatchesBtn = document.getElementById('view-matches-btn');
    const updateProfileBtn = document.getElementById('update-profile-btn');
    const planningBtn = document.getElementById('planning-mode-btn');
    
    if (viewMatchesBtn) {
      viewMatchesBtn.addEventListener('click', () => this.navigateTo('matches'));
    }
    if (updateProfileBtn) {
      updateProfileBtn.addEventListener('click', () => this.navigateTo('profile'));
    }
    if (planningBtn) {
      planningBtn.addEventListener('click', () => {
        alert('Planning mode coming soon!');
      });
    }
  }

  getDashboardPage() {
    return `
      <div class="hinge-layout">
        <section class="hero-card hinge-card">
          <div class="prompt-tag">Prompt • Let's make sure it's a vibe</div>
          <h1>"What do you want to feel on your next date?"</h1>
          <p>Val picked <strong>warm laughs</strong> + <strong>playful teasing</strong>. Let's help every chat land in that lane.</p>
          <div class="hero-actions">
            <button class="btn btn-secondary" id="view-matches-btn">
              <i class="fas fa-heart"></i> View Matches
            </button>
            <button class="btn btn-primary" id="update-profile-btn">
              <i class="fas fa-user-edit"></i> Update Profile
            </button>
          </div>
        </section>

        <section class="stat-pills">
          <div class="pill">
            <span><i class="fas fa-heart"></i> Active matches</span>
            <p>02</p>
          </div>
          <div class="pill">
            <span><i class="fas fa-reply"></i> Replies waiting</span>
            <p>01</p>
          </div>
          <div class="pill">
            <span><i class="fas fa-lightbulb"></i> Suggestions saved</span>
            <p>05</p>
          </div>
        </section>

        <section class="insight-grid">
          <div class="card soft-card">
            <h4>Conversation spark</h4>
            <p>Playful "pet chaos" story pulled the biggest response last week. Keep it in rotation.</p>
            <div class="meta-chip">Based on Mila & Harper chats</div>
          </div>
          <div class="card soft-card">
            <h4>Timing sweet spot</h4>
            <p>Best response window is 7:00 – 9:30 pm. Queue a thoughtful reply before her commute home.</p>
            <div class="meta-chip meta-warning">Reminder set for tonight</div>
          </div>
          <div class="card soft-card">
            <h4>Planning mode cue</h4>
            <p>Two matches crossed the "ready for IRL" threshold. Suggest low-key drinks + jazz in SoMa.</p>
            <button class="text-link" id="planning-mode-btn">
              <i class="fas fa-arrow-right"></i> Open planning mode
            </button>
          </div>
        </section>
      </div>
    `;
  }

  getMatchesPage() {
    // Use real matches from database, fall back to mock if empty
    const displayMatches = this.matches.length > 0 ? this.matches : this.getMockMatches();
    const matchCards = displayMatches.map(match => this.renderMatchCard(match)).join('');

    return `
      <div class="page-header">
        <h2>Matches</h2>
        <p>Individual profiles styled like the Hinge cards you know</p>
      </div>
  
      <div class="match-header">
        <button class="btn btn-primary" id="add-match-btn">
          <i class="fas fa-plus"></i> Add Match
        </button>
        <button class="btn btn-secondary" id="refresh-matches-btn">
          <i class="fas fa-sync"></i> Refresh
        </button>
        <div class="filter-tabs">
          <button class="chip active"><i class="fas fa-th"></i> All</button>
          <button class="chip"><i class="fas fa-clock"></i> Needs reply</button>
          <button class="chip"><i class="fas fa-brain"></i> Planning</button>
        </div>
      </div>
  
      <div class="match-grid">
        ${matchCards}
      </div>
    `;
  }

  getProfilePage() {
    return `
      <div class="page-header">
        <h2>My Profile</h2>
        <p>Help our AI understand you better</p>
      </div>
      
      <div class="profile-grid">
        <div class="card">
          <h3 style="margin-bottom: 24px;">Basic Information</h3>
          
          <form id="profile-form">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" placeholder="Your name" required>
            </div>
            
            <div class="two-col">
              <div class="form-group">
                <label for="age">Age</label>
                <input type="number" id="age" placeholder="25">
              </div>
              
              <div class="form-group">
                <label for="location">Location</label>
                <input type="text" id="location" placeholder="City, State">
              </div>
            </div>
            
            <div class="form-group">
              <label for="occupation">Occupation</label>
              <input type="text" id="occupation" placeholder="Your job title">
            </div>
            
            <div class="form-group">
              <label for="bio">Bio</label>
              <textarea id="bio" rows="4" placeholder="Tell us about yourself..."></textarea>
            </div>
            
            <div class="form-group">
              <label for="dating-goals">Dating Goals</label>
              <select id="dating-goals">
                <option value="">Select your goal</option>
                <option value="serious">Looking for something serious</option>
                <option value="casual">Casual dating</option>
                <option value="unsure">Figuring it out</option>
                <option value="friends">New friends</option>
              </select>
            </div>
            
            <button type="submit" class="btn btn-primary" style="margin-top: 16px;">
              <i class="fas fa-save"></i> Save Profile
            </button>
          </form>
        </div>
        
        <div class="card profile-side">
          <p class="prompt-tag">Signature vibe</p>
          <h3>“Honest energy + spontaneous plans”</h3>
          <p>
            Use your personality anchors so Latchai can mirror your tone in every suggestion.
            Add prompts, quirks, and the tiny tells that make you unforgettable on Hinge.
          </p>
          <div class="profile-side-list">
            <span><i class="fas fa-comments"></i> Playful banter > small talk</span>
            <span><i class="fas fa-music"></i> Indie R&B and rooftop sets</span>
            <span><i class="fas fa-utensils"></i> Late night takeout + documentaries</span>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3 style="margin-bottom: 16px;">Personality Assessment</h3>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">
          Coming soon • A 4-part quiz to map your humor, pacing, and depth preferences.
        </p>
        <button class="btn btn-secondary" disabled>
          <i class="fas fa-clipboard-list"></i> Take Assessment (Soon)
        </button>
      </div>
    `;
  }

  getLibraryPage() {
    return `
      <div class="page-header">
        <h2>Library</h2>
        <p>Your saved conversation elements and templates</p>
      </div>
      
      <div class="card">
        <div style="text-align: center; padding: 48px 24px;">
          <i class="fas fa-bookmark" style="font-size: 48px; margin-bottom: 16px; color: var(--text-secondary);"></i>
          <h3 style="margin-bottom: 8px;">Library is empty</h3>
          <p style="color: var(--text-secondary);">
            Save successful conversation elements to reference later
          </p>
        </div>
      </div>
    `;
  }

  getAnalyticsPage() {
    return `
      <div class="page-header">
        <h2>Analytics</h2>
        <p>Your dating performance insights</p>
      </div>
      
      <div class="card">
        <div style="text-align: center; padding: 48px 24px;">
          <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 16px; color: var(--text-secondary);"></i>
          <h3 style="margin-bottom: 8px;">No data yet</h3>
          <p style="color: var(--text-secondary);">
            Start tracking conversations to see your analytics
          </p>
        </div>
      </div>
    `;
  }

  getSettingsPage() {
    return `
      <div class="page-header">
        <h2>Settings</h2>
        <p>Customize your Latchai experience</p>
      </div>
      
      <div class="card">
        <h3 style="margin-bottom: 24px;">AI Configuration</h3>
        
        <div class="form-group">
          <label for="ai-provider">AI Provider</label>
          <select id="ai-provider">
            <option value="gemini">Google Gemini (Free tier available)</option>
            <option value="ollama">Ollama (Local, completely free)</option>
          </select>
          <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
            Gemini requires an API key. Ollama runs locally on your machine.
          </p>
        </div>
        
        <div id="gemini-settings">
          <div class="form-group">
            <label for="gemini-api-key">Gemini API Key</label>
            <input type="password" id="gemini-api-key" placeholder="Get free key at: https://aistudio.google.com/apikey">
            <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
              Free tier: 15 requests/minute, 1500 requests/day. Your key is stored locally and never shared.
            </p>
          </div>
        </div>
        
        <div id="ollama-settings" style="display: none;">
          <div class="form-group">
            <label for="ollama-url">Ollama URL</label>
            <input type="text" id="ollama-url" placeholder="http://localhost:11434" value="http://localhost:11434">
          </div>
          
          <div class="form-group">
            <label for="ollama-model">Model</label>
            <select id="ollama-model">
              <option value="llama3.2:3b">llama3.2:3b (Fast, lightweight)</option>
              <option value="llama3.1:8b">llama3.1:8b (Better quality)</option>
              <option value="qwen2.5:7b">qwen2.5:7b (Good for conversation)</option>
              <option value="gemma2:9b">gemma2:9b (Nuanced responses)</option>
            </select>
          </div>
          
          <p style="font-size: 12px; color: var(--text-secondary); padding: 12px; background: var(--bg-input); border-radius: 8px;">
            <strong>To use Ollama:</strong><br>
            1. Install: <code>brew install ollama</code><br>
            2. Start: <code>ollama serve</code><br>
            3. Pull model: <code>ollama pull llama3.2:3b</code>
          </p>
        </div>
        
        <button class="btn btn-primary" id="save-ai-settings-btn">
          <i class="fas fa-save"></i> Save AI Settings
        </button>
      </div>
      
      <div class="card">
        <h3 style="margin-bottom: 16px;">About</h3>
        <p style="color: var(--text-secondary); margin-bottom: 8px;">Version 1.0.0</p>
        <p style="color: var(--text-secondary);">Latchai - Your AI Dating Assistant</p>
      </div>
    `;
  }

  initDashboardPage() {
    const viewMatchesBtn = document.getElementById('view-matches-btn');
    const updateProfileBtn = document.getElementById('update-profile-btn');
    const planningBtn = document.getElementById('planning-mode-btn');
    
    if (viewMatchesBtn) {
      viewMatchesBtn.addEventListener('click', () => this.navigateTo('matches'));
    }
    if (updateProfileBtn) {
      updateProfileBtn.addEventListener('click', () => this.navigateTo('profile'));
    }
    if (planningBtn) {
      planningBtn.addEventListener('click', () => {
        alert('Planning mode coming soon!');
      });
    }
  }

  initProfilePage() {
    const form = document.getElementById('profile-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const profile = {
          name: document.getElementById('name').value,
          age: parseInt(document.getElementById('age').value),
          location: document.getElementById('location').value,
          occupation: document.getElementById('occupation').value,
          bio: document.getElementById('bio').value,
          dating_goals: document.getElementById('dating-goals').value
        };
        
        try {
          await window.api.createUserProfile(profile);
          alert('Profile saved successfully!');
          this.navigateTo('dashboard');
        } catch (error) {
          console.error('Error saving profile:', error);
          alert('Error saving profile. Please try again.');
        }
      });
    }
  }

  initMatchesPage() {
    const addBtn = document.getElementById('add-match-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openModal();
      });
    }
    
    const refreshBtn = document.getElementById('refresh-matches-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await this.loadMatches();
        this.loadPage('matches');
        this.initMatchesPage();
      });
    }
    
    // Add click handlers to all match cards
    const matchCards = document.querySelectorAll('.match-open-btn');
    matchCards.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const matchId = e.currentTarget.getAttribute('data-match-id');
        this.openMatchDetail(matchId);
      });
    });
  }
  
  async openMatchDetail(matchId) {
    // Find the match in the database
    const match = this.matches.find(m => m.id == matchId || m.name == matchId);
    if (!match) {
      alert('Match not found');
      return;
    }
    
    this.currentMatch = match;
    this.currentMatchMode = 'history'; // Default to history mode
    
    // Load conversation messages
    try {
      const conversationId = match.id || match.name;
      this.currentConversation = await window.api.getConversation(conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
      this.currentConversation = [];
    }
    
    this.loadPage('match-detail');
  }
  
  getMatchDetailPage() {
    const match = this.currentMatch;
    const mode = this.currentMatchMode || 'history';
    
    if (!match) {
      return '<div class="page-header"><h2>Match not found</h2></div>';
    }
    
    // Generate initials for avatar
    const initials = match.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const photo = match.photo || match.photos?.[0];
    
    return `
      <div class="match-detail-container">
        <!-- Header with match info and mode toggle -->
        <div class="match-detail-header">
          <button class="btn-back" id="back-to-matches">
            <i class="fas fa-arrow-left"></i> Back to Matches
          </button>
          
          <div class="match-info-bar">
            ${photo 
              ? `<div class="avatar-large" style="background-image:url('${photo}')"></div>`
              : `<div class="avatar-large avatar-initials"><span>${initials}</span></div>`
            }
            <div class="match-info">
              <h2>${match.name}, ${match.age}</h2>
              <p>${match.location}</p>
            </div>
          </div>
          
          <div class="mode-toggle">
            <button class="mode-btn ${mode === 'history' ? 'active' : ''}" id="history-mode-btn">
              <i class="fas fa-history"></i> History
            </button>
            <button class="mode-btn ${mode === 'plan' ? 'active' : ''}" id="plan-mode-btn">
              <i class="fas fa-lightbulb"></i> Plan
            </button>
          </div>
        </div>
        
        <!-- Content area that switches between modes -->
        <div class="match-detail-content">
          ${mode === 'history' ? this.getHistoryModeContent(match) : this.getPlanModeContent(match)}
        </div>
      </div>
    `;
  }
  
  getHistoryModeContent(match) {
    // Get conversation from current loaded conversation
    const messages = this.currentConversation || [];
    
    return `
      <div class="history-mode">
        <div class="conversation-container">
          <div class="conversation-header">
            <h3>Conversation History</h3>
            <div class="message-type-btns">
              <button class="btn btn-secondary" id="add-user-message-btn">
                <i class="fas fa-user"></i> Add My Message
              </button>
              <button class="btn btn-primary" id="add-match-message-btn">
                <i class="fas fa-heart"></i> Add ${match.name}'s Message
              </button>
            </div>
          </div>
          
          <div class="chat-messages" id="chat-messages">
            ${messages.length === 0 ? `
              <div class="empty-state">
                <i class="fas fa-comments" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                <h4>No messages yet</h4>
                <p style="color: var(--text-secondary);">Start adding messages to simulate your conversation with ${match.name}</p>
              </div>
            ` : this.renderChatMessages(messages)}
          </div>
        </div>
      </div>
    `;
  }
  
  renderChatMessages(messages) {
    return messages.map(msg => `
      <div class="chat-message ${msg.sender === 'user' ? 'user-message' : 'match-message'}">
        <div class="message-bubble">
          <p>${msg.text}</p>
          <span class="message-time">${this.formatTime(msg.timestamp)}</span>
        </div>
      </div>
    `).join('');
  }
  
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  
  getPlanModeContent(match) {
    return `
      <div class="plan-mode">
        <div class="ai-chat-container">
          <div class="match-context-panel">
            <h4>Match Profile</h4>
            <div class="context-item">
              <strong>Age:</strong> ${match.age}
            </div>
            <div class="context-item">
              <strong>Location:</strong> ${match.location}
            </div>
            ${match.occupation ? `
            <div class="context-item">
              <strong>Occupation:</strong> ${match.occupation}
            </div>
            ` : ''}
            ${match.dating_intentions ? `
            <div class="context-item">
              <strong>Dating Intentions:</strong> ${match.dating_intentions.replace(/-/g, ' ')}
            </div>
            ` : ''}
            ${match.profile_data?.interests?.length > 0 ? `
            <div class="context-item">
              <strong>Interests:</strong> ${match.profile_data.interests.join(', ')}
            </div>
            ` : ''}
            ${match.notes ? `
            <div class="context-item">
              <strong>Your Notes:</strong> 
              <p style="margin-top: 8px; color: var(--text-secondary);">${match.notes}</p>
            </div>
            ` : ''}
          </div>
          
          <div class="ai-chat-main">
            <div class="ai-chat-messages" id="ai-chat-messages">
              ${this.aiMessages.length === 0 ? `
                <div class="ai-message">
                  <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                  </div>
                  <div class="message-content">
                    <p>Hi! I'm your AI dating assistant. I can help you with:</p>
                    <ul>
                      <li>Conversation starters and opening lines</li>
                      <li>Response suggestions based on context</li>
                      <li>Dating strategy and timing advice</li>
                      <li>Profile analysis and compatibility insights</li>
                    </ul>
                    <p>What would you like help with regarding ${match.name}?</p>
                  </div>
                </div>
              ` : this.renderAIMessages()}
            </div>
            
            <div class="quick-actions">
              <button class="quick-action-btn">
                <i class="fas fa-comment-dots"></i> Suggest opening line
              </button>
              <button class="quick-action-btn">
                <i class="fas fa-chart-line"></i> Analyze compatibility
              </button>
              <button class="quick-action-btn">
                <i class="fas fa-calendar"></i> Best time to reply
              </button>
            </div>
            
            <div class="ai-input-area">
              <textarea 
                id="ai-chat-input" 
                placeholder="Ask me anything about your conversation with ${match.name}..."
                rows="3"
              ></textarea>
              <button class="btn btn-primary" id="send-ai-message">
                <i class="fas fa-paper-plane"></i> Send
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initMatchDetailPage() {
    // Back button
    const backBtn = document.getElementById('back-to-matches');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.navigateTo('matches');
      });
    }
    
    // Mode toggle buttons
    const historyBtn = document.getElementById('history-mode-btn');
    const planBtn = document.getElementById('plan-mode-btn');
    
    if (historyBtn) {
      historyBtn.addEventListener('click', () => {
        this.currentMatchMode = 'history';
        this.loadPage('match-detail');
      });
    }
    
    if (planBtn) {
      planBtn.addEventListener('click', () => {
        this.currentMatchMode = 'plan';
        this.aiMessages = []; // Reset AI chat when switching to plan mode
        this.loadPage('match-detail');
      });
    }
    
    // History mode: Add message buttons
    const addUserMessageBtn = document.getElementById('add-user-message-btn');
    const addMatchMessageBtn = document.getElementById('add-match-message-btn');
    
    if (addUserMessageBtn) {
      addUserMessageBtn.addEventListener('click', () => {
        this.showAddMessagePrompt('user');
      });
    }
    
    if (addMatchMessageBtn) {
      addMatchMessageBtn.addEventListener('click', () => {
        this.showAddMessagePrompt('match');
      });
    }
    
    // Plan mode: Quick action buttons
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    quickActionBtns.forEach((btn, index) => {
      btn.addEventListener('click', async (e) => {
        const prompts = [
          'Suggest a creative opening line for me to send',
          'Analyze our compatibility based on the profile',
          'What\'s the best time to reply based on our conversation?'
        ];
        if (prompts[index]) {
          await this.sendAIMessage(prompts[index]);
        }
      });
    });
    
    // Plan mode: Send AI message
    const sendBtn = document.getElementById('send-ai-message');
    const input = document.getElementById('ai-chat-input');
    if (sendBtn && input) {
      const sendMessage = async () => {
        const message = input.value.trim();
        if (message) {
          input.value = '';
          await this.sendAIMessage(message);
        }
      };
      
      sendBtn.addEventListener('click', sendMessage);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }
  }
  
  showAddMessagePrompt(sender) {
    const match = this.currentMatch;
    const senderName = sender === 'user' ? 'You' : match.name;
    
    const message = prompt(`Enter ${senderName}'s message:`);
    if (message && message.trim()) {
      this.addMessageToConversation(sender, message.trim());
    }
  }
  
  async addMessageToConversation(sender, text) {
    const match = this.currentMatch;
    const conversationId = match.id || match.name;
    
    const messageData = {
      sender: sender, // 'user' or 'match'
      text: text,
      timestamp: new Date().toISOString()
    };
    
    try {
      // Save to database via IPC
      await window.api.addMessage(conversationId, messageData);
      
      // Reload the page to show the new message
      this.loadPage('match-detail');
    } catch (error) {
      console.error('Error adding message:', error);
      alert('Error adding message. Please try again.');
    }
  }

  async sendAIMessage(userMessage) {
    const match = this.currentMatch;
    
    // Add user message to chat
    this.aiMessages.push({
      role: 'user',
      content: userMessage
    });
    
    // Re-render to show user message and loading state
    this.loadPage('match-detail');
    
    try {
      // Build message history for API
      const messages = this.aiMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Call AI service via IPC
      const result = await window.api.aiChat(messages, match.id);
      
      if (result.success) {
        // Add AI response
        this.aiMessages.push({
          role: 'assistant',
          content: result.message
        });
      } else {
        // Add error message
        this.aiMessages.push({
          role: 'assistant',
          content: `⚠️ ${result.error}\n\n${result.error.includes('API key') ? 'Please set your Gemini API key in Settings.' : result.error.includes('Ollama') ? 'Please make sure Ollama is running with: ollama serve' : 'Please try again or check your AI settings.'}`
        });
      }
    } catch (error) {
      console.error('Error sending AI message:', error);
      this.aiMessages.push({
        role: 'assistant',
        content: `⚠️ Error: ${error.message}\n\nPlease check your AI settings.`
      });
    }
    
    // Re-render with response
    this.loadPage('match-detail');
    
    // Scroll to bottom of chat
    setTimeout(() => {
      const chatContainer = document.getElementById('ai-chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  renderAIMessages() {
    return this.aiMessages.map(msg => {
      if (msg.role === 'user') {
        return `
          <div class="ai-message user-ai-message">
            <div class="message-content user-message-content">
              <p>${msg.content.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="ai-message">
            <div class="message-avatar">
              <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
              <p>${msg.content.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        `;
      }
    }).join('');
  }

  renderMatchCard(match) {
    // Handle both database matches and mock matches
    const photo = match.photo || match.photos?.[0];
    const location = match.location || 'Location not set';
    
    // Generate initials for avatar if no photo
    const initials = match.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    return `
      <article class="hinge-card match-card" data-match-id="${match.id || match.name}">
        <header>
          ${photo 
            ? `<div class="avatar" style="background-image:url('${photo}')"></div>`
            : `<div class="avatar avatar-initials"><span>${initials}</span></div>`
          }
          <div>
            <h3>${match.name}, ${match.age}</h3>
            <p>${location}</p>
          </div>
        </header>
        <div class="card-actions">
          <button class="text-link match-open-btn" data-match-id="${match.id || match.name}">
            <i class="fas fa-comments"></i> Open chat
          </button>
        </div>
      </article>
    `;
  }

  getStatusLabel(status) {
    const labels = {
      active: 'Green • active',
      needs_reply: 'Yellow • needs reply',
      stalled: 'Red • stalled'
    };
    return labels[status] || 'New';
  }

  getMockMatches() {
    return [
      {
        name: 'Mila',
        age: 29,
        location: 'Lower Pac Heights',
        status: 'green',
        statusLabel: 'Green • rolling',
        prompt: 'Perfect Sunday: pilates, farmers market, and finding a new speakeasy.',
        vibe: 'Planning mode',
        photo: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&q=60'
      },
      {
        name: 'Harper',
        age: 31,
        location: 'SoMa',
        status: 'yellow',
        statusLabel: 'Yellow • nudge soon',
        prompt: 'I get way too competitive about making the best spicy margarita.',
        vibe: 'Needs reply',
        photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=60'
      },
      {
        name: 'Noor',
        age: 27,
        location: 'Mission',
        status: 'green',
        statusLabel: 'Green • high energy',
        prompt: 'Currently building a playlist for a road trip I haven\'t planned yet.',
        vibe: 'High engagement',
        photo: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=60'
      }
    ];
  }

  async initSettingsPage() {
    // Load current settings
    const settings = await window.api.getAISettings();
    
    const providerSelect = document.getElementById('ai-provider');
    const geminiApiKeyInput = document.getElementById('gemini-api-key');
    const ollamaUrlInput = document.getElementById('ollama-url');
    const ollamaModelSelect = document.getElementById('ollama-model');
    const geminiSettings = document.getElementById('gemini-settings');
    const ollamaSettings = document.getElementById('ollama-settings');
    const saveBtn = document.getElementById('save-ai-settings-btn');
    
    // Set current values
    if (providerSelect) providerSelect.value = settings.provider;
    if (geminiApiKeyInput) geminiApiKeyInput.value = settings.geminiApiKey || '';
    if (ollamaUrlInput) ollamaUrlInput.value = settings.ollamaUrl;
    if (ollamaModelSelect) ollamaModelSelect.value = settings.ollamaModel;
    
    // Show/hide settings based on provider
    const toggleProviderSettings = () => {
      const provider = providerSelect.value;
      if (geminiSettings) geminiSettings.style.display = provider === 'gemini' ? 'block' : 'none';
      if (ollamaSettings) ollamaSettings.style.display = provider === 'ollama' ? 'block' : 'none';
    };
    
    toggleProviderSettings();
    
    if (providerSelect) {
      providerSelect.addEventListener('change', toggleProviderSettings);
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const newSettings = {
          provider: providerSelect.value,
          geminiApiKey: geminiApiKeyInput.value,
          ollamaUrl: ollamaUrlInput.value,
          ollamaModel: ollamaModelSelect.value
        };
        
        try {
          const result = await window.api.saveAISettings(newSettings);
          if (result.success) {
            alert('AI settings saved successfully!');
          } else {
            alert(`Error saving settings: ${result.error}`);
          }
        } catch (error) {
          console.error('Error saving AI settings:', error);
          alert('Error saving settings. Please try again.');
        }
      });
    }
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new LatchaiApp();
  app.init();
});
