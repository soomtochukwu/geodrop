import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { ShieldCheck, CheckCircle } from 'lucide-react';

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const walletSpring = spring({ frame, fps, delay: 10 });
  const successOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0f', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <GridBackground />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 60 }}>
        {/* Mock Phantom Wallet Confirmation */}
        <div style={{
          width: 400,
          backgroundColor: '#1a1a2e',
          border: '2px solid #6366f1',
          borderRadius: 32,
          padding: 32,
          transform: `scale(${walletSpring})`,
          boxShadow: '0 0 50px rgba(99, 102, 241, 0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 40, height: 40, backgroundColor: '#AB9FF2', borderRadius: 10 }} />
            <span style={{ fontWeight: 'bold', fontSize: 20 }}>Phantom</span>
          </div>

          <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
            Confirm Transaction
          </div>
          <div style={{ fontSize: 16, opacity: 0.6, textAlign: 'center', marginBottom: 40 }}>
            GeoDrop: Claim Bounty
          </div>

          <div style={{ backgroundColor: '#12121a', borderRadius: 16, padding: 20, marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ opacity: 0.6 }}>Network_Fee</span>
              <span style={{ fontFamily: 'JetBrains Mono' }}>MINIMAL</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 18 }}>
              <span>Status</span>
              <span style={{ color: '#14F195', fontFamily: 'JetBrains Mono' }}>VERIFIED</span>
            </div>
          </div>

          {frame < 80 ? (
            <div style={{ 
              backgroundColor: '#6366f1', 
              height: 60, 
              borderRadius: 16, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              fontWeight: 'bold',
              fontSize: 20
            }}>
              Swipe to Confirm
            </div>
          ) : (
            <div style={{ 
              backgroundColor: '#14F195', 
              height: 60, 
              borderRadius: 16, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              fontWeight: 'bold',
              fontSize: 20,
              color: '#000',
              gap: 10
            }}>
              <CheckCircle size={24} /> Success
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 12 }}>
            <span style={{ color: '#6366f1' }}>SMS</span>-powered.
          </div>
          <div style={{ fontSize: 48, fontWeight: 'bold' }}>
            <span style={{ color: '#14F195' }}>MWA</span>-secured.
          </div>
        </div>
      </div>
      
      {/* Security Badge */}
      <div style={{
        position: 'absolute',
        top: 40,
        right: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(20, 241, 149, 0.1)',
        padding: '12px 24px',
        borderRadius: 100,
        border: '1px solid #14F195',
        color: '#14F195',
        fontWeight: 'bold',
      }}>
        <ShieldCheck size={24} /> Verified On-Chain
      </div>
    </AbsoluteFill>
  );
};
