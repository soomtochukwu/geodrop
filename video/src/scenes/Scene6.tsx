import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig, Img, staticFile } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { QrCode, Globe } from 'lucide-react';

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 10 } });
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0f', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <GridBackground />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 60 }}>
        <div style={{ transform: `scale(${logoScale})` }}>
          <Img src={staticFile('geodrop-logo.svg')} style={{ width: 250, height: 250 }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 96, fontWeight: 'bold', marginBottom: 20, letterSpacing: 8 }}>
            JOIN THE <span style={{ color: '#6366f1' }}>HUNT.</span>
          </h1>
          <div style={{ fontSize: 32, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <Globe size={32} /> original-geodrop.vercel.app
          </div>
        </div>

        <div style={{ display: 'flex', gap: 80, alignItems: 'center' }}>
           {/* Mock QR Code */}
           <div style={{ 
             width: 200, 
             height: 200, 
             backgroundColor: 'white', 
             padding: 10, 
             borderRadius: 16,
             display: 'flex',
             justifyContent: 'center',
             alignItems: 'center'
           }}>
             <QrCode size={180} color="#0a0a0f" />
           </div>

           <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 32, fontWeight: 'bold' }}>
               <span style={{ color: '#6366f1' }}>@</span>GeoDropApp
             </div>
             <div style={{ 
               padding: '12px 24px', 
               border: '1px solid #6366f1', 
               borderRadius: 12, 
               color: '#6366f1', 
               fontWeight: 'bold',
               textAlign: 'center',
               fontSize: 18
             }}>
               COMING TO MAINNET
             </div>
           </div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 40,
        fontSize: 16,
        opacity: 0.4,
        letterSpacing: 2
      }}>
        BUILT ON SOLANA | POWERED BY LIFI
      </div>
    </AbsoluteFill>
  );
};
