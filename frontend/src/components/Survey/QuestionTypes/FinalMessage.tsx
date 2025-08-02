import React from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

const FinalMessage: React.FC<{ question: Question; onAnswer: (answer: any) => void }> = ({ 
  question, onAnswer 
}) => {
  return (
    <Container>
      <Message>{question.content}</Message>
      <ButtonGroup>
        {question.options?.map((option) => (
          <ActionButton
            key={option.id}
            onClick={() => {
              if (option.action === 'link' && option.url) {
                window.open(option.url, '_blank');
              } else if (option.action === 'complete') {
                onAnswer({ action: 'complete' });
              }
            }}
            $variant={option.id === 'explore' ? 'primary' : 'secondary'}
          >
            {option.label}
          </ActionButton>
        ))}
      </ButtonGroup>
    </Container>
  );
};

const Container = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Message = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  white-space: pre-wrap;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.primary : theme.colors.surface};
  color: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.text.inverse : theme.colors.text.primary};
  border: 2px solid ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

export default FinalMessage;