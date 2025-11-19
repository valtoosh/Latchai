// Animated SVG Paths Background
class AnimatedPathsBackground {
  constructor() {
    this.container = null;
    this.svg = null;
    this.paths = [];
    this.animationFrameId = null;
    this.init();
  }

  init() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'animated-paths-bg';
    
    // Create SVG
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', '0 0 1920 1080');
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    
    this.container.appendChild(this.svg);
    
    // Generate paths
    this.generatePaths();
    
    // Insert as first child of body (behind everything)
    document.body.insertBefore(this.container, document.body.firstChild);
    
    // Start animation
    this.animate();
  }

  generatePaths() {
    const pathCount = 24;
    const width = 1920;
    const height = 1080;
    
    for (let i = 0; i < pathCount; i++) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      // Create flowing curved path
      const startX = -200 - (i * 30);
      const startY = height * 0.3 + (i * 15);
      const cp1X = width * 0.2 - (i * 20);
      const cp1Y = height * 0.5 - (i * 10);
      const cp2X = width * 0.6 + (i * 25);
      const cp2Y = height * 0.3 + (i * 20);
      const endX = width + 200 + (i * 30);
      const endY = height * 0.7 - (i * 15);
      
      const d = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
      
      path.setAttribute('d', d);
      path.setAttribute('stroke-width', (0.5 + i * 0.05).toString());
      path.setAttribute('stroke-opacity', (0.05 + i * 0.02).toString());
      path.setAttribute('stroke-dasharray', '1000');
      path.setAttribute('stroke-dashoffset', '1000');
      
      // Add animation delay for stagger effect
      const delay = i * 0.3;
      path.style.animationDelay = `${delay}s`;
      
      this.svg.appendChild(path);
      this.paths.push({
        element: path,
        offset: i * 100,
        speed: 0.5 + Math.random() * 0.5
      });
    }
  }

  animate() {
    let time = 0;
    
    const update = () => {
      time += 0.001;
      
      this.paths.forEach((pathData, index) => {
        const offset = Math.sin(time * pathData.speed + pathData.offset) * 500 + 500;
        pathData.element.setAttribute('stroke-dashoffset', offset.toString());
        
        // Pulsing opacity
        const opacity = 0.05 + Math.sin(time * pathData.speed * 2 + pathData.offset) * 0.1 + 0.1;
        pathData.element.setAttribute('stroke-opacity', opacity.toFixed(2));
      });
      
      this.animationFrameId = requestAnimationFrame(update);
    };
    
    update();
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
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
