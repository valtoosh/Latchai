// Main application logic
class LatchaiApp {
  constructor() {
    this.currentPage = 'dashboard';
    this.matches = [];
    this.currentMatch = null;
    this.currentMatchMode = 'history'; // 'history' or 'plan'
    this.currentConversation = [];
    this.aiMessages = []; // Store AI chat messages
    this.aiMessagesCache = {}; // Cache AI messages per match
    this.conversationsCache = {}; // Cache for analytics
    this.isProcessingAI = false; // Flag to prevent duplicate AI calls
    this.initialized = false;
    this.analyticsCacheStale = true;
    this.assessmentStep = 1;
    this.assessmentData = {};
  }

  // Toast notification system
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
      success: 'check-circle',
      error: 'exclamation-circle',
      info: 'info-circle'
    };

    toast.innerHTML = `
      <i class="fas fa-${iconMap[type]}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
  }

  // HTML sanitization to prevent XSS
  escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Skeleton loading state for matches page
  getLoadingState() {
    return `
      <div class="page-header">
        <div class="skeleton sk-text" style="width: 200px; height: 40px;"></div>
        <div class="skeleton sk-text" style="width: 300px;"></div>
      </div>
      <div class="match-grid">
        ${Array(3).fill('<div class="card"><div class="skeleton sk-card"></div></div>').join('')}
      </div>
    `;
  }

  init() {
    if (!this.initialized) {
      this.setupNavigation();
      this.setupModal();
      this.initialized = true;
    }
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
      
      // Mark analytics cache as stale
      this.analyticsCacheStale = true;
      
      this.closeModal();
      
      // Navigate to matches page to show the new match
      this.navigateTo('matches');
      
      this.showToast(`${name} added successfully!`, 'success');
    } catch (error) {
      console.error('Error adding match:', error);
      this.showToast('Error adding match. Please try again.', 'error');
    }
  }

  navigateTo(page) {
    // Clean up rotation interval when leaving profile page
    if (this.currentPage === 'profile' && this.openerRotationInterval) {
      clearInterval(this.openerRotationInterval);
      this.openerRotationInterval = null;
    }
    
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
    } else if (page === 'analytics') {
      this.initAnalyticsPage();
    } else if (page === 'library') {
      this.initLibraryPage();
    }
  }
  
  async initAnalyticsPage() {
    // Only load conversation data if cache is empty or stale
    if (Object.keys(this.conversationsCache).length === 0 || this.analyticsCacheStale) {
      this.conversationsCache = {};
      for (const match of this.matches) {
        const conversationId = match.id || match.name;
        try {
          this.conversationsCache[conversationId] = await window.api.getConversation(conversationId);
        } catch (error) {
          console.error('Error loading conversation:', error);
          this.conversationsCache[conversationId] = [];
        }
      }
      this.analyticsCacheStale = false;
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
        this.showToast('Planning mode coming soon!', 'info');
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
        
        <div class="card profile-side" id="signature-vibe-card">
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
          Take a comprehensive 5-step assessment to help our AI understand your personality, communication style, and dating approach.
        </p>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn btn-primary" id="start-assessment-btn">
            <i class="fas fa-clipboard-list"></i> Take Assessment
          </button>
          <button class="btn btn-secondary" id="retake-assessment-btn" style="display: none;">
            <i class="fas fa-refresh"></i> Retake Assessment
          </button>
        </div>
      </div>
      
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h3 style="margin-bottom: 8px;">My Hinge Prompts</h3>
            <p style="color: var(--text-secondary); font-size: 14px;">
              Add your Hinge prompts so AI can suggest better responses
            </p>
          </div>
          <button class="btn btn-primary" id="add-prompt-btn">
            <i class="fas fa-plus"></i> Add Prompt
          </button>
        </div>
        
        <div id="prompts-list">
          <div style="text-align: center; padding: 32px; color: var(--text-secondary);">
            <i class="fas fa-comment-dots" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
            <p>No prompts added yet. Click "Add Prompt" to get started.</p>
          </div>
        </div>
      </div>
    `;
  }

  getLibraryPage() {
    return `
      <div class="page-header">
        <h2>Library</h2>
        <p>Your saved conversation elements and templates</p>
      </div>
      
      <div class="library-tabs">
        <button class="chip active" data-category="all">
          <i class="fas fa-th"></i> All
        </button>
        <button class="chip" data-category="openers">
          <i class="fas fa-comment-dots"></i> Openers
        </button>
        <button class="chip" data-category="responses">
          <i class="fas fa-reply"></i> Responses
        </button>
        <button class="chip" data-category="questions">
          <i class="fas fa-question-circle"></i> Questions
        </button>
        <button class="chip" data-category="stories">
          <i class="fas fa-book"></i> Stories
        </button>
      </div>
      
      <div id="library-content">
        <div class="card">
          <div style="text-align: center; padding: 48px 24px;">
            <i class="fas fa-bookmark" style="font-size: 48px; margin-bottom: 16px; color: var(--text-secondary);"></i>
            <h3 style="margin-bottom: 8px;">Library is empty</h3>
            <p style="color: var(--text-secondary);">
              Save successful messages from Plan mode to build your library
            </p>
          </div>
        </div>
      </div>
    `;
  }
  
  async initLibraryPage() {
    const tabs = document.querySelectorAll('.library-tabs .chip');
    tabs.forEach(tab => {
      tab.addEventListener('click', async (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const category = e.currentTarget.getAttribute('data-category');
        await this.loadLibraryItems(category);
      });
    });
    
    // Load all items initially
    await this.loadLibraryItems('all');
  }
  
  async loadLibraryItems(category) {
    try {
      const items = await window.api.getLibraryItems(category === 'all' ? null : category);
      const container = document.getElementById('library-content');
      
      if (items.length === 0) {
        container.innerHTML = `
          <div class="card">
            <div style="text-align: center; padding: 48px 24px;">
              <i class="fas fa-bookmark" style="font-size: 48px; margin-bottom: 16px; color: var(--text-secondary);"></i>
              <h3 style="margin-bottom: 8px;">No ${category === 'all' ? 'items' : category} yet</h3>
              <p style="color: var(--text-secondary);">
                Save messages from Plan mode to build your library
              </p>
            </div>
          </div>
        `;
        return;
      }
      
      container.innerHTML = `
        <div class="library-grid">
          ${items.map(item => this.renderLibraryItem(item)).join('')}
        </div>
      `;
      
      // Add click handlers for copy buttons
      document.querySelectorAll('.copy-library-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const text = e.currentTarget.getAttribute('data-text');
          navigator.clipboard.writeText(text);
          const originalText = e.currentTarget.innerHTML;
          e.currentTarget.innerHTML = '<i class="fas fa-check"></i> Copied!';
          setTimeout(() => {
            e.currentTarget.innerHTML = originalText;
          }, 2000);
        });
      });
      
    } catch (error) {
      console.error('Error loading library items:', error);
    }
  }
  
  renderLibraryItem(item) {
    return `
      <div class="card library-item">
        <div class="library-header">
          <span class="chip chip-${item.category}">${item.category}</span>
          <span class="library-stats">
            <i class="fas fa-heart"></i> ${item.times_used || 0} uses
          </span>
        </div>
        <div class="library-content">
          <p>${item.content}</p>
        </div>
        ${item.notes ? `<div class="library-notes">${item.notes}</div>` : ''}
        <div class="library-actions">
          <button class="btn btn-secondary copy-library-item" data-text="${item.content.replace(/"/g, '&quot;')}">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>
      </div>
    `;
  }

  getAnalyticsPage() {
    const stats = this.calculateAnalytics();
    
    return `
      <div class="page-header">
        <h2>Analytics</h2>
        <p>Your dating performance insights</p>
      </div>
      
      <div class="analytics-grid">
        <div class="card stat-card">
          <div class="stat-icon">
            <i class="fas fa-heart"></i>
          </div>
          <div class="stat-info">
            <h3>${stats.totalMatches}</h3>
            <p>Total Matches</p>
          </div>
        </div>
        
        <div class="card stat-card">
          <div class="stat-icon">
            <i class="fas fa-comments"></i>
          </div>
          <div class="stat-info">
            <h3>${stats.totalMessages}</h3>
            <p>Total Messages</p>
          </div>
        </div>
        
        <div class="card stat-card">
          <div class="stat-icon">
            <i class="fas fa-fire"></i>
          </div>
          <div class="stat-info">
            <h3>${stats.activeConversations}</h3>
            <p>Active Conversations</p>
          </div>
        </div>
        
        <div class="card stat-card">
          <div class="stat-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-info">
            <h3>${stats.avgMessagesPerMatch.toFixed(1)}</h3>
            <p>Avg Messages/Match</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3 style="margin-bottom: 24px;">Conversation Activity</h3>
        <div class="activity-list">
          ${stats.recentActivity.length > 0 ? stats.recentActivity.map(activity => `
            <div class="activity-item">
              <div class="activity-icon">
                <i class="fas fa-${activity.type === 'message' ? 'comment' : 'user-plus'}"></i>
              </div>
              <div class="activity-details">
                <p><strong>${activity.matchName}</strong> - ${activity.description}</p>
                <span class="activity-time">${this.formatRelativeTime(activity.timestamp)}</span>
              </div>
            </div>
          `).join('') : `
            <div style="text-align: center; padding: 48px 24px; color: var(--text-secondary);">
              <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
              <p>No activity yet. Start adding matches and messages!</p>
            </div>
          `}
        </div>
      </div>
      
      <div class="analytics-grid">
        <div class="card">
          <h3 style="margin-bottom: 16px;">Match Distribution</h3>
          <div class="distribution-chart">
            <div class="chart-bar">
              <div class="bar-label">Active</div>
              <div class="bar-container">
                <div class="bar-fill" style="width: ${stats.matchDistribution.active}%; background: var(--success);"></div>
              </div>
              <div class="bar-value">${stats.matchCounts.active}</div>
            </div>
            <div class="chart-bar">
              <div class="bar-label">Needs Reply</div>
              <div class="bar-container">
                <div class="bar-fill" style="width: ${stats.matchDistribution.needs_reply}%; background: var(--warning);"></div>
              </div>
              <div class="bar-value">${stats.matchCounts.needs_reply}</div>
            </div>
            <div class="chart-bar">
              <div class="bar-label">Stalled</div>
              <div class="bar-container">
                <div class="bar-fill" style="width: ${stats.matchDistribution.stalled}%; background: var(--danger);"></div>
              </div>
              <div class="bar-value">${stats.matchCounts.stalled}</div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <h3 style="margin-bottom: 16px;">Your Messaging Pattern</h3>
          <div class="pattern-stats">
            <div class="pattern-item">
              <span class="pattern-label">Messages Sent (You)</span>
              <span class="pattern-value">${stats.yourMessages}</span>
            </div>
            <div class="pattern-item">
              <span class="pattern-label">Messages Received</span>
              <span class="pattern-value">${stats.theirMessages}</span>
            </div>
            <div class="pattern-item">
              <span class="pattern-label">Response Ratio</span>
              <span class="pattern-value">${stats.responseRatio}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  calculateAnalytics() {
    const matches = this.matches || [];
    const totalMatches = matches.length;
    let totalMessages = 0;
    let yourMessages = 0;
    let theirMessages = 0;
    let activeConversations = 0;
    const recentActivity = [];
    
    const matchCounts = {
      active: 0,
      needs_reply: 0,
      stalled: 0
    };
    
    matches.forEach(match => {
      // Count by status
      const status = match.status || 'active';
      if (matchCounts[status] !== undefined) {
        matchCounts[status]++;
      }
      
      // Count conversations
      const conversationId = match.id || match.name;
      const messages = this.getConversationMessages(conversationId);
      
      if (messages.length > 0) {
        activeConversations++;
        totalMessages += messages.length;
        
        messages.forEach(msg => {
          if (msg.sender === 'user') yourMessages++;
          else theirMessages++;
          
          // Add to recent activity
          recentActivity.push({
            type: 'message',
            matchName: match.name,
            description: msg.sender === 'user' ? 'You sent a message' : `${match.name} replied`,
            timestamp: msg.timestamp
          });
        });
      }
      
      // Add match creation to activity
      if (match.created_at) {
        recentActivity.push({
          type: 'match',
          matchName: match.name,
          description: 'New match added',
          timestamp: match.created_at
        });
      }
    });
    
    // Sort recent activity by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Calculate distributions
    const matchDistribution = {
      active: totalMatches > 0 ? (matchCounts.active / totalMatches) * 100 : 0,
      needs_reply: totalMatches > 0 ? (matchCounts.needs_reply / totalMatches) * 100 : 0,
      stalled: totalMatches > 0 ? (matchCounts.stalled / totalMatches) * 100 : 0
    };
    
    const responseRatio = theirMessages > 0 
      ? `${(yourMessages / theirMessages).toFixed(2)}:1`
      : yourMessages > 0 ? '∞:1' : '0:0';
    
    return {
      totalMatches,
      totalMessages,
      activeConversations,
      avgMessagesPerMatch: totalMatches > 0 ? totalMessages / totalMatches : 0,
      yourMessages,
      theirMessages,
      responseRatio,
      matchCounts,
      matchDistribution,
      recentActivity: recentActivity.slice(0, 10) // Last 10 activities
    };
  }
  
  getConversationMessages(conversationId) {
    // Helper to get conversation messages from cache
    return this.conversationsCache[conversationId] || [];
  }
  
  formatRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return time.toLocaleDateString();
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
        <h3 style="margin-bottom: 16px;">AI Enhancements</h3>
        <div style="padding: 16px; background: linear-gradient(135deg, rgba(119, 82, 255, 0.1), rgba(155, 125, 255, 0.05)); border-radius: 12px; border: 1px solid rgba(119, 82, 255, 0.2);">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <i class="fas fa-brain" style="font-size: 24px; color: var(--accent-primary);"></i>
            <div>
              <h4 style="margin: 0; font-size: 16px;">RAG-Enhanced Responses</h4>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-secondary);">Using successful conversation examples</p>
            </div>
          </div>
          <div style="display: flex; gap: 16px; margin-top: 16px;">
            <div style="flex: 1; text-align: center; padding: 12px; background: var(--bg-soft); border-radius: 8px;">
              <div style="font-size: 24px; font-weight: 700; color: var(--accent-primary);">29.8K+</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Examples</div>
            </div>
            <div style="flex: 1; text-align: center; padding: 12px; background: var(--bg-soft); border-radius: 8px;">
              <div style="font-size: 24px; font-weight: 700; color: #22c55e;">Active</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Status</div>
            </div>
          </div>
          <p style="margin-top: 16px; font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
            <i class="fas fa-check-circle" style="color: #22c55e;"></i> 
            Your AI now references successful dating conversation patterns to provide better suggestions
          </p>
        </div>
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
        this.showToast('Planning mode coming soon!', 'info');
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
        
        console.log('Saving profile:', profile);
        
        try {
          const result = await window.api.createUserProfile(profile);
          console.log('Profile saved:', result);
          this.showToast('Profile saved successfully!', 'success');
        } catch (error) {
          console.error('Error saving profile:', error);
          this.showToast('Error saving profile: ' + error.message, 'error');
        }
      });
    }
    
    const startAssessmentBtn = document.getElementById('start-assessment-btn');
    console.log('Assessment button found:', startAssessmentBtn);
    if (startAssessmentBtn) {
      startAssessmentBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Assessment button clicked');
        this.showPersonalityAssessment();
      });
    }
    
    const retakeAssessmentBtn = document.getElementById('retake-assessment-btn');
    if (retakeAssessmentBtn) {
      retakeAssessmentBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showPersonalityAssessment();
      });
    }
    
    // Check if assessment exists and show/hide appropriate button
    this.checkAssessmentStatus();
    
    const addPromptBtn = document.getElementById('add-prompt-btn');
    if (addPromptBtn) {
      addPromptBtn.addEventListener('click', () => {
        this.showAddPromptModal();
      });
    }
    
    // Load existing profile data
    this.loadProfileData();
    
    // Load existing prompts
    this.loadUserPrompts();
  }
  
  async loadProfileData() {
    try {
      const profile = await window.api.getUserProfile();
      if (profile) {
        const nameInput = document.getElementById('name');
        const ageInput = document.getElementById('age');
        const locationInput = document.getElementById('location');
        const occupationInput = document.getElementById('occupation');
        const bioInput = document.getElementById('bio');
        const datingGoalsInput = document.getElementById('dating-goals');
        
        if (nameInput && profile.name) nameInput.value = profile.name;
        if (ageInput && profile.age) ageInput.value = profile.age;
        if (locationInput && profile.location) locationInput.value = profile.location;
        if (occupationInput && profile.occupation) occupationInput.value = profile.occupation;
        if (bioInput && profile.bio) bioInput.value = profile.bio;
        if (datingGoalsInput && profile.dating_goals) datingGoalsInput.value = profile.dating_goals;
      }
      
      // Load signature vibe
      await this.loadSignatureVibe();
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  async checkAssessmentStatus() {
    try {
      const assessment = await window.api.getPersonalityAssessment();
      const startBtn = document.getElementById('start-assessment-btn');
      const retakeBtn = document.getElementById('retake-assessment-btn');
      
      if (assessment && Object.keys(assessment).length > 0) {
        // Assessment exists, show retake button
        if (startBtn) startBtn.style.display = 'none';
        if (retakeBtn) retakeBtn.style.display = 'inline-flex';
      } else {
        // No assessment, show start button
        if (startBtn) startBtn.style.display = 'inline-flex';
        if (retakeBtn) retakeBtn.style.display = 'none';
      }
    } catch (error) {
      console.error('Error checking assessment status:', error);
    }
  }

  async loadSignatureVibe() {
    try {
      console.log('Loading signature vibe...');
      const assessment = await window.api.getPersonalityAssessment();
      console.log('Assessment loaded:', assessment);
      const vibeCard = document.getElementById('signature-vibe-card');
      console.log('Vibe card element:', vibeCard);
      
      if (!vibeCard) {
        console.error('signature-vibe-card element not found!');
        return;
      }
      
      if (assessment && Object.keys(assessment).length > 0) {
        console.log('Generating signature vibe from assessment...');
        // Show loading state
        vibeCard.innerHTML = `
          <p class="prompt-tag">Signature vibe</p>
          <h3>
            <i class="fas fa-sparkles" style="animation: pulse 1.5s ease-in-out infinite;"></i>
            Crafting your vibe...
          </h3>
          <p style="color: var(--text-secondary); margin: 16px 0; font-size: 14px; line-height: 1.6;">
            AI is analyzing your personality to create something unique
          </p>
        `;
        
        // Generate vibe with AI
        const vibe = await this.generateSignatureVibe(assessment);
        console.log('Generated vibe:', vibe);
        
        vibeCard.innerHTML = `
          <p class="prompt-tag">Signature vibe</p>
          <h3>"${vibe.tagline}"</h3>
          <p style="color: var(--text-secondary); margin: 16px 0 24px 0; font-size: 14px; line-height: 1.6;">
            Your AI-generated personality profile
          </p>
          <div class="profile-side-list">
            ${vibe.traits.map(t => `<span><i class="fas fa-${t.icon}"></i> ${t.text}</span>`).join('')}
          </div>
          ${vibe.pickupLines && vibe.pickupLines.length > 0 ? `
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
              <p style="font-weight: 600; margin-bottom: 12px; font-size: 13px; color: var(--text-primary);">
                <i class="fas fa-comment-dots" style="color: var(--primary-color); margin-right: 6px;"></i>
                Your Personalized Openers
              </p>
              <div id="rotating-openers" style="display: flex; flex-direction: column; gap: 10px; position: relative; min-height: 60px;">
                ${vibe.pickupLines.map((line, index) => `
                  <div class="opener-line" data-index="${index}" style="background: var(--bg-tertiary); padding: 12px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; color: var(--text-secondary); border-left: 3px solid var(--primary-color); position: absolute; width: 100%; opacity: ${index === 0 ? '1' : '0'}; transform: translateY(${index === 0 ? '0' : '20px'}); transition: all 0.5s ease;">
                    "${line}"
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        `;
        
        // Start rotation animation for openers
        if (vibe.pickupLines && vibe.pickupLines.length > 1) {
          this.startOpenerRotation();
        }
      } else {
        console.log('No assessment found, showing default message');
        vibeCard.innerHTML = `
          <p class="prompt-tag">Signature vibe</p>
          <h3 id="vibe-headline">"Complete your assessment"</h3>
          <p id="vibe-description" style="color: var(--text-secondary); margin: 16px 0; font-size: 14px; line-height: 1.6;">
            Take the 5-step personality assessment to unlock your AI-generated signature vibe.
          </p>
        `;
      }
    } catch (error) {
      console.error('Error loading signature vibe:', error);
    }
  }

  async generateSignatureVibe(assessment) {
    try {
      // Get user profile for additional context
      const profile = await window.api.getUserProfile();
      
      // Build comprehensive context for AI
      const context = {
        assessment: assessment,
        profile: {
          name: profile?.name || '',
          age: profile?.age || '',
          occupation: profile?.occupation || '',
          bio: profile?.bio || '',
          dating_goals: profile?.dating_goals || '',
          prompts: profile?.prompts || []
        }
      };
      
      const prompt = `You are a creative dating profile analyst. Based on this personality assessment and Hinge profile, generate a witty, authentic "signature vibe" that captures this person's essence.

PERSONALITY ASSESSMENT:
${JSON.stringify(assessment, null, 2)}

PROFILE INFO:
${JSON.stringify(context.profile, null, 2)}

Generate a signature vibe in this EXACT JSON format:
{
  "tagline": "A short, punchy catchphrase (5-7 words max) that captures their personality. Make it witty, clever, or intriguing. Examples: 'Sarcasm fluent, adventure ready', 'Deep talks over rooftop drinks', 'Gym rat with a soft side'",
  "traits": [
    {"icon": "comments", "text": "Their communication/conversation style in 4-6 words"},
    {"icon": "heart", "text": "Their lifestyle/interests in 4-6 words"},
    {"icon": "fire", "text": "Their dating approach/vibe in 4-6 words"}
  ],
  "pickupLines": [
    "First catchy, personalized pickup line that references their interests/personality",
    "Second pickup line that matches their humor style and communication approach",
    "Third pickup line that's flirty but authentic to their vibe",
    "Fourth pickup line that's playful and shows personality",
    "Fifth pickup line that's clever and conversation-starting"
  ]
}

Icon options: comments, brain, music, mountain, dumbbell, palette, heart, fire, bolt, heart-pulse, sparkles, coffee, book, gamepad, camera, plane

Rules:
- Make it personal and specific to their answers
- Use their actual interests and communication style
- Be clever but authentic, not cringe
- Keep traits concise and punchy
- Use ">" for comparisons (e.g., "Coffee dates > bar scenes")
- Match their humor type (witty/playful/dry/wholesome)
- Pickup lines should be:
  * Personalized to their specific interests/hobbies from their profile
  * Match their communication style (playful/witty/direct/romantic)
  * Reference specific things from their assessment answers
  * Be clever openers they could actually use on Hinge
  * 10-20 words each, conversational and natural

Return ONLY valid JSON, no other text.`;

      // Use aiChat to generate the vibe
      const messages = [
        { role: 'user', content: prompt }
      ];
      
      const response = await window.api.aiChat(messages, 'signature-vibe-generation');
      
      // Parse AI response - response is already the text content
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const vibe = JSON.parse(jsonMatch[0]);
        return vibe;
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (error) {
      console.error('Error generating signature vibe with AI:', error);
      // Fallback to simple generation
      return this.generateFallbackVibe(assessment);
    }
  }

  generateFallbackVibe(assessment) {
    const interests = assessment.interests || {};
    const communication = assessment.communication_style || {};
    const values = assessment.values || {};
    
    let tagline = 'Authentic vibes + genuine connections';
    const traits = [
      { icon: 'comments', text: 'Real conversations preferred' },
      { icon: 'heart', text: 'Living life fully' },
      { icon: 'heart-pulse', text: 'Looking for something real' }
    ];
    
    const pickupLines = [
      "So, what's your take on spontaneous adventures vs. planned itineraries?",
      "I noticed we have similar vibes—want to grab coffee and see where the conversation takes us?",
      "Your profile caught my eye. What's something you're passionate about that most people don't know?",
      "If you could have dinner with anyone, dead or alive, who would it be and what would you order?",
      "What's your go-to move when you want to impress someone—cooking, playlist curation, or something else?"
    ];
    
    return { tagline, traits, pickupLines };
  }

  startOpenerRotation() {
    if (this.openerRotationInterval) {
      clearInterval(this.openerRotationInterval);
    }
    
    let currentIndex = 0;
    
    this.openerRotationInterval = setInterval(() => {
      const openers = document.querySelectorAll('.opener-line');
      if (!openers || openers.length === 0) {
        clearInterval(this.openerRotationInterval);
        return;
      }
      
      const nextIndex = (currentIndex + 1) % openers.length;
      
      // Fade out current
      openers[currentIndex].style.opacity = '0';
      openers[currentIndex].style.transform = 'translateY(-20px)';
      
      // Fade in next
      setTimeout(() => {
        openers[nextIndex].style.opacity = '1';
        openers[nextIndex].style.transform = 'translateY(0)';
      }, 250);
      
      currentIndex = nextIndex;
    }, 10000); // Rotate every 10 seconds
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
      this.showToast('Match not found', 'error');
      return;
    }
    
    this.currentMatch = match;
    this.currentMatchMode = 'history'; // Default to history mode
    
    // Load conversation messages
    try {
      const conversationId = match.id || match.name;
      this.currentConversation = await window.api.getConversation(conversationId);
      
      // Load cached AI messages for this match
      this.aiMessages = this.aiMessagesCache[conversationId] || [];
    } catch (error) {
      console.error('Error loading conversation:', error);
      this.currentConversation = [];
      this.aiMessages = this.aiMessagesCache[match.id || match.name] || [];
    }
    
    this.loadPage('match-detail');
  }
  
  getMatchDetailPage() {
    const match = this.currentMatch;
    const mode = this.currentMatchMode || 'history';
    
    if (!match) {
      return '<div class="page-header"><h2>Match not found</h2></div>';
    }
    
    // Load cached AI messages for this match
    const matchId = match.id || match.name;
    if (this.aiMessagesCache[matchId]) {
      this.aiMessages = this.aiMessagesCache[matchId];
    } else {
      this.aiMessages = [];
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
              <i class="fas fa-comments"></i> Conversation
            </button>
            <button class="mode-btn ${mode === 'plan' ? 'active' : ''}" id="plan-mode-btn">
              <i class="fas fa-robot"></i> AI Assistant
            </button>
          </div>
          
          <div class="match-actions">
            ${this.getConversationHealthBadge()}
            <button class="btn btn-secondary btn-sm" id="view-profile-btn" title="View full profile">
              <i class="fas fa-user"></i>
            </button>
            <button class="btn btn-secondary btn-sm" id="update-outcome-btn" title="Update outcome">
              <i class="fas fa-flag"></i>
            </button>
          </div>
        </div>
        
        ${match.outcome ? `
          <div class="outcome-badge ${match.outcome}">
            <i class="fas fa-${this.getOutcomeIcon(match.outcome)}"></i>
            ${this.getOutcomeLabel(match.outcome)}
          </div>
        ` : ''}
        
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
    const messageCount = messages.length;
    const lastMessageTime = messages.length > 0 ? this.formatRelativeTime(messages[messages.length - 1].timestamp) : 'No messages';
    
    return `
      <div class="history-mode">
        <div class="conversation-container">
          <div class="conversation-header">
            <div>
              <h3>Conversation History</h3>
              <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
                ${messageCount} ${messageCount === 1 ? 'message' : 'messages'} • Last: ${lastMessageTime}
              </p>
            </div>
            <div class="message-type-btns">
              <button class="btn btn-secondary btn-sm" id="bulk-import-btn" title="Paste multiple messages">
                <i class="fas fa-paste"></i> Bulk Import
              </button>
              <button class="btn btn-secondary btn-sm" id="add-user-message-btn">
                <i class="fas fa-user"></i> You
              </button>
              <button class="btn btn-primary btn-sm" id="add-match-message-btn">
                <i class="fas fa-heart"></i> ${match.name}
              </button>
            </div>
          </div>
          
          <div class="chat-messages" id="chat-messages">
            ${messages.length === 0 ? `
              <div class="empty-state">
                <i class="fas fa-comments" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                <h4>No messages yet</h4>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">Track your Hinge conversation here to get better AI suggestions</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                  <button class="btn btn-secondary" onclick="document.getElementById('bulk-import-btn').click()">
                    <i class="fas fa-paste"></i> Paste Conversation
                  </button>
                  <button class="btn btn-primary" onclick="document.getElementById('add-match-message-btn').click()">
                    <i class="fas fa-plus"></i> Add First Message
                  </button>
                </div>
              </div>
            ` : this.renderChatMessages(messages)}
          </div>
          
          ${messages.length > 0 ? `
            <div class="conversation-actions" style="padding: 16px; border-top: 1px solid var(--border-color); display: flex; gap: 12px;">
              <button class="btn btn-secondary btn-sm" id="clear-conversation-btn">
                <i class="fas fa-trash"></i> Clear All
              </button>
              <button class="btn btn-secondary btn-sm" id="export-conversation-btn">
                <i class="fas fa-download"></i> Export
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  renderChatMessages(messages) {
    return messages.map((msg, index) => `
      <div class="chat-message ${msg.sender === 'user' ? 'user-message' : 'match-message'}" data-message-index="${index}">
        <div class="message-bubble">
          <p>${this.escapeHtml(msg.text)}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span class="message-time">${this.formatTime(msg.timestamp)}</span>
            <div class="message-actions" style="display: flex; gap: 8px;">
              <button class="btn-icon edit-message" data-index="${index}" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon delete-message" data-index="${index}" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  
  getPlanModeContent(match) {
    const messages = this.currentConversation || [];
    const conversationInsights = this.getConversationInsights(messages);
    
    return `
      <div class="plan-mode">
        <div class="ai-chat-container">
          <div class="match-context-panel">
            <h4><i class="fas fa-user-circle"></i> Match Profile</h4>
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
            ${match.profile_data?.interests ? `
            <div class="context-item">
              <strong>Interests:</strong> ${Array.isArray(match.profile_data.interests) ? match.profile_data.interests.join(', ') : match.profile_data.interests}
            </div>
            ` : ''}
            ${match.notes ? `
            <div class="context-item">
              <strong>Your Notes:</strong> 
              <p style="margin-top: 8px; color: var(--text-secondary);">${match.notes}</p>
            </div>
            ` : ''}
            
            ${conversationInsights.messageCount > 0 ? `
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
              <h4 style="margin-bottom: 16px;"><i class="fas fa-chart-line"></i> Conversation Stats</h4>
              <div class="context-item">
                <strong>Messages:</strong> ${conversationInsights.messageCount}
              </div>
              <div class="context-item">
                <strong>Your Messages:</strong> ${conversationInsights.userMessages}
              </div>
              <div class="context-item">
                <strong>Their Messages:</strong> ${conversationInsights.matchMessages}
              </div>
              <div class="context-item">
                <strong>Avg Response Time:</strong> ${conversationInsights.avgResponseTime}
              </div>
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

  getConversationHealthBadge() {
    const messages = this.currentConversation || [];
    if (messages.length === 0) return '';
    
    const userMessages = messages.filter(m => m.sender === 'user').length;
    const matchMessages = messages.filter(m => m.sender === 'match').length;
    const ratio = userMessages / (matchMessages || 1);
    
    let health, color, icon;
    if (ratio > 0.7 && ratio < 1.3 && messages.length > 4) {
      health = 'Strong';
      color = 'var(--success)';
      icon = 'fire';
    } else if (messages.length < 3) {
      health = 'New';
      color = 'var(--accent-primary)';
      icon = 'seedling';
    } else if (ratio < 0.5 || ratio > 2) {
      health = 'Needs Balance';
      color = 'var(--warning)';
      icon = 'balance-scale';
    } else {
      health = 'Good';
      color = 'var(--accent-primary)';
      icon = 'check-circle';
    }
    
    return `<span class=\"chip\" style=\"background: ${color}; color: white; border: none;\"><i class=\"fas fa-${icon}\"></i> ${health}</span>`;
  }
  
  getConversationInsights(messages) {
    if (!messages || messages.length === 0) {
      return {
        messageCount: 0,
        userMessages: 0,
        matchMessages: 0,
        avgResponseTime: 'N/A'
      };
    }
    
    const userMessages = messages.filter(m => m.sender === 'user').length;
    const matchMessages = messages.filter(m => m.sender === 'match').length;
    
    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;
    for (let i = 1; i < messages.length; i++) {
      const timeDiff = new Date(messages[i].timestamp) - new Date(messages[i-1].timestamp);
      if (timeDiff > 0 && timeDiff < 86400000) { // Less than 24 hours
        totalResponseTime += timeDiff;
        responseCount++;
      }
    }
    
    const avgMs = responseCount > 0 ? totalResponseTime / responseCount : 0;
    const avgResponseTime = avgMs > 0 ? this.formatDuration(avgMs) : 'N/A';
    
    return {
      messageCount: messages.length,
      userMessages,
      matchMessages,
      avgResponseTime
    };
  }
  
  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
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
    
    // Bulk import button
    const bulkImportBtn = document.getElementById('bulk-import-btn');
    if (bulkImportBtn) {
      bulkImportBtn.addEventListener('click', () => {
        this.showBulkImportModal();
      });
    }
    
    // Message edit/delete buttons
    document.querySelectorAll('.edit-message').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index'));
        this.editMessage(index);
      });
    });
    
    document.querySelectorAll('.delete-message').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index'));
        this.deleteMessage(index);
      });
    });
    
    // Clear conversation button
    const clearConvBtn = document.getElementById('clear-conversation-btn');
    if (clearConvBtn) {
      clearConvBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all messages? This cannot be undone.')) {
          this.clearConversation();
        }
      });
    }
    
    // Export conversation button
    const exportConvBtn = document.getElementById('export-conversation-btn');
    if (exportConvBtn) {
      exportConvBtn.addEventListener('click', () => {
        this.exportConversation();
      });
    }
    
    // View profile button
    const viewProfileBtn = document.getElementById('view-profile-btn');
    if (viewProfileBtn) {
      viewProfileBtn.addEventListener('click', () => {
        this.showMatchProfileModal();
      });
    }
    
    // Plan mode: Quick action buttons
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    console.log(`Found ${quickActionBtns.length} quick action buttons`);
    quickActionBtns.forEach((btn, index) => {
      console.log(`Attaching listener to button ${index}: ${btn.textContent.trim()}`);
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log(`Button ${index} clicked! Disabled: ${btn.disabled}, Processing: ${this.isProcessingAI}`);
        
        // Prevent multiple rapid clicks
        if (btn.disabled || this.isProcessingAI) {
          console.log('Button click ignored - already processing');
          return;
        }
        
        btn.disabled = true;
        console.log(`Quick action button ${index} - sending prompt`);
        
        const prompts = [
          'Suggest a creative opening line for me to send',
          'Analyze our compatibility based on the profile',
          'What\'s the best time to reply based on our conversation?'
        ];
        
        try {
          if (prompts[index]) {
            console.log(`Prompt: ${prompts[index]}`);
            await this.sendAIMessage(prompts[index]);
          }
        } catch (error) {
          console.error(`Error in button ${index} handler:`, error);
        } finally {
          // Always re-enable button
          setTimeout(() => {
            btn.disabled = false;
            console.log(`Button ${index} re-enabled`);
          }, 500);
        }
      });
    });
    
    // Plan mode: Send AI message
    const sendBtn = document.getElementById('send-ai-message');
    const input = document.getElementById('ai-chat-input');
    if (sendBtn && input) {
      const sendMessage = async () => {
        const message = input.value.trim();
        if (message && !this.isProcessingAI) {
          input.value = '';
          sendBtn.disabled = true;
          await this.sendAIMessage(message);
          sendBtn.disabled = false;
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
    
    // Plan mode: Save to library buttons
    this.initSaveToLibraryButtons();
    
    // Update outcome button
    const updateOutcomeBtn = document.getElementById('update-outcome-btn');
    if (updateOutcomeBtn) {
      updateOutcomeBtn.addEventListener('click', () => this.showUpdateOutcomeModal());
    }
  }
  
  initSaveToLibraryButtons() {
    const saveButtons = document.querySelectorAll('.save-to-library-btn');
    saveButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const messageIndex = parseInt(e.currentTarget.getAttribute('data-message-index'));
        const message = this.aiMessages[messageIndex];
        
        if (message && message.role === 'assistant') {
          await this.showSaveToLibraryModal(message.content);
        }
      });
    });
  }
  
  async showSaveToLibraryModal(content) {
    const category = prompt('Select category:\n1. Openers\n2. Responses\n3. Questions\n4. Stories\n\nEnter number (1-4):');
    
    const categories = ['openers', 'responses', 'questions', 'stories'];
    const categoryIndex = parseInt(category) - 1;
    
    if (categoryIndex < 0 || categoryIndex > 3) {
      this.showToast('Invalid category', 'error');
      return;
    }
    
    const notes = prompt('Add notes (optional):') || '';
    
    try {
      const item = {
        category: categories[categoryIndex],
        content: content,
        notes: notes,
        match_id: this.currentMatch?.id
      };
      
      await window.api.saveToLibrary(item);
      this.showToast('Saved to Library!', 'success');
    } catch (error) {
      console.error('Error saving to library:', error);
      this.showToast('Error saving to library. Please try again.', 'error');
    }
  }
  
  async showUpdateOutcomeModal() {
    const match = this.currentMatch;
    
    const outcome = prompt(
      'Select outcome:\n' +
      '1. Got Number\n' +
      '2. Scheduled Date\n' +
      '3. Went on Date\n' +
      '4. Multiple Dates\n' +
      '5. Unmatched\n' +
      '6. Clear Outcome\n\n' +
      'Enter number (1-6):'
    );
    
    const outcomes = ['got_number', 'scheduled_date', 'went_on_date', 'multiple_dates', 'unmatched', null];
    const outcomeIndex = parseInt(outcome) - 1;
    
    if (outcomeIndex < 0 || outcomeIndex > 5) {
      return;
    }
    
    try {
      await window.api.updateMatch(match.id, { outcome: outcomes[outcomeIndex] });
      match.outcome = outcomes[outcomeIndex];
      
      // Mark analytics cache as stale when outcome changes
      this.analyticsCacheStale = true;
      
      this.loadPage('match-detail');
      this.showToast('Outcome updated!', 'success');
    } catch (error) {
      console.error('Error updating outcome:', error);
      this.showToast('Error updating outcome. Please try again.', 'error');
    }
  }
  
  getOutcomeIcon(outcome) {
    const icons = {
      got_number: 'phone',
      scheduled_date: 'calendar-check',
      went_on_date: 'heart',
      multiple_dates: 'fire',
      unmatched: 'times-circle'
    };
    return icons[outcome] || 'question';
  }
  
  getOutcomeLabel(outcome) {
    const labels = {
      got_number: 'Got Number',
      scheduled_date: 'Date Scheduled',
      went_on_date: 'Went on Date',
      multiple_dates: 'Multiple Dates',
      unmatched: 'Unmatched'
    };
    return labels[outcome] || 'Unknown';
  }
  
  showAddMessagePrompt(sender) {
    const match = this.currentMatch;
    const senderName = sender === 'user' ? 'You' : match.name;
    
    const message = prompt(`Enter ${senderName}'s message:`);
    if (message && message.trim()) {
      this.addMessageToConversation(sender, message.trim());
    }
  }
  
  showBulkImportModal() {
    const text = prompt(
      'Paste your conversation (one message per line):\n\n' +
      'Format: You: message or Them: message\n\n' +
      'Example:\n' +
      'You: Hey! How\'s it going?\n' +
      'Them: Pretty good! Just got back from hiking'
    );
    
    if (!text || !text.trim()) return;
    
    const lines = text.trim().split('\n');
    let imported = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      let sender = null;
      let message = null;
      
      if (trimmed.toLowerCase().startsWith('you:')) {
        sender = 'user';
        message = trimmed.substring(4).trim();
      } else if (trimmed.toLowerCase().startsWith('them:') || trimmed.toLowerCase().startsWith('match:')) {
        sender = 'match';
        message = trimmed.substring(trimmed.indexOf(':') + 1).trim();
      } else if (this.currentConversation && this.currentConversation.length > 0) {
        // Alternate sender based on last message
        const lastSender = this.currentConversation[this.currentConversation.length - 1].sender;
        sender = lastSender === 'user' ? 'match' : 'user';
        message = trimmed;
      } else {
        // Default to match starting the conversation
        sender = 'match';
        message = trimmed;
      }
      
      if (message) {
        this.addMessageToConversation(sender, message);
        imported++;
      }
    }
    
    this.showToast(`Imported ${imported} messages!`, 'success');
  }
  
  editMessage(index) {
    const messages = this.currentConversation || [];
    if (index < 0 || index >= messages.length) return;
    
    const msg = messages[index];
    const newText = prompt('Edit message:', msg.text);
    
    if (newText && newText.trim() && newText !== msg.text) {
      msg.text = newText.trim();
      this.saveConversation();
    }
  }
  
  deleteMessage(index) {
    const messages = this.currentConversation || [];
    if (index < 0 || index >= messages.length) return;
    
    if (confirm('Delete this message?')) {
      messages.splice(index, 1);
      this.saveConversation();
    }
  }
  
  async clearConversation() {
    const match = this.currentMatch;
    const conversationId = match.id || match.name;
    
    try {
      await window.api.clearConversation(conversationId);
      this.currentConversation = [];
      this.analyticsCacheStale = true;
      this.loadPage('match-detail');
      this.showToast('Conversation cleared', 'success');
    } catch (error) {
      console.error('Error clearing conversation:', error);
      this.showToast('Error clearing conversation', 'error');
    }
  }
  
  exportConversation() {
    const match = this.currentMatch;
    const messages = this.currentConversation || [];
    
    if (messages.length === 0) {
      this.showToast('No messages to export', 'info');
      return;
    }
    
    let text = `Conversation with ${match.name}\n`;
    text += `Exported: ${new Date().toLocaleString()}\n`;
    text += '='.repeat(50) + '\n\n';
    
    messages.forEach(msg => {
      const sender = msg.sender === 'user' ? 'You' : match.name;
      const time = this.formatTime(msg.timestamp);
      text += `[${time}] ${sender}: ${msg.text}\n\n`;
    });
    
    // Copy to clipboard
    navigator.clipboard.writeText(text);
    this.showToast('Conversation copied to clipboard!', 'success');
  }
  
  async saveConversation() {
    const match = this.currentMatch;
    const conversationId = match.id || match.name;
    
    try {
      // Update conversation in database
      await window.api.updateConversation(conversationId, this.currentConversation);
      this.analyticsCacheStale = true;
      this.loadPage('match-detail');
      this.showToast('Message updated', 'success');
    } catch (error) {
      console.error('Error saving conversation:', error);
      this.showToast('Error saving changes', 'error');
    }
  }
  
  showMatchProfileModal() {
    const match = this.currentMatch;
    
    let profileHtml = `<h3>${match.name}, ${match.age}</h3><p>${match.location}</p>`;
    
    if (match.occupation) {
      profileHtml += `<p><strong>Occupation:</strong> ${match.occupation}</p>`;
    }
    
    if (match.profile_data?.prompts && match.profile_data.prompts.length > 0) {
      profileHtml += '<h4 style="margin-top: 24px;">Prompts:</h4>';
      match.profile_data.prompts.forEach(prompt => {
        profileHtml += `
          <div style="margin: 16px 0; padding: 16px; background: var(--bg-input); border-radius: 12px;">
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">${prompt.question}</div>
            <div>${prompt.answer}</div>
          </div>
        `;
      });
    }
    
    if (match.notes) {
      profileHtml += `<h4 style="margin-top: 24px;">Your Notes:</h4><p>${match.notes}</p>`;
    }
    
    alert(profileHtml); // For now, using alert. Can be enhanced with custom modal later
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
      
      // Mark analytics cache as stale
      this.analyticsCacheStale = true;
      
      // Reload the page to show the new message
      this.loadPage('match-detail');
    } catch (error) {
      console.error('Error adding message:', error);
      this.showToast('Error adding message. Please try again.', 'error');
    }
  }

  async sendAIMessage(userMessage) {
    const match = this.currentMatch;
    
    // Prevent duplicate calls if already processing
    if (this.isProcessingAI) {
      console.log('AI request already in progress, ignoring duplicate');
      return;
    }
    
    // Validate match exists
    if (!match || !match.id) {
      this.showToast('Please select a match first', 'error');
      return;
    }
    
    console.log('Starting AI message processing...');
    this.isProcessingAI = true;
    
    // Add user message to chat
    this.aiMessages.push({
      role: 'user',
      content: userMessage
    });
    
    // Add thinking indicator
    this.aiMessages.push({
      role: 'assistant',
      content: '',
      isThinking: true
    });
    
    // Update chat display without re-initializing the whole page
    this.updateAIChatDisplay();
    this.startThinkingAnimation();
    
    try {
      // Build message history for API (exclude thinking message)
      const messages = this.aiMessages
        .filter(msg => !msg.isThinking)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      console.log('Calling AI API...');
      // Call AI service via IPC
      const result = await window.api.aiChat(messages, match.id);
      console.log('AI API response received:', result.success);
      
      // Remove thinking indicator
      this.aiMessages = this.aiMessages.filter(msg => !msg.isThinking);
      this.aiMessages = this.aiMessages.filter(msg => !msg.isThinking);
      
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
      // Remove thinking indicator
      this.aiMessages = this.aiMessages.filter(msg => !msg.isThinking);
      this.aiMessages.push({
        role: 'assistant',
        content: `⚠️ Error: ${error.message}\n\nPlease check your AI settings.`
      });
    } finally {
      // Always release the lock
      this.isProcessingAI = false;
      console.log('AI processing complete, flag released');
    }
    
    // Cache AI messages for this match
    const matchId = match.id || match.name;
    this.aiMessagesCache[matchId] = this.aiMessages;
    
    // Update chat display without re-initializing
    this.updateAIChatDisplay();
    
    // Scroll to bottom of chat
    setTimeout(() => {
      const chatContainer = document.getElementById('ai-chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
      
      // Re-initialize save to library buttons after render
      this.initSaveToLibraryButtons();
    }, 100);
  }

  updateAIChatDisplay() {
    // Update only the chat messages area without re-initializing the whole page
    const chatContainer = document.getElementById('ai-chat-messages');
    if (chatContainer) {
      chatContainer.innerHTML = this.renderAIMessages();
    }
  }

  startThinkingAnimation() {
    const thinkingMessages = [
      "Crafting the perfect rizz...",
      "Analyzing conversation vibes...",
      "Consulting the rizz database...",
      "Cooking up something smooth...",
      "Channeling peak charisma...",
      "Mixing charm and wit...",
      "Generating conversation gold...",
      "Optimizing flirt levels...",
      "Reading between the lines...",
      "Preparing smooth talk...",
      "Calibrating attraction algorithm...",
      "Finding the perfect angle...",
      "Sprinkling some magic...",
      "Loading charisma module...",
      "Brewing conversation starter..."
    ];
    
    let messageIndex = 0;
    this.thinkingInterval = setInterval(() => {
      const thinkingElement = document.querySelector('.thinking-message');
      if (thinkingElement) {
        messageIndex = (messageIndex + 1) % thinkingMessages.length;
        thinkingElement.textContent = thinkingMessages[messageIndex];
      }
    }, 1500);
  }

  renderAIMessages() {
    // Clear thinking interval if it exists
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
    
    return this.aiMessages.map((msg, index) => {
      if (msg.role === 'user') {
        return `
          <div class="ai-message user-ai-message">
            <div class="message-content user-message-content">
              <p>${msg.content.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        `;
      } else if (msg.isThinking) {
        return `
          <div class="ai-message thinking-message-container">
            <div class="message-avatar">
              <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
              <div class="thinking-animation">
                <span class="thinking-message">Crafting the perfect rizz...</span>
                <div class="thinking-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
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
              ${!msg.content.includes('⚠️') ? `
                <button class="btn btn-sm btn-secondary save-to-library-btn" data-message-index="${index}" style="margin-top: 12px;">
                  <i class="fas fa-bookmark"></i> Save to Library
                </button>
              ` : ''}
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
    const occupation = match.occupation || 'Occupation not set';
    
    // Get first prompt for preview
    const prompts = match.profile_data?.prompts || match.prompts || [];
    const firstPrompt = prompts.length > 0 ? prompts[0] : null;
    const promptAnswer = firstPrompt ? (firstPrompt.answer || firstPrompt.prompt || '') : '';
    const promptPreview = promptAnswer ? `${promptAnswer.substring(0, 60)}${promptAnswer.length > 60 ? '...' : ''}` : 'No prompts yet';
    
    // Generate initials for avatar if no photo
    const initials = match.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    return `
      <article class="hinge-card match-card" data-match-id="${match.id || match.name}">
        <div class="match-card-content">
          <header>
            ${photo 
              ? `<div class="avatar" style="background-image:url('${photo}')"></div>`
              : `<div class="avatar avatar-initials"><span>${initials}</span></div>`
            }
            <div class="match-info">
              <h3>${match.name}, ${match.age}</h3>
              <p class="match-location"><i class="fas fa-map-marker-alt"></i> ${location}</p>
              <p class="match-occupation"><i class="fas fa-briefcase"></i> ${occupation}</p>
            </div>
          </header>
          
          <div class="match-prompt-preview">
            <p class="prompt-label">${firstPrompt ? firstPrompt.question : 'About'}</p>
            <p class="prompt-text">${promptPreview}</p>
          </div>
        </div>
        
        <button class="match-action-btn match-open-btn" data-match-id="${match.id || match.name}">
          <span>Open Profile</span>
          <div class="action-arrow">
            <i class="fas fa-arrow-right"></i>
          </div>
        </button>
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
            this.showToast('AI settings saved successfully!', 'success');
          } else {
            this.showToast(`Error saving settings: ${result.error}`, 'error');
          }
        } catch (error) {
          console.error('Error saving AI settings:', error);
          this.showToast('Error saving settings. Please try again.', 'error');
        }
      });
    }
  }

  showPersonalityAssessment() {
    this.assessmentStep = 1;
    this.assessmentData = {
      interests: {},
      communication_style: {},
      values: {},
      dating_approach: {},
      personal_philosophy: {}
    };
    this.renderAssessmentStep();
  }

  renderAssessmentStep() {
    const assessmentQuestions = {
      1: {
        title: 'Your Interests & Energy',
        subtitle: 'Step 1 of 5',
        icon: 'heart',
        questions: [
          { key: 'hobbies', label: 'What do you do in your free time?', icon: 'running', type: 'multiselect', options: ['Working out / Sports', 'Reading / Podcasts', 'Art / Creative projects', 'Gaming / Tech', 'Cooking / Food adventures', 'Traveling / Exploring', 'Music / Concerts', 'Social events / Parties', 'Nature / Hiking', 'Staying in / Movies'] },
          { key: 'social_energy', label: 'How do you recharge?', icon: 'battery-full', type: 'select', options: ['Being around people energizes me', 'I need alone time to recharge', 'Depends on my mood and the vibe', 'Small groups are my sweet spot'] },
          { key: 'weekend_vibe', label: 'Your ideal weekend:', icon: 'calendar-week', type: 'select', options: ['Spontaneous adventure - no plans needed', 'Structured fun - planned activities', 'Balance of both planned and spontaneous', 'Pure relaxation - minimal plans'] },
          { key: 'passion_projects', label: 'What are you passionate about right now?', icon: 'fire', type: 'multiselect', options: ['Career growth / Learning', 'Health & fitness', 'Creative pursuits', 'Social causes', 'Travel goals', 'Building friendships', 'Personal development', 'Going with the flow'] }
        ]
      },
      2: {
        title: 'Communication Style',
        subtitle: 'Step 2 of 5',
        icon: 'comments',
        questions: [
          { key: 'humor_type', label: 'What humor do you vibe with?', icon: 'laugh-beam', type: 'multiselect', options: ['Witty & clever wordplay', 'Playful teasing & banter', 'Sarcasm & dry humor', 'Silly & random', 'Observational & relatable', 'Dark humor', 'Wholesome & sweet'] },
          { key: 'conversation_pace', label: 'Your texting style:', icon: 'stopwatch', type: 'select', options: ['Quick replies - always on phone', 'Thoughtful - I take my time', 'Sporadic - depends on schedule', 'Match their energy - I adapt'] },
          { key: 'message_length', label: 'Message length preference:', icon: 'text-height', type: 'select', options: ['Short & punchy', 'Detailed paragraphs', 'Voice notes for long stuff', 'Mix based on topic'] },
          { key: 'emoji_usage', label: 'Emoji usage?', icon: 'grin-hearts', type: 'select', options: ['Constantly - adds personality ✨', 'Occasionally - for emphasis', 'Rarely - words speak', 'Strategic use only'] },
          { key: 'conversation_depth', label: 'What conversations excite you?', icon: 'brain', type: 'multiselect', options: ['Deep philosophical talks', 'Playful banter & flirting', 'Personal stories', 'Current events & hot takes', 'Hypothetical scenarios', 'Light small talk', 'Life goals & dreams'] },
          { key: 'conflict_style', label: 'When there\'s tension:', icon: 'bolt', type: 'select', options: ['Address it immediately', 'Need time to process first', 'Use humor to diffuse', 'Avoid conflict when possible'] }
        ]
      },
      3: {
        title: 'Values & Priorities',
        subtitle: 'Step 3 of 5',
        icon: 'compass',
        questions: [
          { key: 'relationship_goal', label: 'What are you looking for?', icon: 'heart-pulse', type: 'select', options: ['Serious relationship - ready to commit', 'See where it goes - no pressure', 'Casual dating & meeting people', 'Something real but slow', 'Honestly still figuring it out'] },
          { key: 'life_priorities', label: 'What matters most right now?', icon: 'clipboard-list', type: 'multiselect', options: ['Career & professional growth', 'Personal relationships', 'Financial stability', 'Health & wellness', 'Adventure & experiences', 'Family & close friends', 'Creative expression', 'Making positive impact'] },
          { key: 'deal_breakers', label: 'What would be a deal-breaker?', icon: 'ban', type: 'multiselect', options: ['Poor communication', 'Lack of ambition', 'Different life goals', 'No sense of humor', 'Different family values', 'Incompatible lifestyles', 'Not emotionally available', 'Values misalignment'] },
          { key: 'love_language', label: 'How do you show affection?', icon: 'heart-circle-plus', type: 'multiselect', options: ['Quality time together', 'Physical touch', 'Words of affirmation', 'Acts of service', 'Thoughtful gifts'] },
          { key: 'future_vision', label: 'Where do you see yourself in 5 years?', icon: 'binoculars', type: 'select', options: ['Clear vision - specific goals', 'General direction - flexible', 'Open to possibilities', 'No idea - living present'] }
        ]
      },
      4: {
        title: 'Dating Approach',
        subtitle: 'Step 4 of 5',
        icon: 'heart-pulse',
        questions: [
          { key: 'initiative_level', label: 'Who makes the first move?', icon: 'rocket', type: 'select', options: ['Me - I go for it', 'Them - I prefer being pursued', '50/50 - depends on vibe', 'Whoever feels it first'] },
          { key: 'meeting_timeline', label: 'When to meet in person?', icon: 'calendar-days', type: 'select', options: ['ASAP - coffee this week', 'After few days of texting', 'Week or two - build rapport', 'When it feels right'] },
          { key: 'flirtation_comfort', label: 'Your flirting approach:', icon: 'fire-flame-curved', type: 'select', options: ['Bold & direct', 'Playful & subtle', 'Reserved - wait for signals', 'Natural & organic'] },
          { key: 'conversation_starters', label: 'Best first date topics:', icon: 'message', type: 'multiselect', options: ['Travel stories', 'Career & passions', 'Hobbies & interests', 'Music, movies, culture', 'Life philosophy', 'Funny experiences', 'Future goals', 'Random hypotheticals'] },
          { key: 'date_style', label: 'Ideal first date:', icon: 'champagne-glasses', type: 'select', options: ['Active & adventurous', 'Casual drinks or coffee', 'Dinner with ambiance', 'Unique experience', 'Walk outdoors - low pressure'] }
        ]
      },
      5: {
        title: 'Personal Philosophy',
        subtitle: 'Step 5 of 5',
        icon: 'lightbulb',
        questions: [
          { key: 'life_motto', label: 'Your approach to life:', icon: 'mountain-sun', type: 'select', options: ['YOLO - take risks', 'Work hard, play hard', 'Slow and steady', 'Go with the flow', 'Plan for best, prepare for worst', 'Quality over quantity'] },
          { key: 'growth_mindset', label: 'How you handle challenges:', icon: 'dumbbell', type: 'select', options: ['Bring it on', 'Step by step', 'Lean on others', 'Avoid if possible', 'Depends on the stakes'] },
          { key: 'authenticity', label: 'Being yourself in dating:', icon: 'masks-theater', type: 'select', options: ['100% authentic day one', 'Gradually reveal real me', 'Adapt to their energy', 'Best foot forward first', 'Working on this'] },
          { key: 'personality_traits', label: 'Friends describe you as:', icon: 'user-group', type: 'multiselect', options: ['Adventurous & spontaneous', 'Thoughtful & empathetic', 'Funny & entertaining', 'Ambitious & driven', 'Laid-back & chill', 'Loyal & dependable', 'Creative & artistic', 'Analytical & logical'] },
          { key: 'vulnerability', label: 'Opening up emotionally:', icon: 'hand-holding-heart', type: 'select', options: ['Easy - I\'m an open book', 'Takes time but I get there', 'Only with deep trust', 'Working on it'] }
        ]
      }
    };

    const currentQuestions = assessmentQuestions[this.assessmentStep];
    
    // Use the add-match modal
    const modal = document.getElementById('add-match-modal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
      <div class="modal-header">
        <h2><i class="fas fa-${currentQuestions.icon}"></i> ${currentQuestions.title}</h2>
        <button class="modal-close" id="assessment-close-btn">&times;</button>
      </div>
      <div class="assessment-modal">
        <div class="assessment-header">
          <p class="assessment-subtitle">${currentQuestions.subtitle}</p>
          <div class="assessment-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(this.assessmentStep / 5) * 100}%"></div>
            </div>
          </div>
        </div>
        
        <div class="assessment-questions">
          ${currentQuestions.questions.map((q, idx) => this.renderQuestion(q, idx)).join('')}
        </div>
        
        <div class="assessment-actions">
          ${this.assessmentStep > 1 ? '<button class="btn btn-secondary" id="assessment-back-btn"><i class="fas fa-arrow-left"></i> Back</button>' : ''}
          <button class="btn btn-primary" id="assessment-next-btn">
            ${this.assessmentStep < 5 ? 'Next <i class="fas fa-arrow-right"></i>' : 'Complete <i class="fas fa-check"></i>'}
          </button>
        </div>
      </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.initAssessmentHandlers();
  }

  renderQuestion(question, index) {
    const stepKey = ['interests', 'communication_style', 'values', 'dating_approach', 'personal_philosophy'][this.assessmentStep - 1];
    const savedValue = this.assessmentData[stepKey][question.key] || [];
    
    if (question.type === 'multiselect') {
      return `
        <div class="assessment-question">
          <label><i class="fas fa-${question.icon}"></i> ${question.label}</label>
          <div class="multiselect-options">
            ${question.options.map(opt => `
              <label class="checkbox-label">
                <input type="checkbox" name="${question.key}" value="${opt}" ${Array.isArray(savedValue) && savedValue.includes(opt) ? 'checked' : ''}>
                <span>${opt}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      return `
        <div class="assessment-question">
          <label><i class="fas fa-${question.icon}"></i> ${question.label}</label>
          <select name="${question.key}" class="assessment-select">
            <option value="">Select an option...</option>
            ${question.options.map(opt => `
              <option value="${opt}" ${savedValue === opt ? 'selected' : ''}>${opt}</option>
            `).join('')}
          </select>
        </div>
      `;
    }
  }

  initAssessmentHandlers() {
    const closeBtn = document.getElementById('assessment-close-btn');
    const backBtn = document.getElementById('assessment-back-btn');
    const nextBtn = document.getElementById('assessment-next-btn');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const modal = document.getElementById('add-match-modal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
      });
    }
    
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.saveCurrentStepData();
        this.assessmentStep--;
        this.renderAssessmentStep();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', async () => {
        this.saveCurrentStepData();
        
        if (this.assessmentStep < 5) {
          this.assessmentStep++;
          this.renderAssessmentStep();
        } else {
          // Complete assessment
          try {
            console.log('Saving assessment data:', this.assessmentData);
            await window.api.savePersonalityAssessment(this.assessmentData);
            console.log('Assessment saved successfully!');
            const modal = document.getElementById('add-match-modal');
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Show celebration message
            const successMsg = document.createElement('div');
            successMsg.style.cssText = `
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: linear-gradient(135deg, rgba(119, 82, 255, 0.95), rgba(155, 125, 255, 0.95));
              color: white;
              padding: 32px 48px;
              border-radius: 16px;
              font-size: 18px;
              font-weight: 600;
              box-shadow: 0 8px 32px rgba(119, 82, 255, 0.4);
              z-index: 10000;
              animation: fadeInUp 0.4s ease;
              text-align: center;
            `;
            successMsg.innerHTML = `
              <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
              Assessment Complete!
              <br>
              <span style="font-size: 14px; font-weight: 400; opacity: 0.9; margin-top: 8px; display: block;">
                Your signature vibe has been generated
              </span>
            `;
            document.body.appendChild(successMsg);
            
            setTimeout(() => {
              successMsg.remove();
              this.loadPage('profile');
              this.initProfilePage();
            }, 2500);
          } catch (error) {
            console.error('Error saving assessment:', error);
            this.showToast('Error saving assessment. Please try again.', 'error');
          }
        }
      });
    }
  }

  saveCurrentStepData() {
    const stepKey = ['interests', 'communication_style', 'values', 'dating_approach', 'personal_philosophy'][this.assessmentStep - 1];
    const questions = document.querySelectorAll('.assessment-question');
    
    questions.forEach(q => {
      const checkboxes = q.querySelectorAll('input[type="checkbox"]');
      const select = q.querySelector('select');
      
      if (checkboxes.length > 0) {
        const key = checkboxes[0].name;
        const values = Array.from(checkboxes)
          .filter(cb => cb.checked)
          .map(cb => cb.value);
        this.assessmentData[stepKey][key] = values;
      } else if (select) {
        this.assessmentData[stepKey][select.name] = select.value;
      }
    });
  }
  
  async loadUserPrompts() {
    try {
      const profile = await window.api.getUserProfile();
      const prompts = profile?.prompts || [];
      
      const promptsList = document.getElementById('prompts-list');
      if (!promptsList) return;
      
      if (prompts.length === 0) {
        promptsList.innerHTML = `
          <div style="text-align: center; padding: 32px; color: var(--text-secondary);">
            <i class="fas fa-comment-dots" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
            <p>No prompts added yet. Click "Add Prompt" to get started.</p>
          </div>
        `;
        return;
      }
      
      promptsList.innerHTML = prompts.map((prompt, index) => `
        <div class="prompt-card" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; color: var(--accent-primary); margin-bottom: 8px; font-size: 14px;">
                ${prompt.question}
              </div>
              <div style="color: var(--text-primary); line-height: 1.6;">
                ${prompt.answer}
              </div>
            </div>
            <button class="btn-icon" onclick="app.deletePrompt(${index})" style="margin-left: 12px;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  }
  
  showAddPromptModal() {
    const modal = document.getElementById('add-match-modal');
    const modalContent = document.querySelector('.modal-content');
    
    // Popular Hinge prompts
    const hingePrompts = [
      "I'll fall for you if...",
      "My simple pleasures",
      "The way to win me over is...",
      "I'm looking for",
      "We'll get along if...",
      "Believe it or not, I...",
      "I go crazy for",
      "I won't shut up about",
      "The one thing you should know about me",
      "My most irrational fear",
      "Together we could",
      "I'm overly competitive about",
      "The key to my heart is",
      "I'm weirdly attracted to",
      "Typical Sunday",
      "My greatest strength",
      "I'm convinced that",
      "Don't hate me if I",
      "I know the best spot in town for",
      "The last show I binged",
      "I'm the type of texter who",
      "A boundary for me is",
      "Dating me is like",
      "All I ask is that you",
      "I'll pick the topic, you start the conversation",
      "My most useless skill",
      "The award I most deserved but never got",
      "A review from a friend"
    ].sort();
    
    modalContent.innerHTML = `
      <div class="modal-header">
        <h3>Add Hinge Prompt</h3>
        <button class="close-btn" id="close-prompt-modal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <form id="add-prompt-form">
        <div class="form-group">
          <label for="prompt-search">Search for a Hinge prompt</label>
          <input 
            type="text" 
            id="prompt-search" 
            placeholder="Type to search prompts..." 
            autocomplete="off"
          >
        </div>
        
        <div class="form-group">
          <label for="prompt-question">Select or enter your prompt</label>
          <select id="prompt-question" size="8" style="height: auto; padding: 8px;">
            ${hingePrompts.map(p => `<option value="${p}">${p}</option>`).join('')}
          </select>
          <input 
            type="text" 
            id="custom-prompt" 
            placeholder="Or type a custom prompt..." 
            style="margin-top: 8px;"
          >
        </div>
        
        <div class="form-group">
          <label for="prompt-answer">Your Answer</label>
          <textarea 
            id="prompt-answer" 
            rows="4" 
            placeholder="Your creative answer..."
            required
          ></textarea>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="cancel-prompt-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-plus"></i> Add Prompt
          </button>
        </div>
      </form>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Setup search functionality
    const searchInput = document.getElementById('prompt-search');
    const selectElement = document.getElementById('prompt-question');
    const customInput = document.getElementById('custom-prompt');
    
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const options = selectElement.querySelectorAll('option');
      
      let visibleCount = 0;
      options.forEach(option => {
        const text = option.textContent.toLowerCase();
        const isVisible = text.includes(searchTerm);
        option.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount++;
      });
      
      // If search is cleared, deselect
      if (!searchTerm) {
        selectElement.selectedIndex = -1;
      }
    });
    
    // When selecting from dropdown, clear custom input and search
    selectElement.addEventListener('change', () => {
      if (selectElement.selectedIndex >= 0) {
        customInput.value = '';
        // Optionally populate search with selected value for clarity
        searchInput.value = selectElement.options[selectElement.selectedIndex].text;
      }
    });
    
    // When clicking on select options, ensure selection works
    selectElement.addEventListener('click', (e) => {
      // Only clear custom input if an option is actually selected
      if (e.target.tagName === 'OPTION') {
        customInput.value = '';
      }
    });
    
    // When typing custom, clear selection and search
    customInput.addEventListener('input', () => {
      if (customInput.value.trim()) {
        selectElement.selectedIndex = -1;
        searchInput.value = '';
      }
    });
    
    // Close handlers
    document.getElementById('close-prompt-modal').addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
    
    document.getElementById('cancel-prompt-modal').addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
    
    // Form submit
    document.getElementById('add-prompt-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const question = customInput.value.trim() || 
                       (selectElement.selectedIndex >= 0 ? selectElement.value : '');
      const answer = document.getElementById('prompt-answer').value.trim();
      
      if (!question) {
        this.showToast('Please select or enter a prompt', 'info');
        return;
      }
      
      try {
        const profile = await window.api.getUserProfile() || {};
        const prompts = profile.prompts || [];
        prompts.push({ question, answer });
        
        await window.api.updateUserProfile({ prompts });
        
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        this.loadUserPrompts();
      } catch (error) {
        console.error('Error saving prompt:', error);
        this.showToast('Error saving prompt. Please try again.', 'error');
      }
    });
  }
  
  async deletePrompt(index) {
    if (!confirm('Delete this prompt?')) return;
    
    try {
      const profile = await window.api.getUserProfile();
      const prompts = profile?.prompts || [];
      prompts.splice(index, 1);
      
      await window.api.updateUserProfile({ prompts });
      this.loadUserPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      this.showToast('Error deleting prompt. Please try again.', 'error');
    }
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new LatchaiApp();
  app.init();
});
