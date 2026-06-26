import React, { useEffect, useRef } from 'react';

export default function DataFlowBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles = [];
    const particleCount = Math.floor(width / 3); // High density for the Dribbble-like look
    
    class Particle {
      constructor() {
        this.reset();
      }
      
      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        // Move much slower, and randomly choose left or right direction
        const direction = Math.random() > 0.5 ? 1 : -1;
        this.speedX = direction * (0.2 + Math.random() * 0.8);
        this.size = Math.random() < 0.1 ? (1.5 + Math.random() * 1.5) : (0.5 + Math.random() * 1);
        
        // Polished tech colors: deep blue, cyan, light blue
        const colorType = Math.random();
        let r, g, b;
        if (colorType > 0.8) {
          // Bright Cyan
          r = 0; g = 255; b = 255;
        } else if (colorType > 0.4) {
          // Soft Blue
          r = 50; g = 150; b = 255;
        } else {
          // Deep Blue / Purple-ish
          r = 30; g = 60; b = 200;
        }
        
        this.opacity = 0.1 + Math.random() * 0.7;
        this.color = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
        this.glow = `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.5})`;
        this.length = 5 + Math.random() * 30; // Streak length
      }
      
      update() {
        this.x += this.speedX;
        
        // Wrap around horizontally based on direction
        if (this.speedX > 0 && this.x > width + 50) {
          this.x = -50;
          this.y = Math.random() * height;
        } else if (this.speedX < 0 && this.x < -50) {
          this.x = width + 50;
          this.y = Math.random() * height;
        }
      }
      
      draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        
        // Add subtle glow to larger nodes
        if (this.size > 1.5) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = this.glow;
        } else {
          ctx.shadowBlur = 0;
        }
        
        // Draw the dot
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
        
        // Draw the streak trailing behind, extending in the opposite direction of movement
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        const tailX = this.speedX > 0 ? this.x - this.length : this.x + this.length;
        ctx.lineTo(tailX, this.y);
        
        // Gradient for the trail to fade out smoothly
        const grad = ctx.createLinearGradient(this.x, this.y, tailX, this.y);
        grad.addColorStop(0, this.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.size * 0.5;
        ctx.stroke();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationFrameId;

    const render = () => {
      // Clear completely instead of relying purely on opacity for trails
      // We draw our own trail streaks natively now for cleaner looks
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-8 * Math.PI / 180); // Slight professional tilt
      ctx.translate(-width / 2, -height / 2);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw', height: '100vh',
        zIndex: 0, pointerEvents: 'none',
        opacity: 0.8
      }} 
    />
  );
}
