import React from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface QuickReplyProps {
  question: Question;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

const QuickReply: React.FC<QuickReplyProps> = ({ question, onAnswer, disabled }) => {
  return (
    <Container>
      {question.options?.map((option) => (
        <Button
          key={option.id}
          onClick={() => onAnswer(option.value)}
          disabled={disabled}
        >
          {option.label}
        </Button>
      ))}
      
      {question.buttonText && (
        <Button onClick={() => onAnswer('continue')} disabled={disabled}>
          {question.buttonText}
        </Button>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary}dd;
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
  }
`;

export default QuickReply;