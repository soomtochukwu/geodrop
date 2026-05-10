import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { Wallet, ArrowRight, Zap } from 'lucide-react';

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const widgetSpring = spring({ frame, fps, delay: 10 });
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
        justifyContent: 'space-between',
      }}>
        {/* Mock LiFi Widget */}
        <div style={{
          width: 500,
          backgroundColor: '#12121a',
          border: '1px solid #6366f1',
          borderRadius: 24,
          padding: 32,
          transform: `scale(${widgetSpring})`,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
             Deposit Funds
          </div>
          
          <div style={{ backgroundColor: '#1e1e2d', borderRadius: 16, padding: 20, marginBottom: 12, border: '1px solid #2a2a3d' }}>
            <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 8 }}>From (EVM)</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, backgroundColor: '#3e7cf1', borderRadius: '50%' }} />
                <span style={{ fontWeight: 'bold' }}>Base / Ethereum</span>
              </div>
              <div style={{ fontWeight: 'bold', fontFamily: 'JetBrains Mono' }}>LI.FI_BRIDGE</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '-10px 0', position: 'relative', zIndex: 1 }}>
            <div style={{ backgroundColor: '#6366f1', borderRadius: '50%', padding: 8 }}>
              <ArrowRight size={20} style={{ transform: 'rotate(90deg)' }} />
            </div>
          </div>

          <div style={{ backgroundColor: '#1e1e2d', borderRadius: 16, padding: 20, marginTop: -2, border: '1px solid #6366f1' }}>
            <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 8 }}>To (Solana)</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, backgroundColor: '#9945FF', borderRadius: '50%' }} />
                <span style={{ fontWeight: 'bold' }}>SOLANA_PDA</span>
              </div>
              <div style={{ fontWeight: 'bold', fontFamily: 'JetBrains Mono', color: '#14F195' }}>INITIALIZING...</div>
            </div>
          </div>

          <div style={{ 
            marginTop: 24, 
            backgroundColor: '#6366f1', 
            height: 60, 
            borderRadius: 16, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            fontSize: 20,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            Confirm_Drop
          </div>
        </div>

        {/* Text Side */}
        <div style={{ opacity: textOpacity, maxWidth: 600 }}>
          <h2 style={{ fontSize: 64, fontWeight: 'bold', marginBottom: 24, letterSpacing: -2 }}>
            Fund from <span style={{ color: '#6366f1' }}>Any Chain.</span>
          </h2>
          <p style={{ fontSize: 32, opacity: 0.8, lineHeight: 1.4, fontFamily: 'Inter' }}>
            Sponsors bridge assets via <span style={{ color: '#6366f1' }}>LiFi</span> to automate reward distribution.
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
