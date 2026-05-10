import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

const CAPTIONS = [
  { start: 0, end: 210, text: "GeoDrop: The new standard for real-world crypto onboarding." },
  { start: 240, end: 540, text: "Sponsors define territory by picking coordinates on an interactive map." },
  { start: 570, end: 1050, text: "Fund your way: Bridge from any chain via LiFi or pay instantly with Native SOL." },
  { start: 1080, end: 1560, text: "Hunters discover active bounties through immersive live radar tracking." },
  { start: 1590, end: 1830, text: "Claim rewards instantly using Solana's Mobile Wallet Adapter." },
  { start: 1860, end: 2100, text: "Join the hunt at original-geodrop.vercel.app" },
];

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  
  const currentCaption = CAPTIONS.find(c => frame >= c.start && frame < c.end);

  if (!currentCaption) return null;

  const opacity = interpolate(
    frame,
    [currentCaption.start, currentCaption.start + 15, currentCaption.end - 15, currentCaption.end],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ 
      pointerEvents: 'none',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 80
    }}>
      <div style={{
        opacity,
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        padding: '16px 32px',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        maxWidth: '80%',
        textAlign: 'center'
      }}>
        <p style={{
          color: 'white',
          fontSize: 32,
          fontWeight: 'bold',
          margin: 0,
          fontFamily: 'Inter',
          letterSpacing: -0.5
        }}>
          {currentCaption.text}
        </p>
      </div>
    </AbsoluteFill>
  );
};
