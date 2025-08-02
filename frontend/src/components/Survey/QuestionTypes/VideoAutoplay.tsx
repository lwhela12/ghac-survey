import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface VideoAutoplayProps {
  question: Question;
  onComplete: () => void;
}

const VideoAutoplay: React.FC<VideoAutoplayProps> = ({ question, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(error => {
        console.error('Autoplay failed:', error);
        // If autoplay fails, show play button
      });
    }
  }, []);

  const handleVideoEnd = () => {
    // Auto-advance after video ends
    setTimeout(() => onComplete('watched'), 1000);
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
          muted // Muted to allow autoplay
          loop={false} // Prevent looping
        />
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
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const VideoWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  aspect-ratio: 16 / 9;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const SkipButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  transition: color ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
  }
`;

export default VideoAutoplay;