'use client';

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
}

export function AudioVisualizer({ isListening, isSpeaking }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to be responsive
    const setCanvasSize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 80;
      }
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

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
      
      const centerY = height / 2;
      const barCount = 40; // Fixed number of bars for a more consistent look
      const barGap = width / barCount;
      
      // Colors based on state
      let gradient;
      if (isListening) {
        gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(66, 153, 225, 0.5)');  // blue-500 with 0.5 opacity
        gradient.addColorStop(0.5, 'rgba(49, 130, 206, 0.7)'); // blue-600 with 0.7 opacity
        gradient.addColorStop(1, 'rgba(66, 153, 225, 0.5)');  // blue-500 with 0.5 opacity
      } else if (isSpeaking) {
        gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(72, 187, 120, 0.5)');  // green-500 with 0.5 opacity
        gradient.addColorStop(0.5, 'rgba(56, 161, 105, 0.7)'); // green-600 with 0.7 opacity
        gradient.addColorStop(1, 'rgba(72, 187, 120, 0.5)');  // green-500 with 0.5 opacity
      } else {
        gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(160, 174, 192, 0.3)');  // gray-400 with 0.3 opacity
        gradient.addColorStop(1, 'rgba(160, 174, 192, 0.3)');  // gray-400 with 0.3 opacity
      }
      
      ctx.fillStyle = gradient;
      
      // Draw bars
      for (let i = 0; i < barCount; i++) {
        const x = i * barGap;
        const time = Date.now() * 0.001;
        
        // Advanced animation using sine waves with phase shifts
        const phase = i / barCount * Math.PI * 2;
        let amplitude = 0;
        
        if (isListening || isSpeaking) {
          // Create a more complex wave pattern for active states
          amplitude = Math.sin(time * 3 + phase) * 0.3 + 
                      Math.sin(time * 5 + phase * 2) * 0.2 + 
                      Math.sin(time * 7 + phase * 3) * 0.1;
          // Scale it
          amplitude = Math.abs(amplitude) * 0.8 + 0.2;
        } else {
          // Idle state has minimal movement
          amplitude = Math.sin(time + phase) * 0.05 + 0.1;
        }
        
        const barHeight = amplitude * height * 0.8;
        
        // Smooth transition from bottom to top with a curved shape
        ctx.beginPath();
        ctx.moveTo(x, centerY + barHeight / 2);
        ctx.lineTo(x + barGap * 0.5, centerY); // Create a triangular shape
        ctx.lineTo(x + barGap, centerY + barHeight / 2);
        ctx.moveTo(x, centerY - barHeight / 2);
        ctx.lineTo(x + barGap * 0.5, centerY); // Mirror for top half
        ctx.lineTo(x + barGap, centerY - barHeight / 2);
        ctx.fill();
        
        // Add reflection effect
        const reflectionGradient = ctx.createLinearGradient(0, centerY, 0, height);
        reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = reflectionGradient;
        ctx.fillRect(x, centerY, barGap, barHeight / 3);
        
        // Reset fill style for next bar
        ctx.fillStyle = gradient;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };

    // Start the animation
    draw();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, isSpeaking]);

  return (
    <div className="flex justify-center">
      <div className="relative w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shadow-inner p-4">
        <canvas 
          ref={canvasRef} 
          className="w-full h-20"
        />
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center pointer-events-none">
          <div className={`flex items-center justify-center px-4 py-1 rounded-full backdrop-blur-sm bg-opacity-70 ${
            isListening 
              ? 'bg-blue-100 text-blue-800' 
              : isSpeaking 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-500'
          }`}>
            <span className={`text-sm font-medium ${isListening || isSpeaking ? 'animate-pulse' : ''}`}>
              {isListening 
                ? 'Listening...' 
                : isSpeaking 
                  ? 'Speaking...' 
                  : 'Ready'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 