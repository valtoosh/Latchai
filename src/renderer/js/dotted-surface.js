// 3D Dotted Surface Background using Canvas
class DottedSurface {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationFrameId = null;
    this.count = 0;
    
    // Configuration
    this.SEPARATION = 80;
    this.AMOUNTX = 25;
    this.AMOUNTY = 20;
    this.WAVE_AMPLITUDE = 30;
    
    this.init();
  }

  init() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'dotted-surface-bg';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -3;
      pointer-events: none;
      opacity: 0.25;
    `;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    
    // Set canvas size
    this.resize();
    
    // Create particles
    this.createParticles();
    
    // Insert into body
    document.body.insertBefore(this.container, document.body.firstChild);
    
    // Event listeners
    window.addEventListener('resize', () => this.resize());
    
    // Start animation
    this.animate();
  }

  createParticles() {
    this.particles = [];
    
    for (let ix = 0; ix < this.AMOUNTX; ix++) {
      for (let iy = 0; iy < this.AMOUNTY; iy++) {
        const x = ix * this.SEPARATION;
        const y = iy * this.SEPARATION;
        
        this.particles.push({
          baseX: x,
          baseY: y,
          x: x,
          y: y,
          z: 0,
          ix: ix,
          iy: iy,
          size: 3,
          opacity: 0.6
        });
      }
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate center offset to position grid in center
    const offsetX = (this.canvas.width - (this.AMOUNTX * this.SEPARATION)) / 2;
    const offsetY = (this.canvas.height - (this.AMOUNTY * this.SEPARATION)) / 2;
    
    // Update and draw particles
    this.particles.forEach(particle => {
      // Calculate wave effect
      const waveX = Math.sin((particle.ix + this.count) * 0.3) * this.WAVE_AMPLITUDE;
      const waveY = Math.sin((particle.iy + this.count) * 0.5) * this.WAVE_AMPLITUDE;
      const waveZ = Math.cos((particle.ix + particle.iy + this.count) * 0.4) * 20;
      
      // Update position with wave
      particle.x = particle.baseX + waveX + offsetX;
      particle.y = particle.baseY + waveY + offsetY;
      particle.z = waveZ;
      
      // Calculate size based on z-depth (perspective)
      const scale = 1 + (particle.z / 100);
      particle.size = 3 * scale;
      particle.opacity = 0.4 + (particle.z / 100) * 0.3;
      
      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      
      // Use theme color - violet for accent
      this.ctx.fillStyle = `rgba(139, 92, 246, ${particle.opacity})`;
      this.ctx.fill();
      
      // Draw connections to nearby particles
      this.particles.forEach(other => {
        if (other === particle) return;
        
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only connect nearby particles
        if (distance < this.SEPARATION * 1.5) {
          const connectionOpacity = (1 - distance / (this.SEPARATION * 1.5)) * 0.1;
          
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(139, 92, 246, ${connectionOpacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.stroke();
        }
      });
    });
    
    // Increment animation counter
    this.count += 0.05;
    
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    window.removeEventListener('resize', () => this.resize());
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
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
