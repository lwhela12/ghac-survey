import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface VideoAutoplayProps {
  question: Question;
  onComplete: () => void;
}

const VideoAutoplay: React.FC<VideoAutoplayProps> = ({ question, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPlayButton, setShowPlayButton] = React.useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(error => {
        console.error('Autoplay failed:', error);
        // If autoplay fails, show play button
        setShowPlayButton(true);
      });
    }
  }, []);

  const handleVideoEnd = () => {
    // Auto-advance after video ends
    setTimeout(() => onComplete('watched'), 1000);
  };

  const handlePlayClick = () => {
    const video = videoRef.current;
    if (video) {
      video.play();
      setShowPlayButton(false);
    }
  };

  return (
    <Container>
      <VideoWrapper>
        <Video
          ref={videoRef}
          src={question.videoUrl}
          controls
          onEnded={handleVideoEnd}
          playsInline
          loop={false} // Prevent looping
        />
        {showPlayButton && (
          <PlayButtonOverlay onClick={handlePlayClick}>
            <PlayButton>▶️</PlayButton>
          </PlayButtonOverlay>
        )}
      </VideoWrapper>
      <SkipButton onClick={() => onComplete('skipped')}>
        Skip Video →
      </SkipButton>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

const VideoWrapper = styled.div`
  position: relative;
  width: 280px;
  aspect-ratio: 9 / 16;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  margin-left: 48px; // Align with bot messages
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: 0;
    width: 200px;
  }
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
`;

const SkipButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  margin-left: 48px; // Align with video
  align-self: flex-start;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: 0;
  }
`;

const PlayButtonOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  cursor: pointer;
`;

const PlayButton = styled.div`
  width: 80px;
  height: 80px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: ${({ theme }) => theme.colors.text.inverse};
  transition: transform ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    transform: scale(1.1);
  }
`;

export default VideoAutoplay;