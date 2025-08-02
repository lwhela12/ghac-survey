// frontend/src/components/Survey/QuestionTypes/QuickReply.tsx
import React from 'react';
import styled, { css } from 'styled-components';
import { Question } from '../../../types/survey';

interface QuickReplyProps {
  question: Question;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

const QuickReply: React.FC<QuickReplyProps> = ({ question, onAnswer, disabled }) => {
  const getButtonVariant = (index: number) => {
    const variants = ['primary', 'secondary', 'accent'] as const;
    return variants[index % variants.length];
  };

  return (
    <Container>
      {question.options?.map((option, index) => (
        <Button
          key={option.id}
          onClick={() => onAnswer(option.value)}
          disabled={disabled}
          $variant={getButtonVariant(index)}
        >
          <ButtonContent>
            <ButtonText>{option.label}</ButtonText>
            <ButtonIcon>→</ButtonIcon>
          </ButtonContent>
        </Button>
      ))}
      
      {question.buttonText && (
        <Button 
          onClick={() => onAnswer('continue')} 
          disabled={disabled}
          $variant="primary"
        >
          <ButtonContent>
            <ButtonText>{question.buttonText}</ButtonText>
            <ButtonIcon>→</ButtonIcon>
          </ButtonContent>
        </Button>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: 600px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const ButtonContent = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  transition: gap ${({ theme }) => theme.transitions.fast};
`;

const ButtonText = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const ButtonIcon = styled.span`
  opacity: 0;
  transform: translateX(-10px);
  transition: all ${({ theme }) => theme.transitions.fast};
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'accent' }>`
  position: relative;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 2px solid;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.base};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};
  white-space: nowrap;
  overflow: hidden;
  
  ${({ theme, $variant }) => {
    switch ($variant) {
      case 'primary':
        return css`
          border-color: ${theme.colors.primary};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.primary};
            color: ${theme.colors.text.inverse};
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 85, 165, 0.3);
          }
        `;
      case 'secondary':
        return css`
          border-color: ${theme.colors.secondary};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.secondary};
            color: ${theme.colors.text.primary};
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(178, 187, 28, 0.3);
          }
        `;
      case 'accent':
        return css`
          border-color: ${theme.colors.accent.purple};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.accent.purple};
            color: ${theme.colors.text.inverse};
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(132, 94, 194, 0.3);
          }
        `;
    }
  }}
  
  &:hover:not(:disabled) {
    ${ButtonContent} {
      gap: ${({ theme }) => theme.spacing.md};
    }
    
    ${ButtonIcon} {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    justify-content: center;
  }
`;

export default QuickReply;