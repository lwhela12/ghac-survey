// frontend/src/components/Survey/ChatInterface.tsx
import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  startSurvey, 
  submitAnswer,
  addBotMessage, 
  addUserMessage,
  setTyping,
  resetSurvey 
} from '../../store/slices/surveySlice';
import ChatMessage from './ChatMessage';
import QuestionRenderer from './QuestionRenderer';
import TypingIndicator from './TypingIndicator';

// Define animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const ChatInterface: React.FC = () => {
  const dispatch = useAppDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const controlsDelayRef = useRef<number | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const { messages, currentQuestion, isTyping, isLoading, sessionId } = useAppSelector(
    (state) => state.survey
  );

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;

  const scrollToBottom = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const margin = isMobile() ? 140 : 0;
    const target = Math.max(0, el.scrollHeight - el.clientHeight - margin);
    el.scrollTo({ top: target, behavior: 'smooth' });
  };

  const updateScrollHint = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const bottomGap = el.scrollHeight - (el.scrollTop + el.clientHeight);
    const threshold = 48;
    const shouldShow = isMobile() && bottomGap > threshold && !isTyping && !!currentQuestion;
    setShowScrollHint(shouldShow);
  };

  useEffect(() => {
    const delay = messages.length > 0 ? 200 : 100;
    const t = window.setTimeout(() => {
      scrollToBottom();
      updateScrollHint();
    }, delay);
    return () => window.clearTimeout(t);
  }, [messages, isTyping, currentQuestion]);

  // Delay showing interactive controls to create a conversational stagger
  useEffect(() => {
    const nonRenderableTypes = new Set([
      'dynamic-message',
      'final-message',
      'videoask',
      'video-autoplay',
    ] as const);

    const shouldDelay = !!currentQuestion && !isLoading && !isTyping &&
      !(nonRenderableTypes as any).has(currentQuestion.type as any);

    if (controlsDelayRef.current) {
      window.clearTimeout(controlsDelayRef.current);
      controlsDelayRef.current = null;
    }

    if (shouldDelay) {
      setControlsVisible(false);
      controlsDelayRef.current = window.setTimeout(() => {
        setControlsVisible(true);
        updateScrollHint();
      }, 400) as unknown as number;
    } else {
      setControlsVisible(true);
      updateScrollHint();
    }

    return () => {
      if (controlsDelayRef.current) {
        window.clearTimeout(controlsDelayRef.current);
        controlsDelayRef.current = null;
      }
    };
  }, [currentQuestion, isLoading, isTyping]);

  // Update scroll hint on user scrolling
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const onScroll = () => updateScrollHint();
    el.addEventListener('scroll', onScroll);
    updateScrollHint();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-advance for dynamic-message questions and handle final-message redirect
  useEffect(() => {
    if (currentQuestion?.type === 'dynamic-message' && !isLoading) {
      const delay = currentQuestion.autoAdvanceDelay || 1500;
      const timer = setTimeout(() => {
        handleAnswer('acknowledged');
      }, delay);
      return () => clearTimeout(timer);
    }
    
    // Handle final-message redirect
    if (currentQuestion?.type === 'final-message' && !isLoading) {
      if (currentQuestion.redirect) {
        const redirectDelay = currentQuestion.redirectDelay || 5000;
        const timer = setTimeout(() => {
          window.location.href = currentQuestion.redirect!;
        }, redirectDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [currentQuestion, isLoading]);


  const handleAnswer = async (answer: any) => {
    if (!currentQuestion || isLoading) return;

    // Check if this is a special action (like close or complete)
    if (answer && typeof answer === 'object' && answer.action) {
      if (answer.action === 'close' || answer.action === 'complete') {
        // Show thank you message
        dispatch(addBotMessage({ content: "Thanks for your time! Starting fresh..." }));
        
        // Reset the survey after a short delay
        setTimeout(() => {
          dispatch(resetSurvey());
        }, 2000);
        
        return;
      }
    }

    // Don't show user message for video-autoplay, videoask, or dynamic-message questions
    if (currentQuestion.type !== 'video-autoplay' && 
        currentQuestion.type !== 'videoask' && 
        currentQuestion.type !== 'dynamic-message') {
      // Add user message for visual feedback
      const displayAnswer = formatAnswerForDisplay(answer, currentQuestion.type);
      dispatch(addUserMessage(displayAnswer));
    }

    // Show typing indicator
    dispatch(setTyping(true));

    // Submit answer
    try {
      const result = await dispatch(submitAnswer({ 
        questionId: currentQuestion.id, 
        answer 
      })).unwrap();
      
      // Only stop typing if the next question is NOT a dynamic-message
      if (!result.nextQuestion || result.nextQuestion.type !== 'dynamic-message') {
        setTimeout(() => {
          dispatch(setTyping(false));
        }, 600);
      }
      // If it IS a dynamic-message, keep typing indicator on
    } catch (error) {
      // Stop typing on error
      setTimeout(() => {
        dispatch(setTyping(false));
      }, 600);
    }
  };

  const formatAnswerForDisplay = (answer: any, questionType: string): string => {
    // For text inputs, return as-is
    if (questionType === 'text-input' || questionType === 'text-input-followup') {
      return answer || '';
    }
    
    // For boolean answers (yes/no questions)
    if (typeof answer === 'boolean') {
      return answer ? 'Yes' : 'No';
    }
    
    // For semantic differential questions
    if (questionType === 'semantic-differential' && typeof answer === 'object' && answer !== null) {
      // Create visual representation with dots only
      const lines: string[] = [];
      
      // The answer object contains the values keyed by variable names
      // We'll display them in the order they were stored
      Object.values(answer).forEach((value: any) => {
        // The value should be 1-5
        const dots = Array(5).fill('○').map((dot, i) => i + 1 === value ? '●' : dot).join(' ');
        lines.push(dots);
      });
      
      return lines.join('\n');
    }
    
    // For questions with options, find the label
    if (currentQuestion?.options) {
      // Handle array answers (multi-select)
      if (Array.isArray(answer)) {
        const labels = answer.map(value => {
          const option = currentQuestion.options?.find(opt => opt.value === value);
          return option?.label || value;
        });
        return labels.join(', ');
      }
      
      // Handle single answer
      const option = currentQuestion.options.find(opt => opt.value === answer);
      if (option) {
        return option.label;
      }
    }
    
    // Handle special object types
    if (typeof answer === 'object' && answer !== null) {
      // Handle contact form responses
      if (answer.email) return answer.email;
      if (answer.phone) return answer.phone;
      if (answer.text) return answer.text;
      if (answer.videoUrl) return '🎥 Video response recorded';
      // Handle VideoAsk responses
      if (answer.type === 'video') return '🎥 Video response recorded';
      if (answer.type === 'audio') return '🎤 Audio response recorded';
      if (answer.type === 'text') return '💬 Text response submitted';
      if (answer.type === 'skipped') return 'Skipped';
    }
    
    // Default: return as string
    return String(answer);
  };

  return (
    <Container>
      <ArtisticBackground />
      <ChatContainer ref={chatContainerRef}>
        <ChatContent>
          {messages.map((message, index) => (
            <ChatMessage key={`${message.id}-${index}`} message={message} />
          ))}
          
          {isTyping && <TypingIndicator />}
          
          {/* Inline Question Area */}
          {(() => {
            // Only render inline area for question types that produce UI
            const nonRenderableTypes = new Set([
              'dynamic-message',
              'final-message',
              'videoask',
              'video-autoplay',
            ] as const);

            const shouldRenderInline = !!currentQuestion && !isLoading && !isTyping && controlsVisible &&
              !nonRenderableTypes.has(currentQuestion.type as any);

            if (!shouldRenderInline) return null;

            return (
            <QuestionArea>
              {(currentQuestion.type === 'single-choice' ||
                currentQuestion.type === 'multi-choice' ||
                currentQuestion.type === 'quick-reply' ||
                currentQuestion.type === 'message-button') ? (
                <QuestionRenderer 
                  key={currentQuestion.id}
                  question={currentQuestion} 
                  onAnswer={handleAnswer}
                  disabled={isLoading}
                />
              ) : (
                <QuestionWrapper>
                  <QuestionRenderer 
                    key={currentQuestion.id}
                    question={currentQuestion} 
                    onAnswer={handleAnswer}
                    disabled={isLoading}
                  />
                </QuestionWrapper>
              )}
            </QuestionArea>
            );
          })()}
          
          {/* Welcome State */}
          {!sessionId && !currentQuestion && (
            <WelcomeArea>
              <WelcomeCard>
                <WelcomePattern />
                <WelcomeContent>
                  <WelcomeTitle>Let&apos;s talk about arts & culture</WelcomeTitle>
                  <WelcomeSubtitle>Your voice shapes Hartford&apos;s creative future</WelcomeSubtitle>
                  <StartButton onClick={() => dispatch(startSurvey(''))}>
                    <ButtonIcon>🎨</ButtonIcon>
                    Begin the Conversation
                  </StartButton>
                </WelcomeContent>
              </WelcomeCard>
            </WelcomeArea>
          )}
          
          <div ref={messagesEndRef} />
        </ChatContent>
        {showScrollHint && (
          <ScrollHint role="button" aria-label="Scroll down for more options" onClick={scrollToBottom}>
            ↓
          </ScrollHint>
        )}
      </ChatContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  position: relative;
  background: ${({ theme }) => theme.colors.background}; // Now #FFF8F1
`;

const ArtisticBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.03;
  background-image: 
    radial-gradient(circle at 20% 80%, ${({ theme }) => theme.colors.accent.purple} 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, ${({ theme }) => theme.colors.accent.coral} 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, ${({ theme }) => theme.colors.accent.teal} 0%, transparent 50%);
  pointer-events: none;
`;

const ChatContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.full};
    
    &:hover {
      background: ${({ theme }) => theme.colors.text.secondary};
    }
  }
`;

const ScrollHint = styled.button`
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.55);
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 6px 10px;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  z-index: 3;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

const ChatContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  padding-bottom: ${({ theme }) => theme.spacing['3xl']};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

const QuestionArea = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  margin-left: 48px; // Align with bot messages
  animation: ${fadeInUp} 0.5s ease-out;
  animation-fill-mode: both;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: 0;
  }
`;

const QuestionWrapper = styled.div`
  background: #D9F7FF;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  position: relative;
  margin-left: 48px; // Align with bot messages
  
  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: -8px;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 10px 10px 10px 0;
    border-color: transparent #D9F7FF transparent transparent;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: 0;
    padding: ${({ theme }) => theme.spacing.lg};
    
    &::before,
    &::after {
      display: none;
    }
  }
`;

const WelcomeArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const WelcomeCard = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows.artistic};
  overflow: hidden;
  max-width: 500px;
  width: 100%;
  transform: translateY(0);
  transition: transform ${({ theme }) => theme.transitions.normal};
  
  &:hover {
    transform: translateY(-4px);
  }
`;

const WelcomePattern = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: ${({ theme }) => theme.colors.gradients.artistic};
  opacity: 0.9;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 40px;
    background: ${({ theme }) => theme.colors.surface};
    border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  }
`;

const WelcomeContent = styled.div`
  position: relative;
  padding: ${({ theme }) => theme.spacing['2xl']};
  text-align: center;
  z-index: 1;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xl};
  }
`;

const WelcomeTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-family: ${({ theme }) => theme.fonts.display};
`;

const WelcomeSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const StartButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.gradients.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing['2xl']};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const bounce = keyframes`
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-12px);
  }
`;

const ButtonIcon = styled.span`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  animation: ${bounce} 2s infinite;
`;

export default ChatInterface;
