@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  /* Deep, rich dark mode palette */
  --bg-core: #09090b;
  --bg-panel: rgba(20, 20, 23, 0.65); /* High transparency for glass effect */
  --bg-card: rgba(30, 30, 35, 0.6);
  --bg-input: rgba(18, 18, 20, 0.8);
  
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;
  
  /* Vibrant Accent Colors */
  --accent-primary: #8b5cf6; /* Violet-500 */
  --accent-secondary: #6d28d9; /* Violet-700 */
  --accent-glow: rgba(139, 92, 246, 0.5);
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  --gradient-surface: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%);
  
  --border-color: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.15);
  
  /* Shadows & Glows */
  --shadow-card: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  --shadow-hover: 0 20px 40px -10px rgba(0, 0, 0, 0.6);
  --glow-soft: 0 0 20px rgba(139, 92, 246, 0.15);
  
  /* Animation Speeds */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  
  --glass-blur: blur(20px);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-core);
  color: var(--text-primary);
  overflow: hidden;
  line-height: 1.6;
  position: relative;
}

/* --- Ambient Background Animation --- */
/* This creates the "Lively" nebula effect */
body::before,
body::after {
  content: '';
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  z-index: -1;
  pointer-events: none;
}

/* Layer 1: Moving gradients */
body::before {
  background: 
    radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.15), transparent 40%),
    radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.12), transparent 40%),
    radial-gradient(circle at 50% 80%, rgba(67, 56, 202, 0.1), transparent 40%);
  background-size: 200% 200%;
  animation: ambientShift 20s ease infinite alternate;
}

/* Layer 2: Subtle noise grain for texture */
body::after {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
  opacity: 0.4;
}

@keyframes ambientShift {
  0% { background-position: 0% 50%; transform: scale(1); }
  50% { background-position: 100% 50%; transform: scale(1.05); }
  100% { background-position: 0% 50%; transform: scale(1); }
}

#app {
  display: flex;
  height: 100vh;
  width: 100vw;
}

/* --- Sidebar (Glassmorphism) --- */
#sidebar {
  width: 260px;
  background-color: var(--bg-panel);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 32px 0;
  z-index: 10;
  -webkit-app-region: drag;
}

.logo {
  padding: 0 32px 32px;
  -webkit-app-region: no-drag;
}

.logo h1 {
  font-family: 'Playfair Display', serif;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(to bottom right, #fff, #ccc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.02em;
  margin-bottom: 6px;
  /* Subtle text glow */
  text-shadow: 0 0 30px rgba(255,255,255,0.1);
}

.logo .tagline {
  font-size: 12px;
  font-weight: 500;
  color: var(--accent-primary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.nav-menu {
  list-style: none;
  margin-top: 16px;
  padding: 0 16px;
  -webkit-app-region: no-drag;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.3s var(--ease-smooth);
  color: var(--text-secondary);
  border-radius: 16px;
  font-weight: 500;
  font-size: 14px;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.nav-item:hover {
  color: var(--text-primary);
  background-color: rgba(255, 255, 255, 0.05);
  transform: translateX(4px);
}

.nav-item.active {
  color: #fff;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow: var(--glow-soft);
}

/* Active Indicator */
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 10px var(--accent-primary);
}

.nav-item .icon {
  font-size: 18px;
  margin-right: 14px;
  width: 20px;
  display: flex;
  justify-content: center;
}

/* --- Main Content Area --- */
#main-content {
  flex: 1;
  overflow-y: overlay;
  position: relative;
}

#page-container {
  padding: 48px 64px 100px;
  max-width: 1400px;
  margin: 0 auto;
}

/* --- Page Transitions --- */
/* Elements animate in when page loads */
.card, .match-card, .stat-card, .hinge-card {
  animation: slideUpFade 0.6s var(--ease-smooth) backwards;
}

/* Stagger animations for lists */
.match-card:nth-child(1) { animation-delay: 0.05s; }
.match-card:nth-child(2) { animation-delay: 0.1s; }
.match-card:nth-child(3) { animation-delay: 0.15s; }
.match-card:nth-child(4) { animation-delay: 0.2s; }

@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Cards & Surfaces --- */
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(10px);
  transition: transform 0.3s var(--ease-smooth), box-shadow 0.3s var(--ease-smooth);
}

.card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-hover);
}

.hinge-card {
  background: linear-gradient(145deg, rgba(30,30,35,0.8), rgba(20,20,25,0.9));
  border-radius: 32px;
  padding: 40px;
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 20px 50px -15px rgba(0,0,0,0.5);
  position: relative;
  overflow: hidden;
}

/* Subtle Shine Effect on Hero Card */
.hinge-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
  transform: skewX(-20deg);
  animation: shine 8s infinite linear;
}

@keyframes shine {
  0% { left: -100%; }
  20% { left: 200%; }
  100% { left: 200%; }
}

/* --- Typography --- */
.page-header h2 {
  font-family: 'Playfair Display', serif;
  font-size: 42px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 12px;
  background: linear-gradient(180deg, #ffffff, #cccccc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.prompt-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #d4d4d8;
  background: rgba(255,255,255,0.08);
  padding: 6px 12px;
  border-radius: 8px;
  display: inline-block;
  border: 1px solid rgba(255,255,255,0.05);
}

/* --- Stats Pills (Dashboard) --- */
.stat-pills {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.pill {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 24px;
  transition: all 0.3s var(--ease-bounce);
}

.pill:hover {
  transform: translateY(-4px);
  background: rgba(139, 92, 246, 0.05);
  border-color: var(--accent-primary);
  box-shadow: 0 10px 30px -10px rgba(139, 92, 246, 0.2);
}

/* --- Buttons --- */
.btn {
  padding: 14px 28px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s var(--ease-smooth);
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  letter-spacing: 0.02em;
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: var(--gradient-primary);
  color: #fff;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
  border: 1px solid rgba(255,255,255,0.1);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.5);
}

/* Button Ripple Effect on Click */
.btn:active {
  transform: scale(0.98);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--text-secondary);
}

/* --- Inputs --- */
input, textarea, select {
  background-color: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 16px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 15px;
  transition: all 0.2s ease;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
  background-color: #000;
}

/* --- Match Grid & Cards --- */
.match-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 32px;
}

.match-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 0;
  overflow: hidden;
  transition: all 0.4s var(--ease-smooth);
  position: relative;
}

/* Hover State for Match Cards */
.match-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px -5px rgba(0,0,0,0.5);
  border-color: rgba(139, 92, 246, 0.4);
}

/* Image/Avatar Area */
.match-card header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
  transition: transform 0.3s var(--ease-bounce);
}

.match-card:hover .avatar {
  transform: scale(1.1) rotate(-3deg);
}

.match-card-content {
  padding: 24px;
}

.match-prompt-preview {
  background: rgba(255,255,255,0.03);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--border-color);
}

.prompt-text {
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  font-style: italic;
  color: #e4e4e7;
  line-height: 1.5;
}

.match-action-btn {
  width: 100%;
  padding: 18px 24px;
  background: rgba(255,255,255,0.02);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-secondary);
  font-weight: 500;
  transition: background 0.2s;
}

.match-action-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  color: #fff;
}

.match-action-btn .action-arrow {
  width: 32px;
  height: 32px;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s var(--ease-bounce);
}

.match-action-btn:hover .action-arrow {
  transform: translateX(5px);
  background: var(--accent-primary);
}

/* --- Chat Interface --- */
.conversation-container {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 650px;
  box-shadow: var(--shadow-card);
}

.conversation-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  background: rgba(20, 20, 23, 0.8);
  backdrop-filter: blur(10px);
  z-index: 2;
}

.chat-messages, .ai-chat-messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  /* Subtle pattern for chat background */
  background-image: 
    radial-gradient(#333 1px, transparent 1px);
  background-size: 20px 20px;
  background-color: rgba(0,0,0,0.2);
}

/* Message Bubbles */
.chat-message {
  opacity: 0;
  animation: slideInMessage 0.4s var(--ease-smooth) forwards;
}

@keyframes slideInMessage {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.message-bubble {
  max-width: 75%;
  padding: 14px 20px;
  border-radius: 22px;
  font-size: 15px;
  line-height: 1.5;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.user-message .message-bubble {
  background: var(--gradient-primary);
  color: #fff;
  border-bottom-right-radius: 4px;
  margin-left: auto; /* Push to right */
}

.match-message .message-bubble {
  background: rgba(255,255,255,0.08);
  color: #fff;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(255,255,255,0.05);
}

/* AI Thinking Animation */
.thinking-dots span {
  width: 6px;
  height: 6px;
  background: var(--accent-primary);
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}

.thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* --- Toast Notifications (New) --- */
#toast-container {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast {
  background: rgba(26, 26, 29, 0.9);
  backdrop-filter: blur(12px);
  color: #fff;
  padding: 16px 24px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 320px;
  transform: translateY(30px) scale(0.95);
  opacity: 0;
  animation: toastEnter 0.4s var(--ease-bounce) forwards;
  pointer-events: auto;
}

@keyframes toastEnter {
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.toast i { font-size: 20px; }
.toast.success i { color: #10b981; }
.toast.error i { color: #ef4444; }

/* --- Scrollbars --- */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.2);
}

/* Header layout fix */
#top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40px 64px 0;
}

.profile-chip {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border-radius: 100px;
  padding: 6px 20px 6px 6px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.2s;
}

.profile-chip:hover {
  background: rgba(255,255,255,0.1);
}

.profile-initials {
  width: 38px;
  height: 38px;
  background: var(--gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
}