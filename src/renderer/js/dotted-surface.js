// 3D Dotted Surface Background using Canvas
class DottedSurface {
  constructor() {
    // Disabled to prevent tile memory errors
    console.log('DottedSurface: Disabled to prevent rendering issues');
  }

  destroy() {
    // No-op
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.dottedSurface = new DottedSurface();
  });
} else {
  window.dottedSurface = new DottedSurface();
}
