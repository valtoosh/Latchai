// ADD THESE FUNCTIONS TO app.js AFTER loadProfileData

async loadSignatureVibe() {
  try {
    const assessment = await window.api.getPersonalityAssessment();
    const vibeCard = document.getElementById('signature-vibe-card');
    
    if (!vibeCard) return;
    
    if (assessment && Object.keys(assessment).length > 0) {
      const vibe = this.generateSignatureVibe(assessment);
      
      vibeCard.innerHTML = `
        <p class="prompt-tag">Signature vibe</p>
        <h3>"${vibe.tagline}"</h3>
        <p style="color: var(--text-secondary); margin: 16px 0 24px 0; font-size: 14px; line-height: 1.6;">
          Your personality profile helps AI mirror your authentic voice.
        </p>
        <div class="profile-side-list">
          ${vibe.traits.map(t => `<span><i class="fas fa-${t.icon}"></i> ${t.text}</span>`).join('')}
        </div>
        <button class="btn btn-secondary" id="retake-assessment-btn" style="margin-top: 16px;">
          <i class="fas fa-refresh"></i> Retake
        </button>
      `;
      
      const retakeBtn = document.getElementById('retake-assessment-btn');
      if (retakeBtn) {
        retakeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.showPersonalityAssessment();
        });
      }
    } else {
      vibeCard.innerHTML = `
        <p class="prompt-tag">Signature vibe</p>
        <h3 id="vibe-headline">"Complete your assessment"</h3>
        <p id="vibe-description" style="color: var(--text-secondary); margin: 16px 0; font-size: 14px; line-height: 1.6;">
          Take the 5-step personality assessment to unlock your unique signature vibe.
        </p>
      `;
    }
  } catch (error) {
    console.error('Error loading signature vibe:', error);
  }
}

generateSignatureVibe(assessment) {
  const interests = assessment.interests || {};
  const communication = assessment.communication_style || {};
  const values = assessment.values || {};
  const dating = assessment.dating_approach || {};
  const philosophy = assessment.personal_philosophy || {};
  
  // Generate tagline
  let style = '';
  let energy = '';
  
  // Determine style from humor
  const humor = communication.humor_type || [];
  if (Array.isArray(humor)) {
    if (humor.includes('Witty & clever wordplay')) style = 'Sharp wit';
    else if (humor.includes('Playful teasing & banter')) style = 'Playful energy';
    else if (humor.includes('Sarcasm & dry humor')) style = 'Dry humor';
    else if (humor.includes('Wholesome & sweet')) style = 'Warm vibes';
    else style = 'Authentic style';
  }
  
  // Determine energy
  const flirtation = dating.flirtation_comfort || '';
  const initiative = dating.initiative_level || '';
  if (flirtation.includes('Bold & direct') || initiative.includes('Me - I go for it')) {
    energy = 'confident moves';
  } else if (flirtation.includes('Playful & subtle')) {
    energy = 'smooth charm';
  } else if (communication.conversation_pace && communication.conversation_pace.includes('Quick')) {
    energy = 'high energy';
  } else {
    energy = 'natural flow';
  }
  
  const tagline = `${style} + ${energy}`;
  
  // Generate 3 traits
  const traits = [];
  
  // Trait 1: Communication
  const depth = communication.conversation_depth || [];
  if (Array.isArray(depth) && depth.includes('Playful banter & flirting')) {
    traits.push({ icon: 'comments', text: 'Playful banter > small talk' });
  } else if (Array.isArray(depth) && depth.includes('Deep philosophical talks')) {
    traits.push({ icon: 'brain', text: 'Deep convos over surface level' });
  } else {
    traits.push({ icon: 'comments', text: 'Real talk preferred' });
  }
  
  // Trait 2: Lifestyle
  const hobbies = interests.hobbies || [];
  if (Array.isArray(hobbies)) {
    if (hobbies.includes('Music / Concerts')) {
      traits.push({ icon: 'music', text: 'Music lover at heart' });
    } else if (hobbies.includes('Nature / Hiking') || hobbies.includes('Traveling / Exploring')) {
      traits.push({ icon: 'mountain', text: 'Adventure seeker' });
    } else if (hobbies.includes('Working out / Sports')) {
      traits.push({ icon: 'dumbbell', text: 'Active lifestyle' });
    } else if (hobbies.includes('Art / Creative projects')) {
      traits.push({ icon: 'palette', text: 'Creative spirit' });
    } else {
      traits.push({ icon: 'heart', text: 'Balanced lifestyle' });
    }
  } else {
    traits.push({ icon: 'heart', text: 'Living life fully' });
  }
  
  // Trait 3: Dating style
  const relationshipGoal = values.relationship_goal || '';
  const dateStyle = dating.date_style || '';
  if (relationshipGoal.includes('Serious relationship')) {
    traits.push({ icon: 'heart-pulse', text: 'Looking for something real' });
  } else if (dateStyle.includes('Active & adventurous')) {
    traits.push({ icon: 'bolt', text: 'Adventure > dinner dates' });
  } else if (flirtation.includes('Bold & direct')) {
    traits.push({ icon: 'fire', text: 'Direct with intentions' });
  } else {
    traits.push({ icon: 'heart-pulse', text: 'Authentic connections' });
  }
  
  return { tagline, traits };
}

// ALSO UPDATE loadProfileData to call loadSignatureVibe():
// Add this line before the catch block:
//   await this.loadSignatureVibe();
