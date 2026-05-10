import React from 'react';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { AbsoluteFill } from 'remotion';
import { fade } from '@remotion/transitions/fade';
import { Scene1 } from './scenes/Scene1';
import { Scene2 } from './scenes/Scene2';
import { Scene3 } from './scenes/Scene3';
import { Scene4 } from './scenes/Scene4';
import { Scene5 } from './scenes/Scene5';
import { Scene6 } from './scenes/Scene6';

import { AudioStack } from './components/AudioStack';
import { Captions } from './components/Captions';

export const Main: React.FC = () => {
  return (
    <>
      <AudioStack />
      <Captions />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene1 />
        </TransitionSeries.Sequence>
        
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />
        
        <TransitionSeries.Sequence durationInFrames={300}>
          <Scene2 />
        </TransitionSeries.Sequence>
        
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />
        
        <TransitionSeries.Sequence durationInFrames={480}>
          <Scene3 />
        </TransitionSeries.Sequence>
        
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />
        
        <TransitionSeries.Sequence durationInFrames={480}>
          <Scene4 />
        </TransitionSeries.Sequence>
        
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />
        
        <TransitionSeries.Sequence durationInFrames={240}>
          <Scene5 />
        </TransitionSeries.Sequence>
        
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />
        
        <TransitionSeries.Sequence durationInFrames={240}>
          <Scene6 />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
