import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface VideoRecorderProps {
  onRecordingComplete: (videoUrl: string) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
  question: string;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ 
  onRecordingComplete, 
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Set loading to false once iframe loads
    if (iframeRef.current) {
      iframeRef.current.onload = () => {
        setIsLoading(false);
      };
    }
  }, []);

  const handleComplete = () => {
    // When user clicks continue, record the response
    onRecordingComplete(`videoask-response-${Date.now()}`);
  };

  return (
    <Container>
      {isLoading && (
        <LoadingOverlay>
          <LoadingSpinner />
          <LoadingText>Loading video recorder...</LoadingText>
        </LoadingOverlay>
      )}
      
      <VideoAskFrame>
        <iframe
          ref={iframeRef}
          src={import.meta.env.VITE_VIDEOASK_FORM_URL || 'https://www.videoask.com/fx3xt4u0q'}
          allow="camera *; microphone *; autoplay *; encrypted-media *; fullscreen *; display-capture *;"
          width="100%"
          height="600px"
          style={{ border: 'none', borderRadius: '24px' }}
          title="Record your video response"
        />
      </VideoAskFrame>
      
      <ButtonGroup>
        <SecondaryButton onClick={onCancel}>
          ← Back to Options
        </SecondaryButton>
        <PrimaryButton onClick={handleComplete}>
          Continue →
        </PrimaryButton>
      </ButtonGroup>
      
      <InfoText>
        💡 After recording your response, click &quot;Continue&quot; to proceed
      </InfoText>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const VideoAskFrame = styled.div`
  width: 100%;
  min-height: 600px;
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  background: #f9f9f9;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  z-index: 10;
  min-height: 600px;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top-color: #4A90E2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: 'Nunito', sans-serif;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
`;

const PrimaryButton = styled.button`
  background: #4A90E2;
  color: white;
  border: none;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-family: 'Nunito', sans-serif;
  
  &:hover {
    background: #357ABD;
    transform: translateY(-2px);
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: #4A90E2;
  border: 2px solid #4A90E2;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.base};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-family: 'Nunito', sans-serif;
  
  &:hover {
    background: #4A90E2;
    color: white;
  }
`;

const InfoText = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: 'Nunito', sans-serif;
`;

export default VideoRecorder;