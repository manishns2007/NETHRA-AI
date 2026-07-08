import React, { useRef, useEffect } from 'react';

export default function RippleGrid({
  color = '#3b82f6',
  backgroundColor = '#0a0a0f',
  gridSize = 40,
  rippleSpeed = 0.05,
  rippleSize = 100,
  opacity = 0.5,
  interactive = true,
}) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);
    }

    const draw = () => {
      timeRef.current += rippleSpeed;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const rows = Math.ceil(canvas.height / gridSize);
      const cols = Math.ceil(canvas.width / gridSize);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;

      for (let i = 0; i <= rows; i++) {
        for (let j = 0; j <= cols; j++) {
          const x = j * gridSize;
          const y = i * gridSize;

          // Calculate distance from center for a persistent ambient ripple
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const distToCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          
          // Calculate distance from mouse for interactive ripple
          const distToMouse = Math.sqrt(Math.pow(x - mouseRef.current.x, 2) + Math.pow(y - mouseRef.current.y, 2));

          // Base wave + Interactive wave
          const ambientWave = Math.sin(distToCenter * 0.01 - timeRef.current) * 2;
          let interactiveWave = 0;
          
          if (interactive && distToMouse < rippleSize * 3) {
             interactiveWave = Math.sin(distToMouse * 0.05 - timeRef.current * 2) * 
                              Math.max(0, 1 - distToMouse / (rippleSize * 3)) * 5;
          }

          const offsetZ = ambientWave + interactiveWave;

          // Only draw points/crosses for a tech grid look instead of solid lines
          ctx.globalAlpha = opacity * (1 - Math.min(1, Math.abs(offsetZ) / 10));
          
          ctx.beginPath();
          ctx.arc(x, y + offsetZ, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, backgroundColor, gridSize, rippleSpeed, rippleSize, opacity, interactive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
