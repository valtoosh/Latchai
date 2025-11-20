// Animated SVG Paths Background
class AnimatedPathsBackground {
  constructor() {
    // Disabled to prevent tile memory errors
    console.log('AnimatedPathsBackground: Disabled to prevent rendering issues');
  }

  destroy() {
    // No-op
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.animatedBackground = new AnimatedPathsBackground();
  });
} else {
  window.animatedBackground = new AnimatedPathsBackground();
}
