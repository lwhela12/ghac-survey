// frontend/src/components/Survey/ChatMessage.tsx
import React, { useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import amandaIcon from '../../../assets/images/Amanda_icon.png';
import { useAppDispatch } from '../../hooks/redux';
import { submitAnswer } from '../../store/slices/surveySlice';
import VideoAskQuestion from './QuestionTypes/VideoAskQuestion';

interface ChatMessageProps {
  message: {
    id: string;
    type: 'bot' | 'user' | 'system';
    content: string;
    timestamp: string;
    question?: any; // Include the full question object
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const dispatch = useAppDispatch();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoCompleted, setVideoCompleted] = React.useState(false);

  useEffect(() => {
    // Disabled autoplay for testing
    // if (message.question?.type === 'video-autoplay' && videoRef.current && !videoCompleted) {
    //   videoRef.current.play().catch(error => {
    //     console.error('Autoplay failed:', error);
    //   });
    // }
  }, [message.question, videoCompleted]);

  const handleVideoEnd = () => {
    if (!videoCompleted && message.question) {
      setVideoCompleted(true);
      // Submit the answer to advance to next question
      dispatch(submitAnswer({ 
        questionId: message.question.id, 
        answer: 'watched' 
      }));
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const handleSkipVideo = () => {
    if (!videoCompleted && message.question) {
      setVideoCompleted(true);
      // Submit the answer to advance to next question
      dispatch(submitAnswer({ 
        questionId: message.question.id, 
        answer: 'skipped' 
      }));
    }
  };

  const renderContent = () => {
    // Check if this is a video message
    if (message.question?.type === 'video-autoplay' && message.question?.videoUrl) {
      return (
        <>
          <VideoContainer>
            <Video
              ref={videoRef}
              src={message.question.videoUrl}
              controls
              playsInline
              loop={false}
              onEnded={handleVideoEnd}
            />
          </VideoContainer>
          {!videoCompleted && (
            <SkipButton onClick={handleSkipVideo}>
              Skip Video →
            </SkipButton>
          )}
        </>
      );
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
    
    return <Content>{message.content}</Content>;
  };

  // Check if this is a video message
  const isVideoMessage = message.question?.type === 'video-autoplay' && message.question?.videoUrl;
  const isVideoAskMessage = message.question?.type === 'videoask';

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

  return (
    <Container type={message.type}>
      {message.type === 'bot' && <BotAvatar />}
      <MessageWrapper type={message.type}>
        {isVideoMessage ? (
          <>
            {renderContent()}
            <Timestamp type={message.type}>{formatTime(message.timestamp)}</Timestamp>
          </>
        ) : isVideoAskMessage ? (
          <>
            <VideoAskWrapper>
              <VideoAskQuestion 
                question={message.question}
                onAnswer={handleVideoAskAnswer}
                disabled={false}
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
};

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

const VideoContainer = styled.div`
  width: 280px;
  aspect-ratio: 9 / 16;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  background: #000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 200px;
  }
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
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
  }
`;

const VideoAskWrapper = styled.div`
  margin-left: 48px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: 0;
  }
`;

export default ChatMessage;