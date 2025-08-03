import { useEffect, useState } from 'react';

interface ConfettiBurstProps {
  trigger: boolean;
  onComplete?: () => void;
}

export default function ConfettiBurst({ trigger, onComplete }: ConfettiBurstProps) {
  const [particles, setParticles] = useState<Array<{ id: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (trigger) {
      // Generate confetti particles
      const colors = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#f59e0b', '#f97316', '#ef4444'];
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.2
      }));
      
      setParticles(newParticles);

      // Clear particles after animation
      const timeout = setTimeout(() => {
        setParticles([]);
        if (onComplete) onComplete();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [trigger, onComplete]);

  if (particles.length === 0) return null;

  return (
    <>
      <style>{`
        .confetti-container {
          position: fixed;
          pointer-events: none;
          inset: 0;
          z-index: 9999;
          overflow: hidden;
        }
        
        .confetti-particle {
          position: absolute;
          width: 10px;
          height: 10px;
          transform-origin: center;
          animation: confetti-burst 2s ease-out forwards;
        }
        
        @keyframes confetti-burst {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
            opacity: 1;
          }
          
          10% {
            transform: translate(-50%, -50%) rotate(45deg) scale(1.2);
          }
          
          100% {
            transform: 
              translate(
                calc(-50% + var(--random-x, 0) * 300px), 
                calc(-50% + var(--random-y, 0) * 300px)
              ) 
              rotate(720deg) 
              scale(0);
            opacity: 0;
          }
        }
        
        .confetti-particle:nth-child(1) { --random-x: -0.8; --random-y: -0.6; }
        .confetti-particle:nth-child(2) { --random-x: 0.9; --random-y: -0.7; }
        .confetti-particle:nth-child(3) { --random-x: -0.3; --random-y: 0.8; }
        .confetti-particle:nth-child(4) { --random-x: 0.6; --random-y: 0.4; }
        .confetti-particle:nth-child(5) { --random-x: -0.7; --random-y: 0.2; }
        .confetti-particle:nth-child(6) { --random-x: 0.4; --random-y: -0.9; }
        .confetti-particle:nth-child(7) { --random-x: -0.2; --random-y: -0.5; }
        .confetti-particle:nth-child(8) { --random-x: 0.8; --random-y: 0.3; }
        .confetti-particle:nth-child(9) { --random-x: -0.5; --random-y: 0.7; }
        .confetti-particle:nth-child(10) { --random-x: 0.3; --random-y: -0.4; }
        .confetti-particle:nth-child(3n) { border-radius: 50%; }
        .confetti-particle:nth-child(3n+1) { border-radius: 0; }
        .confetti-particle:nth-child(3n+2) { border-radius: 2px; transform: rotate(45deg); }
      `}</style>
      <div className="confetti-container">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="confetti-particle"
            style={{
              backgroundColor: particle.color,
              animationDelay: `${particle.delay}s`,
              left: '50%',
              top: '50%'
            }}
          />
        ))}
      </div>
    </>
  );
}