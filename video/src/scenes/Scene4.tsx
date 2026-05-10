import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { MapPin, Navigation } from 'lucide-react';

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSpring = spring({ frame, fps, delay: 10 });
  const textOpacity = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0f' }}>
      <GridBackground />
      
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        padding: '0 100px',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}>
        {/* Text Side */}
        <div style={{ opacity: textOpacity, maxWidth: 600 }}>
          <h2 style={{ fontSize: 64, fontWeight: 'bold', marginBottom: 24 }}>
            Discovery is <span style={{ color: '#6366f1' }}>physical.</span>
          </h2>
          <p style={{ fontSize: 32, opacity: 0.8, lineHeight: 1.4 }}>
            Real-world bounties. <br />
            Rewards are <span style={{ color: '#14F195' }}>instant.</span>
          </p>
        </div>

        {/* Mock Mobile Phone */}
        <div style={{
          width: 380,
          height: 750,
          backgroundColor: '#12121a',
          border: '8px solid #2a2a3d',
          borderRadius: 48,
          overflow: 'hidden',
          position: 'relative',
          transform: `scale(${phoneSpring}) rotate(${interpolate(frame, [0, 300], [0, 5])}deg)`,
          boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
        }}>
          {/* Map Content */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at center, transparent 0%, rgba(10,10,15,0.8) 100%),
              linear-gradient(to right, #1a1a2e 1px, transparent 1px),
              linear-gradient(to bottom, #1a1a2e 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          }} />

          {/* User Location */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}>
            <div style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              border: '2px solid #6366f1',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Navigation size={32} color="#6366f1" fill="#6366f1" />
            </div>
          </div>

          {/* Bounty Pin */}
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '60%',
            transform: `translateY(${Math.sin(frame / 15) * 10}px)`,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                backgroundColor: '#6366f1', 
                color: '#fff', 
                padding: '4px 12px', 
                borderRadius: 20, 
                fontSize: 10, 
                fontWeight: 'bold',
                fontFamily: 'JetBrains Mono',
                marginBottom: 4,
                boxShadow: '0 5px 15px rgba(99, 102, 241, 0.4)'
              }}>
                TARGET_LOCKED
              </div>
              <MapPin size={40} color="#6366f1" fill="#6366f1" />
            </div>
          </div>

          {/* Bottom Card */}
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: '#1e1e2d',
            borderRadius: 24,
            padding: 24,
            border: '1px solid #6366f1',
          }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: 'white' }}>GeoDrop Bounty</div>
            <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 16, color: 'white', fontFamily: 'JetBrains Mono' }}>DISTANCE: 12.5M</div>
            <div style={{ 
              backgroundColor: '#6366f1', 
              height: 48, 
              borderRadius: 12, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              fontWeight: 'bold',
              color: 'white'
            }}>
              CLAIM_REWARD
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
