import React from 'react';
import { Audio, Sequence, useVideoConfig, staticFile } from 'remotion';

export const AudioStack: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <>
      {/* Background Music - loops/covers the whole duration */}
      <Audio 
        src={staticFile('audio/background.mp3')} 
        volume={0.2} 
        placeholder=""
      />

      {/* Scene 1 Start: Transition In */}
      <Sequence from={0} durationInFrames={fps}>
        <Audio src={staticFile('audio/whoosh.mp3')} volume={0.4} />
      </Sequence>

      {/* Scene 2 Transition */}
      <Sequence from={210} durationInFrames={fps}>
        <Audio src={staticFile('audio/whip.mp3')} volume={0.3} />
      </Sequence>

      {/* Scene 3 Transition (Sponsor UI) */}
      <Sequence from={540} durationInFrames={fps}>
        <Audio src={staticFile('audio/whoosh.mp3')} volume={0.4} />
      </Sequence>
      
      {/* Ding when the bridge is ready in Scene 3 */}
      <Sequence from={600} durationInFrames={fps}>
        <Audio src={staticFile('audio/ding.mp3')} volume={0.6} />
      </Sequence>

      {/* Scene 4 Transition (Hunter UI) */}
      <Sequence from={1050} durationInFrames={fps}>
        <Audio src={staticFile('audio/whip.mp3')} volume={0.3} />
      </Sequence>

      {/* Scene 5 Transition (The Claim) */}
      <Sequence from={1560} durationInFrames={fps}>
        <Audio src={staticFile('audio/whoosh.mp3')} volume={0.4} />
      </Sequence>
      
      {/* Success Ding in Scene 5 */}
      <Sequence from={1700} durationInFrames={fps}>
        <Audio src={staticFile('audio/success.mp3')} volume={0.7} />
      </Sequence>

      {/* Scene 6 Transition (CTA) */}
      {/* Adjusted to be within the 1800 frame limit if necessary, but Main.tsx shows more scenes */}
      <Sequence from={1780} durationInFrames={fps}>
        <Audio src={staticFile('audio/whip.mp3')} volume={0.5} />
      </Sequence>
    </>
  );
};
