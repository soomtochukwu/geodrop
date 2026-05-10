import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const GridBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 0.1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0f' }}>
      <div
        style={{
          position: 'absolute',
          width: '200%',
          height: '200%',
          top: '-50%',
          left: '-50%',
          backgroundImage: `
            linear-gradient(to right, #6366f1 1px, transparent 1px),
            linear-gradient(to bottom, #6366f1 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          opacity,
          transform: `perspective(1000px) rotateX(60deg) translateY(${(frame * 2) % 80}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 0%, #0a0a0f 80%)',
        }}
      />
    </AbsoluteFill>
  );
};
