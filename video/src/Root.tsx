import { Composition } from 'remotion';
import { Main } from './Main';
import './style.css';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={2100}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
