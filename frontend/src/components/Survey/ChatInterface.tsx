// frontend/src/components/Survey/ChatInterface.tsx
import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
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

// --- Keyframes ---

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
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
`;


// --- Component ---

const ChatInterface: React.FC = () => {
  const dispatch = useAppDispatch();
  const { messages, currentQuestion, isTyping, isLoading, sessionId } = useAppSelector(
    (state) => state.survey
  );

  // --- Refs ---
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const questionAreaRef = useRef<HTMLDivElement>(null);

  // --- State ---
  const [showScrollHint, setShowScrollHint] = useState(false);

  // --- Scrolling Logic ---

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Hide hint as soon as user starts scrolling
      if (showScrollHint) {
        setShowScrollHint(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [showScrollHint]);


  useEffect(() => {
    // This is the main scrolling effect.
    // It waits for animations to finish, then decides HOW to scroll.
    if (isTyping) {
      // If the bot is typing, just scroll to the bottom to show the indicator
      const t = setTimeout(() => {
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
      return () => clearTimeout(t);
    }

    // 550ms delay: 500ms for QuestionArea animation + 50ms buffer
    const scrollTimeout = setTimeout(() => {
      const container = chatContainerRef.current;
      const lastMessage = lastMessageRef.current;
      const questionArea = questionAreaRef.current;

      if (!container) return;

      // Check if an interactive question area is visible
      if (questionArea && lastMessage) {
        const containerHeight = container.clientHeight;
        const questionAreaHeight = questionArea.offsetHeight;
        const lastMessageHeight = lastMessage.offsetHeight;
        
        // If combined height of question + answers is taller than visible area, scroll question to top
        if ((questionAreaHeight + lastMessageHeight) > containerHeight) {
          lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // After scrolling, check if a hint is needed
          const hintTimeout = setTimeout(() => {
            const isScrollable = container.scrollHeight > container.clientHeight && 
                                 container.scrollTop + container.clientHeight < container.scrollHeight - 10;
            setShowScrollHint(isScrollable);
          }, 500); // Wait for scroll to finish
          return () => clearTimeout(hintTimeout);

        } else {
          // Otherwise, scroll to the very bottom
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
      } else {
        // For simple messages without a question area, just scroll to bottom
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }, 550);

    return () => clearTimeout(scrollTimeout);

  }, [currentQuestion, isTyping]);


  // --- Auto-advance & Redirect Logic ---

  useEffect(() => {
    if (currentQuestion?.type === 'dynamic-message' && !isLoading) {
      const delay = currentQuestion.autoAdvanceDelay || 1500;
      const timer = setTimeout(() => {
        handleAnswer('acknowledged');
      }, delay);
      return () => clearTimeout(timer);
    }
    
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


  // --- Answer Handling ---

  const handleAnswer = async (answer: any) => {
    if (!currentQuestion || isLoading) return;

    if (answer && typeof answer === 'object' && answer.action) {
      if (answer.action === 'close' || answer.action === 'complete') {
        dispatch(addBotMessage({ content: "Thanks for your time! Starting fresh..." }));
        setTimeout(() => dispatch(resetSurvey()), 2000);
        return;
      }
    }

    const nonDisplayableAnswerTypes = new Set([
        'video-autoplay', 
        'videoask', 
        'dynamic-message'
    ]);

    if (!nonDisplayableAnswerTypes.has(currentQuestion.type)) {
      const displayAnswer = formatAnswerForDisplay(answer, currentQuestion.type);
      dispatch(addUserMessage(displayAnswer));
    }

    dispatch(setTyping(true));

    try {
      const result = await dispatch(submitAnswer({ 
        questionId: currentQuestion.id, 
        answer 
      })).unwrap();
      
      if (!result.nextQuestion || result.nextQuestion.type !== 'dynamic-message') {
        setTimeout(() => dispatch(setTyping(false)), 600);
      }
    } catch (error) {
      setTimeout(() => dispatch(setTyping(false)), 600);
    }
  };

  const formatAnswerForDisplay = (answer: any, questionType: string): string => {
    if (questionType === 'text-input' || questionType === 'text-input-followup') {
      return answer || '';
    }
    if (typeof answer === 'boolean') {
      return answer ? 'Yes' : 'No';
    }
    if (questionType === 'semantic-differential' && typeof answer === 'object' && answer !== null) {
      const lines: string[] = [];
      Object.values(answer).forEach((value: any) => {
        const dots = Array(5).fill('○').map((dot, i) => i + 1 === value ? '●' : dot).join(' ');
        lines.push(dots);
      });
      return lines.join('\n');
    }
    if (currentQuestion?.options) {
      if (Array.isArray(answer)) {
        return answer.map(value => {
          const option = currentQuestion.options?.find(opt => opt.value === value);
          return option?.label || value;
        }).join(', ');
      }
      const option = currentQuestion.options.find(opt => opt.value === answer);
      if (option) return option.label;
    }
    if (typeof answer === 'object' && answer !== null) {
      if (answer.email) return answer.email;
      if (answer.phone) return answer.phone;
      if (answer.text) return answer.text;
      if (answer.videoUrl) return '🎥 Video response recorded';
      if (answer.type === 'video') return '🎥 Video response recorded';
      if (answer.type === 'audio') return '🎤 Audio response recorded';
      if (answer.type === 'text') return '💬 Text response submitted';
      if (answer.type === 'skipped') return 'Skipped';
    }
    return String(answer);
  };

  // --- Render ---

  return (
    <Container>
      <ArtisticBackground />
      <ChatContainer ref={chatContainerRef}>
        <ChatContent>
          {messages.map((message, index) => {
            const isLastBotMessage = message.type === 'bot' && 
                                     index === messages.length - 1;
            return (
              <ChatMessage 
                key={`${message.id}-${index}`} 
                ref={isLastBotMessage ? lastMessageRef : null}
                message={message} 
              />
            );
          })}
          
          {isTyping && <TypingIndicator />}
          
          {(() => {
            const nonRenderableTypes = new Set([
              'dynamic-message', 'final-message', 'videoask', 'video-autoplay'
            ]);

            const shouldRenderInline = !!currentQuestion && !isLoading && !isTyping &&
              !nonRenderableTypes.has(currentQuestion.type as any);

            if (!shouldRenderInline) return null;

            return (
              <QuestionArea ref={questionAreaRef}>
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
        </ChatContent>
        <ScrollHint $visible={showScrollHint}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7"/>
          </svg>
        </ScrollHint>
      </ChatContainer>
    </Container>
  );
};

// --- Styled Components ---

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  position: relative;
  background: ${({ theme }) => theme.colors.background};
`;

const ArtisticBackground = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
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
  
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.full};
    &:hover { background: ${({ theme }) => theme.colors.text.secondary}; }
  }
`;

const ChatContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

const QuestionArea = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  margin-left: 48px;
  animation: ${fadeInUp} 0.5s ease-out both;
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: 0;
  }
`;

const QuestionWrapper = styled.div`
  background: #D9F7FF;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  position: relative;
  margin-left: 48px;
  
  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: -8px;
    width: 0; height: 0;
    border-style: solid;
    border-width: 10px 10px 10px 0;
    border-color: transparent #D9F7FF transparent transparent;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: 0;
    padding: ${({ theme }) => theme.spacing.lg};
    &::before { display: none; }
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
  &:hover { transform: translateY(-4px); }
`;

const WelcomePattern = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 120px;
  background: ${({ theme }) => theme.colors.gradients.artistic};
  opacity: 0.9;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
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
  &:active { transform: translateY(0); }
`;

const ButtonIcon = styled.span`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  animation: ${bounce} 2s infinite;
`;

const ScrollHint = styled.div<{$visible: boolean}>`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
  pointer-events: none;
  
  opacity: 0;
  animation: ${({ $visible }) => $visible ? css`${fadeIn} 0.3s forwards` : css`${fadeOut} 0.3s forwards`};
  
  svg {
    animation: ${bounce} 1.5s infinite;
  }
`;

export default ChatInterface;
