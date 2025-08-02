import React from 'react';
import styled, { css } from 'styled-components';

interface ChatMessageProps {
  message: {
    id: string;
    type: 'bot' | 'user' | 'system';
    content: string;
    timestamp: string; // ISO string
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  // Simple time formatting without external dependency
  const formatTime = (date: Date) => {
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
      <Bubble type={message.type}>
        <Content>{message.content}</Content>
        <Timestamp>{formatTime(message.timestamp)}</Timestamp>
      </Bubble>
    </Container>
  );
};

const Container = styled.div<{ type: 'bot' | 'user' | 'system' }>`
  display: flex;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  animation: fadeIn 0.3s ease-out;
  
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

const Bubble = styled.div<{ type: 'bot' | 'user' | 'system' }>`
  max-width: 70%;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  position: relative;
  
  ${({ theme, type }) => {
    switch (type) {
      case 'bot':
        return css`
          background-color: ${theme.colors.chatBubble.bot};
          color: ${theme.colors.text.primary};
          border-bottom-left-radius: ${theme.borderRadius.sm};
        `;
      case 'user':
        return css`
          background-color: ${theme.colors.chatBubble.user};
          color: ${theme.colors.chatBubble.userText};
          border-bottom-right-radius: ${theme.borderRadius.sm};
        `;
      case 'system':
        return css`
          background-color: ${theme.colors.surface};
          color: ${theme.colors.text.secondary};
          text-align: center;
          font-size: ${theme.fontSizes.sm};
        `;
    }
  }}
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-width: 85%;
  }
`;

const Content = styled.p`
  margin: 0;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const Timestamp = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  opacity: 0.7;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export default ChatMessage;