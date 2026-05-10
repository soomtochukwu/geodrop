import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { GridBackground } from '../components/GridBackground';

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const text1Opacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' });
  const text2Opacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });

  // Mock map dots
  const dots = Array.from({ length: 20 }).map((_, i) => ({
    x: Math.sin(i * 123) * width * 0.4 + width / 2,
    y: Math.cos(i * 456) * height * 0.4 + height / 2,
    size: Math.abs(Math.sin(i)) * 10 + 5,
  }));

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0f' }}>
      <GridBackground />
      
      {/* Map visualization */}
      {dots.map((dot, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            backgroundColor: '#6366f1',
            borderRadius: '50%',
            opacity: interpolate(frame, [0, 30], [0, 0.4]) * (Math.sin(frame / 10 + i) * 0.5 + 0.5),
            boxShadow: '0 0 10px #6366f1',
          }}
        />
      ))}

      {/* Coordinate lines */}
      <div style={{
        position: 'absolute',
        left: '10%',
        bottom: '10%',
        color: '#6366f1',
        fontSize: 20,
        opacity: 0.5,
        fontFamily: 'JetBrains Mono',
      }}>
        {`LAT: ${interpolate(frame, [0, 300], [34.0522, 34.0622]).toFixed(4)}`}
        <br />
        {`LNG: ${interpolate(frame, [0, 300], [-118.2437, -118.2537]).toFixed(4)}`}
      </div>

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
      }}>
        <div style={{ opacity: text1Opacity, fontSize: 48, fontWeight: '900', color: 'white', letterSpacing: -1 }}>
          CONNECTING <span style={{ color: '#6366f1' }}>PHYSICAL SPACE</span>
        </div>
        <div style={{ opacity: text2Opacity, fontSize: 48, fontWeight: '900', color: 'white', letterSpacing: -1 }}>
          TO <span style={{ color: '#14F195' }}>ON-CHAIN REWARDS</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
