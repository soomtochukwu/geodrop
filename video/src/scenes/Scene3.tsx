import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig, Img, staticFile } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { CheckCircle2, Rocket, MousePointer2, ArrowRight } from 'lucide-react';

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const cursorX = interpolate(frame, [0, 40], [width * 0.8, width * 0.4], { extrapolateRight: 'clamp' });
  const cursorY = interpolate(frame, [0, 40], [height * 0.2, height * 0.4], { extrapolateRight: 'clamp' });
  
  const isSelected = frame >= 40;
  const isLaunched = frame >= 120;

  const launchSpring = spring({
    frame: frame - 120,
    fps,
    config: { damping: 10 },
  });

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
        {/* Left Side: Text */}
        <div style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: 64, fontWeight: '900', color: 'white', marginBottom: 20, letterSpacing: -2 }}>
            FUND <span style={{ color: '#6366f1' }}>YOUR WAY</span>
          </h2>
          <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
            Bridge from any chain via <span style={{ color: '#6366f1' }}>LiFi</span> 
            <br />or deploy instantly with <span style={{ color: '#14F195' }}>Native SOL.</span>
          </p>
        </div>

        {/* Right Side: UI Mockup */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 700,
            backgroundColor: '#12121a',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 32,
            padding: 40,
            boxShadow: '0 40px 100px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#6366f1', marginBottom: 24 }}>
               STEP_03 // FUNDING_PATH
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
               {/* Direct SOL Card */}
               <div style={{
                 padding: 24,
                 borderRadius: 20,
                 border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.05)',
                 backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                 transition: 'all 0.3s'
               }}>
                  <div style={{ backgroundColor: isSelected ? '#6366f1' : '#222', width: 32, height: 32, borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                     <CheckCircle2 size={16} color="white" />
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>Direct Solana</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Pay with SOL in wallet</div>
               </div>

               {/* LiFi Card */}
               <div style={{
                 padding: 24,
                 borderRadius: 20,
                 border: '1px solid rgba(255,255,255,0.05)',
                 backgroundColor: 'rgba(255,255,255,0.02)',
                 opacity: 0.5
               }}>
                  <div style={{ backgroundColor: '#222', width: 32, height: 32, borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                     <Rocket size={16} color="white" />
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>Cross Chain</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Bridge from EVM</div>
               </div>
            </div>

            {/* Launch Button */}
            <div style={{
              height: 80,
              borderRadius: 40,
              backgroundColor: isLaunched ? '#14F195' : '#6366f1',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: 20,
              fontWeight: 'black',
              color: isLaunched ? 'black' : 'white',
              letterSpacing: 2,
              transition: 'all 0.5s',
              transform: isLaunched ? `scale(${launchSpring})` : 'none'
            }}>
              {isLaunched ? 'INITIALIZED_SUCCESS' : 'DEPLOY_&_LAUNCH'}
            </div>
          </div>

          {/* Cursor */}
          {!isLaunched && (
            <div style={{
              position: 'absolute',
              left: cursorX,
              top: cursorY,
              zIndex: 100
            }}>
              <MousePointer2 size={40} color="white" fill="white" />
            </div>
          )}
        </div>
      </div>

      {/* Success Modal Overlay */}
      {isLaunched && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(5, 5, 5, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: interpolate(frame, [120, 140], [0, 1]),
          zIndex: 200
        }}>
           <div style={{ 
             width: 120, 
             height: 120, 
             borderRadius: '50%', 
             backgroundColor: 'rgba(20, 241, 149, 0.1)',
             border: '2px solid #14F195',
             display: 'flex',
             justifyContent: 'center',
             alignItems: 'center',
             marginBottom: 40,
             transform: `scale(${launchSpring})`
           }}>
             <CheckCircle2 size={64} color="#14F195" />
           </div>
           <h1 style={{ fontSize: 64, fontWeight: 'black', color: 'white', letterSpacing: -2 }}>DROP_LIVE</h1>
           <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', marginTop: 10 }}>Your bounty is now on the map.</p>
        </div>
      )}
    </AbsoluteFill>
  );
};
