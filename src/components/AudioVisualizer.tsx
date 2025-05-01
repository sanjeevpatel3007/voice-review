'use client';

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
}

export function AudioVisualizer({ isListening, isSpeaking }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Function to clear the canvas
    const clearCanvas = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Function to draw a visualization
    const draw = () => {
      if (!ctx || !canvas) return;
      
      clearCanvas();
      const width = canvas.width;
      const height = canvas.height;
      
      const barWidth = 4;
      const barGap = 2;
      const barCount = Math.floor(width / (barWidth + barGap));
      
      const color = isListening ? '#4299e1' : '#48bb78'; // Blue for listening, green for speaking
      
      ctx.fillStyle = color;
      
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + barGap);
        
        // Generate random height based on whether we're listening or speaking
        const randomFactor = Math.sin(Date.now() * 0.003 + i * 0.2) * 0.5 + 0.5;
        const multiplier = isListening || isSpeaking ? 0.8 : 0.1;
        const barHeight = randomFactor * height * multiplier;
        
        ctx.fillRect(x, (height - barHeight) / 2, barWidth, barHeight);
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };

    // Start the animation if either listening or speaking
    if (isListening || isSpeaking) {
      draw();
    } else {
      clearCanvas();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, isSpeaking]);

  return (
    <div className="flex justify-center">
      <div className="relative w-full">
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={60} 
          className="w-full h-16 rounded-md"
        />
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-gray-500">
            {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : ''}
          </span>
        </div>
      </div>
    </div>
  );
} 