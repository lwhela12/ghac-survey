import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface VideoAskQuestionProps {
  question: Question;
  onAnswer: (answer: any) => void;
  disabled?: boolean;
}

const VideoAskQuestion: React.FC<VideoAskQuestionProps> = ({ question, onAnswer, disabled }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasResponded, setHasResponded] = useState(false);

  // Debug what question we're rendering
  console.log('VideoAskQuestion rendering:', {
    questionId: question.id,
    videoAskFormId: question.videoAskFormId,
    content: question.content
  });

  useEffect(() => {
    // Set a timeout to remove loading state if iframe doesn't communicate
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    // Listen for messages from VideoAsk iframe
    const handleMessage = (event: MessageEvent) => {
      // Verify origin is from VideoAsk and from this component's iframe
      if (!event.origin.includes('videoask.com') || (iframeRef.current && event.source !== iframeRef.current.contentWindow)) {
        return;
      }

      console.log(`[VideoAsk ${question.id}] Message received:`, event.data);

      // VideoAsk might send different message formats
      if (event.data.event === 'form_mounted') {
        setIsLoading(false);
        clearTimeout(loadingTimeout);
        
        // Inject CSS to hide buttons initially
        injectButtonHidingCSS();
      }

      // Handle completion events - VideoAsk sends different message types
      if (event.data.type === 'videoask_submitted' || 
          event.data.event === 'response_received' || 
          event.data.type === 'response') {
        
        if (hasResponded) return; // Prevent multiple submissions

        console.log(`[VideoAsk ${question.id}] Response received, advancing survey`);
        setHasResponded(true);
        
        // Extract data from VideoAsk message
        const answerData = {
          type: event.data.mediaType || event.data.response_type || 'video',
          responseId: event.data.questionId || event.data.response_id || null,
          contactId: event.data.contactId || null,
          responseUrl: event.data.response_url || event.data.responseUrl || null,
          transcript: event.data.transcript || null
        };
        console.log(`[VideoAsk ${question.id}] Calling onAnswer with:`, answerData);
        onAnswer(answerData);
      }

      // Handle skip/close
      if (event.data.event === 'form_closed' || event.data.type === 'close') {
        if (!hasResponded) {
          onAnswer({ type: 'skipped' });
        }
      }
    };

    // Inject CSS to control VideoAsk button visibility
    const injectButtonHidingCSS = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      try {
        // Try to access iframe content (will only work if same-origin)
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const style = iframeDoc.createElement('style');
          style.innerHTML = `
            /* Hide response option buttons initially */
            [class*="AnswerButton"], 
            [class*="answer-button"],
            [class*="response-option"],
            [class*="ResponseOption"],
            button[aria-label*="Record"],
            button[aria-label*="Type"],
            .response-buttons,
            .answer-options {
              opacity: 0 !important;
              visibility: hidden !important;
              transition: opacity 0.5s ease-in, visibility 0.5s ease-in !important;
            }
            
            /* Show buttons after video ends (adjust timing based on your video length) */
            @keyframes showButtons {
              to {
                opacity: 1 !important;
                visibility: visible !important;
              }
            }
            
            [class*="AnswerButton"],
            [class*="answer-button"],
            [class*="response-option"],
            [class*="ResponseOption"],
            button[aria-label*="Record"],
            button[aria-label*="Type"],
            .response-buttons,
            .answer-options {
              animation: showButtons 0.5s ease-in ${question.videoDelay || 20}s forwards !important;
            }
          `;
          iframeDoc.head.appendChild(style);
        }
      } catch (e) {
        console.log('Cannot access iframe content, trying postMessage approach');
        
        // Alternative: Send custom CSS via postMessage if VideoAsk supports it
        iframe.contentWindow?.postMessage({
          type: 'custom-css',
          css: `/* CSS to hide buttons initially */`
        }, '*');
      }
    };

    // Handle iframe load event as fallback
    const handleIframeLoad = () => {
      setTimeout(() => {
        setIsLoading(false);
        // Try to inject CSS after iframe loads
        injectButtonHidingCSS();
      }, 1000);
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
    }

    window.addEventListener('message', handleMessage);
    
    return () => {
      clearTimeout(loadingTimeout);
      window.removeEventListener('message', handleMessage);
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
      }
    };
  }, [question.id, question.videoDelay, onAnswer, hasResponded]);

  const handleSkip = () => {
    console.log('Skip button clicked for VideoAsk');
    onAnswer({ type: 'skipped' });
  };

  return (
    <Container>
      {isLoading && (
        <LoadingOverlay>
          <LoadingSpinner />
          <LoadingText>Loading video question...</LoadingText>
        </LoadingOverlay>
      )}
      
      <VideoAskWrapper $isLoading={isLoading}>
        <StyledIframe
          ref={iframeRef}
          src={`https://www.videoask.com/${question.videoAskFormId}?autoplay=1&delay_response=1`}
          allow="camera *; microphone *; autoplay *; encrypted-media *; fullscreen *; display-capture *;"
          title="Video question from Amanda"
        />
      </VideoAskWrapper>

      <ButtonContainer>
        <SkipButton onClick={handleSkip} disabled={disabled || hasResponded}>
          {hasResponded ? 'Response recorded' : 'Skip this question'}
        </SkipButton>
      </ButtonContainer>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  position: relative;
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
  background: ${({ theme }) => theme.colors.surface};
  z-index: 10;
  min-height: 400px;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  margin-top: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const VideoAskWrapper = styled.div<{ $isLoading: boolean }>`
  max-width: 420px;
  margin: 0 auto;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  overflow: hidden;
  opacity: ${({ $isLoading }) => ($isLoading ? 0 : 1)};
  transition: opacity 0.3s ease-in-out;
  aspect-ratio: 2/3;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-width: 90%;
  }
`;

const StyledIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const SkipButton = styled.button`
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.background};
    border-color: ${({ theme }) => theme.colors.text.secondary};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default VideoAskQuestion;