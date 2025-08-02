// frontend/src/components/Survey/TypingIndicator.tsx
import React from 'react';
import styled, { keyframes } from 'styled-components';
import amandaIcon from '../../../assets/images/Amanda_icon.png';

const TypingIndicator: React.FC = () => {
  return (
    <Container>
      <BotAvatar />
      <Bubble>
        <DotsContainer>
          <Dot $delay={0} />
          <Dot $delay={0.15} />
          <Dot $delay={0.3} />
        </DotsContainer>
      </Bubble>
    </Container>
  );
};

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0) scale(1);
    background-color: #718096;
  }
  30% {
    transform: translateY(-10px) scale(1.1);
    background-color: #0055A5;
  }
`;

const Container = styled.div`
  display: flex;
  align-items: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  animation: ${fadeIn} 0.3s ease-out;
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

const Bubble = styled.div`
  background: #D9F7FF;
  border: none;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border-bottom-left-radius: ${({ theme }) => theme.borderRadius.sm};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  position: relative;
  
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

const DotsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Dot = styled.div<{ $delay: number }>`
  width: 10px;
  height: 10px;
  background-color: ${({ theme }) => theme.colors.text.light};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  animation: ${bounce} 1.4s ease-in-out ${({ $delay }) => $delay}s infinite;
`;

export default TypingIndicator;