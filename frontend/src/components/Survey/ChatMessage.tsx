// frontend/src/components/Survey/ChatMessage.tsx
import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import amandaIcon from '../../../assets/images/Amanda_icon.png';

interface ChatMessageProps {
  message: {
    id: string;
    type: 'bot' | 'user' | 'system';
    content: string;
    timestamp: string;
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formatTime = (date: string) => {
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  return (
    <Container type={message.type}>
      {message.type === 'bot' && <BotAvatar />}
      <MessageWrapper type={message.type}>
        <Bubble type={message.type}>
          <Content>{message.content}</Content>
        </Bubble>
        <Timestamp type={message.type}>{formatTime(message.timestamp)}</Timestamp>
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

export default ChatMessage;