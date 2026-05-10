import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { MapPin, MousePointer2 } from 'lucide-react';

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const cursorX = interpolate(frame, [0, 60], [width * 0.2, width * 0.55], { extrapolateRight: 'clamp' });
  const cursorY = interpolate(frame, [0, 60], [height * 0.8, height * 0.4], { extrapolateRight: 'clamp' });
  const isClicked = frame >= 60;
  
  const pinScale = spring({
    frame: frame - 60,
    fps,
    config: { damping: 10 },
  });

  const circleScale = spring({
    frame: frame - 70,
    fps,
    config: { damping: 12 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0f' }}>
      <GridBackground />
      
      {/* Map Mockup */}
      <div style={{
        position: 'absolute',
        inset: '100px',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#050505'
      }}>
        {/* Animated Map Grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(to right, #111 1px, transparent 1px), linear-gradient(to bottom, #111 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.5,
          transform: `scale(${interpolate(frame, [0, 300], [1, 1.2])})`,
        }} />

        {/* Pin and Radius */}
        {isClicked && (
          <div style={{
            position: 'absolute',
            left: '55%',
            top: '40%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
             <div style={{ 
               width: 300 * circleScale, 
               height: 300 * circleScale, 
               borderRadius: '50%', 
               border: '2px solid #6366f1', 
               backgroundColor: 'rgba(99, 102, 241, 0.1)',
               position: 'absolute'
             }} />
             <div style={{ transform: `scale(${pinScale})`, marginBottom: 40 }}>
                <MapPin size={64} color="#6366f1" fill="#6366f1" />
             </div>
             <div style={{ 
               backgroundColor: '#6366f1', 
               padding: '4px 12px', 
               borderRadius: 8, 
               color: 'white', 
               fontFamily: 'JetBrains Mono',
               fontSize: 14,
               fontWeight: 'bold',
               opacity: interpolate(frame, [80, 100], [0, 1])
             }}>
               TARGET_LOCKED: 37.7749, -122.4194
             </div>
          </div>
        )}
      </div>

      {/* Header UI */}
      <div style={{
        position: 'absolute',
        top: 140,
        left: 140,
        color: '#6366f1',
        fontFamily: 'JetBrains Mono',
        fontSize: 12,
        letterSpacing: 2,
        fontWeight: 'bold'
      }}>
        SPONSOR_PORTAL // DEFINE_TERRITORY
      </div>

      {/* Animated Cursor */}
      <div style={{
        position: 'absolute',
        left: cursorX,
        top: cursorY,
        opacity: frame > 120 ? 0 : 1,
        transition: 'opacity 0.5s'
      }}>
        <MousePointer2 size={32} color="white" fill="white" />
      </div>

      <div style={{
        position: 'absolute',
        bottom: 140,
        right: 140,
        textAlign: 'right'
      }}>
        <h2 style={{ fontSize: 48, fontWeight: '900', color: 'white', marginBottom: 10 }}>
          PIN <span style={{ color: '#6366f1' }}>COORDINATES</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 24, fontWeight: 'bold' }}>
          Select any real-world location.
        </p>
      </div>
    </AbsoluteFill>
  );
};
