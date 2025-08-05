import React from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface YesNoProps {
  question: Question;
  onAnswer: (answer: any) => void;
  disabled?: boolean;
}

const YesNo: React.FC<YesNoProps> = ({ question, onAnswer, disabled }) => {
  return (
    <Container>
      {question.options?.map((option) => (
        <Button
          key={option.id}
          onClick={() => onAnswer(option.value)}
          disabled={disabled}
          $variant={option.value === 'true' || option.value === 'yes' || option.value === 'Yes' ? 'primary' : 'secondary'}
        >
          {option.label}
        </Button>
      ))}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' }>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.primary : theme.colors.surface};
  color: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.text.inverse : theme.colors.text.primary};
  border: 2px solid ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default YesNo;