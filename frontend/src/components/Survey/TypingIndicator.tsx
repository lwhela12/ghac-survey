import React from 'react';
import styled, { keyframes } from 'styled-components';

const TypingIndicator: React.FC = () => {
  return (
    <Container>
      <Bubble>
        <Dot $delay={0} />
        <Dot $delay={0.2} />
        <Dot $delay={0.4} />
      </Bubble>
    </Container>
  );
};

const bounce = keyframes`
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
`;

const Container = styled.div`
  display: flex;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  animation: fadeIn 0.3s ease-out;
`;

const Bubble = styled.div`
  background-color: ${({ theme }) => theme.colors.chatBubble.bot};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border-bottom-left-radius: ${({ theme }) => theme.borderRadius.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Dot = styled.div<{ $delay: number }>`
  width: 8px;
  height: 8px;
  background-color: ${({ theme }) => theme.colors.text.secondary};
  border-radius: 50%;
  animation: ${bounce} 1.4s ease-in-out ${({ $delay }) => $delay}s infinite;
`;

export default TypingIndicator;