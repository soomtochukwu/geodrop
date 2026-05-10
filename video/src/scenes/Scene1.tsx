import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig, Img, staticFile } from 'remotion';
import { GridBackground } from '../components/GridBackground';

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: {
      damping: 10,
    },
  });

  const pulse = Math.sin(frame / 10) * 0.1 + 1;

  const textOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: 'clamp' });
  const textY = interpolate(frame, [30, 60], [50, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0f', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <GridBackground />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
        <div style={{ transform: `scale(${logoScale * pulse})`, position: 'relative' }}>
          {/* Radar effect */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            height: 400,
            borderRadius: '50%',
            border: '2px solid #6366f1',
            opacity: interpolate(frame % 60, [0, 60], [0.5, 0]),
            transform: `translate(-50%, -50%) scale(${interpolate(frame % 60, [0, 60], [0.5, 2])})`,
          }} />
          
          <Img src={staticFile('geodrop-logo.svg')} style={{ width: 300, height: 300 }} />
        </div>

        <div style={{ 
          opacity: textOpacity, 
          transform: `translateY(${textY}px)`,
          textAlign: 'center',
          color: '#6366f1',
          fontSize: 64,
          fontWeight: 'bold',
          letterSpacing: 4,
          textShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
        }}>
          REAL WORLD_ONBOARDING.
        </div>
        <div style={{ 
          opacity: textOpacity, 
          fontSize: 24, 
          color: 'rgba(255,255,255,0.4)', 
          fontFamily: 'JetBrains Mono',
          letterSpacing: 8
        }}>
          INITIALIZING_PROTOCOL...
        </div>
      </div>
    </AbsoluteFill>
  );
};
