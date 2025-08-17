// frontend/src/components/Survey/ChatMessage.tsx
import React, { useEffect, forwardRef, memo } from 'react';
import styled, { css, keyframes } from 'styled-components';
import amandaIcon from '../../assets/images/Amanda_icon.png';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { submitAnswer } from '../../store/slices/surveySlice';
import VideoAskQuestion from './QuestionTypes/VideoAskQuestion';
import QuestionRenderer from './QuestionRenderer';

interface ChatMessageProps {
  message: {
    id: string;
    type: 'bot' | 'user' | 'system';
    content: string;
    timestamp: string;
    question?: any; // Include the full question object
  };
}

const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(({ message }, ref) => {
  const dispatch = useAppDispatch();
  const currentQuestion = useAppSelector(state => state.survey.currentQuestion);
  const [videoCompleted] = React.useState(false);

  useEffect(() => {
    // Disabled autoplay for testing
    // if (message.question?.type === 'video-autoplay' && videoRef.current && !videoCompleted) {
    //   videoRef.current.play().catch(error => {
    //     console.error('Autoplay failed:', error);
    //   });
    // }
  }, [message.question, videoCompleted]);


  const formatTime = (date: string) => {
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };


  const renderContent = () => {
    // For video-autoplay with VideoAsk, don't render anything - it's handled separately
    if (message.question?.type === 'video-autoplay' && message.question?.videoAskId) {
      return null;
    }
    
    // Check if content contains a markdown image/gif
    const gifMatch = message.content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (gifMatch) {
      const altText = gifMatch[1];
      const imageUrl = gifMatch[2];
      
      // Check if it's a GIF
      if (imageUrl.includes('.gif') || imageUrl.includes('giphy')) {
        return (
          <GifContainer>
            <GifImage src={imageUrl} alt={altText} />
          </GifContainer>
        );
      }
    }
    
    // Check if the message has links from the question object
    if (message.question?.links && message.question.links.length > 0) {
      let content = message.content;
      
      // Replace each link text with an actual link
      message.question.links.forEach((link: { text: string; url: string }) => {
        const linkHtml = `<a href="${link.url}" target="_blank" rel="noopener noreferrer" style="color: #0055A5; text-decoration: underline;">${link.text}</a>`;
        content = content.replace(link.text, linkHtml);
      });
      
      return <Content dangerouslySetInnerHTML={{ __html: content }} />;
    }

    // Support basic markdown (bold and links) in bot messages
    if (message.type === 'bot' && message.content) {
      let html = message.content;
      
      // Convert markdown links [text](url) to HTML links
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #0055A5; text-decoration: underline;">$1</a>');
      
      // Convert bold **text** to HTML
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      
      // Convert line breaks to <br> tags
      html = html.replace(/\n/g, '<br>');
      
      if (html !== message.content) {
        return <Content dangerouslySetInnerHTML={{ __html: html }} />;
      }
    }

    // Check if this is a semantic differential answer in user message
    if (message.type === 'user' && message.content.includes('○') && message.content.includes('●')) {
      return <SemanticContent>{message.content}</SemanticContent>;
    }

    return <Content>{message.content}</Content>;
  };

  const isVideoAskMessage = message.question?.type === 'videoask';
  const isVideoAutoplayMessage = message.question?.type === 'video-autoplay';

  // Handle VideoAsk answer
  const handleVideoAskAnswer = (answer: any) => {
    if (message.question) {
      console.log('ChatMessage - VideoAsk answer submission:', {
        messageId: message.id,
        questionId: message.question.id,
        questionContent: message.question.content,
        videoAskFormId: message.question.videoAskFormId,
        answer
      });
      dispatch(submitAnswer({
        questionId: message.question.id,
        answer
      }));
    }
  };

  // Handle video-autoplay rendering
  const isCurrentQuestion = currentQuestion?.id === message.question?.id;

  return (
    <Container ref={ref} type={message.type} data-question-id={message.question?.id || undefined}>
      {message.type === 'bot' && <BotAvatar />}
      <MessageWrapper type={message.type}>
        {isVideoAutoplayMessage ? (
          <>
            {/* Always render the video if persistVideo is true, hide skip button when not current */}
            {message.question?.persistVideo ? (
              <div style={{ position: 'relative' }}>
                <QuestionRenderer 
                  key={message.question.id}
                  question={message.question} 
                  onAnswer={(answer) => {
                    if (isCurrentQuestion) {
                      // Only submit if it's the current question
                      dispatch(submitAnswer({
                        questionId: message.question.id,
                        answer
                      }));
                    }
                  }}
                  disabled={!isCurrentQuestion}
                />
              </div>
            ) : (
              /* Non-persist videos only show when current */
              isCurrentQuestion && (
                <QuestionRenderer 
                  key={message.question.id}
                  question={message.question} 
                  onAnswer={(answer) => {
                    dispatch(submitAnswer({
                      questionId: message.question.id,
                      answer
                    }));
                  }}
                  disabled={false}
                />
              )
            )}
            <Timestamp type={message.type}>{formatTime(message.timestamp)}</Timestamp>
          </>
        ) : isVideoAskMessage ? (
          <>
            <VideoAskWrapper>
              <VideoAskQuestion 
                question={message.question}
                onAnswer={handleVideoAskAnswer}
                disabled={!isCurrentQuestion}
              />
            </VideoAskWrapper>
            <Timestamp type={message.type}>{formatTime(message.timestamp)}</Timestamp>
          </>
        ) : (
          <>
            <Bubble type={message.type}>
              {renderContent()}
            </Bubble>
            <Timestamp type={message.type}>{formatTime(message.timestamp)}</Timestamp>
          </>
        )}
      </MessageWrapper>
    </Container>
  );
});

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

const Container = styled.div<{ type: 'bot' | 'user' | 'system' }>`
  display: flex;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  animation: ${fadeInUp} 0.4s ease-out;
  animation-fill-mode: both;
  
  /* Desktop scroll snap for question alignment */
  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }
  
  ${({ type }) =>
    type === 'user' &&
    css`
      justify-content: flex-end;
    `}
  
  ${({ type }) =>
    type === 'system' &&
    css`
      justify-content: center;
    `}
`;

const BotAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-image: url(${amandaIcon});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  margin-right: ${({ theme }) => theme.spacing.sm};
  flex-shrink: 0;
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const MessageWrapper = styled.div<{ type: 'bot' | 'user' | 'system' }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ type }) => type === 'user' ? 'flex-end' : 'flex-start'};
  max-width: 70%;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-width: 85%;
  }
`;

const Bubble = styled.div<{ type: 'bot' | 'user' | 'system' }>`
  position: relative;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: transform ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    transform: translateY(-1px);
  }
  
  ${({ theme, type }) => {
    switch (type) {
      case 'bot':
        return css`
          background: #D9F7FF;
          color: ${theme.colors.text.primary};
          border: none;
          border-bottom-left-radius: ${theme.borderRadius.sm};
          
          &::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: -8px;
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 0 10px 10px 0;
            border-color: transparent #D9F7FF transparent transparent;
          }
        `;
      case 'user':
        return css`
          background: #2F2F2F;
          color: white;
          border-bottom-right-radius: ${theme.borderRadius.sm};
          
          &::before {
            content: '';
            position: absolute;
            bottom: 0;
            right: -8px;
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 0 0 10px 10px;
            border-color: transparent transparent transparent #2F2F2F;
          }
        `;
      case 'system':
        return css`
          background: ${theme.colors.surfaceAlt};
          color: ${theme.colors.text.secondary};
          text-align: center;
          font-size: ${theme.fontSizes.sm};
          border: 1px solid ${theme.colors.borderLight};
          padding: ${theme.spacing.sm} ${theme.spacing.md};
        `;
    }
  }}
`;

const Content = styled.p`
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: 'Nunito', sans-serif;
`;

const Timestamp = styled.span<{ type: 'bot' | 'user' | 'system' }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.light};
  margin-top: ${({ theme }) => theme.spacing.xs};
  margin-left: ${({ type }) => type === 'bot' ? '12px' : '0'};
  margin-right: ${({ type }) => type === 'user' ? '12px' : '0'};
  opacity: 0.7;
`;


const VideoAskWrapper = styled.div`
  margin-left: 48px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: 0;
  }
`;

const SemanticContent = styled.pre`
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: ${({ theme }) => theme.fontSizes.base};
  line-height: 1.8;
  white-space: pre;
  word-wrap: break-word;
  letter-spacing: 0.1em;
`;

const GifContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm};
  max-width: 300px;
  margin: 0 auto;
`;

const GifImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

export default memo(ChatMessage);
