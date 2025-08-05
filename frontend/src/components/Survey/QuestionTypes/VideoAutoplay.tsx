import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface VideoAutoplayProps {
  question: Question;
  onComplete: (answer: string) => void;
  disabled?: boolean;
}

const VideoAutoplay: React.FC<VideoAutoplayProps> = ({ question, onComplete, disabled = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const hasCompleted = useRef(false);

  const handleCompletion = (status: 'watched' | 'skipped') => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    
    // For persistVideo, we need to handle completion differently
    if (question.persistVideo) {
      // Just submit the answer without auto-advancing
      onComplete(status);
    } else {
      // Auto-advance after a delay
      setTimeout(() => onComplete(status), 1000);
    }
  };

  useEffect(() => {
    if (question.videoAskId) {
      // For justvideo embeds (like the intro), we'll use a timer based on the video duration
      // since they don't send reliable completion events
      const videoDuration = question.duration ? 
        parseInt(question.duration.match(/\d+/)?.[0] || '60') * 1000 : 
        60000; // Default to 60 seconds if no duration specified
      
      // Add a small buffer for loading time
      const completionTime = videoDuration + 2000;
      
      console.log(`Setting up VideoAsk intro timer for ${completionTime}ms`);
      
      const completionTimer = setTimeout(() => {
        console.log('VideoAsk intro timer completed');
        handleCompletion('watched');
      }, completionTime);

      // Still listen for messages in case VideoAsk sends completion events
      const handleMessage = (event: MessageEvent) => {
        if (!event.origin.includes('videoask.com') || hasCompleted.current) return;
        
        // Log events for debugging
        console.log('VideoAsk event:', event.data.type || event.data.event);
        
        // Check for any completion-like events
        if (event.data.type === 'video_complete' ||
            event.data.type === 'videoask_completed' ||
            event.data.event === 'ended') {
          console.log('Video completed via event');
          clearTimeout(completionTimer);
          handleCompletion('watched');
        }
      };

      window.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('message', handleMessage);
        clearTimeout(completionTimer);
      };
    } else {
      const video = videoRef.current;
      if (video) {
        video.play().catch(() => {
          setShowPlayButton(true);
        });
      }
    }
  }, [question.videoAskId, onComplete]);

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
        {question.videoAskId ? (
          <VideoAskIframe
            ref={iframeRef}
            src={`https://www.videoask.com/${question.videoAskId}?justvideo=1&autoplay=1&muted=0`}
            allow="camera *; microphone *; autoplay *; encrypted-media *; fullscreen *; display-capture *;"
            title="Welcome video from Amanda"
          />
        ) : (
          <>
            <Video
              ref={videoRef}
              src={question.videoUrl}
              controls
              onEnded={() => handleCompletion('watched')}
              playsInline
              loop={false}
            />
            {showPlayButton && (
              <PlayButtonOverlay onClick={handlePlayClick}>
                <PlayButton>▶️</PlayButton>
              </PlayButtonOverlay>
            )}
          </>
        )}
      </VideoWrapper>
      {!disabled && (
        <SkipButton onClick={() => handleCompletion('skipped')}>
          Skip Video →
        </SkipButton>
      )}
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

const VideoAskIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;

export default VideoAutoplay;