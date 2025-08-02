import React, { useState } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface SingleChoiceProps {
  question: Question;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

const SingleChoice: React.FC<SingleChoiceProps> = ({ question, onAnswer, disabled }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setSelected(value);
    // Auto-submit after a short delay for better UX
    setTimeout(() => onAnswer(value), 300);
  };

  return (
    <Container>
      {question.options?.map((option) => (
        <OptionButton
          key={option.id}
          onClick={() => handleSelect(option.value)}
          $isSelected={selected === option.value}
          disabled={disabled}
        >
          <RadioButton $isSelected={selected === option.value} />
          <OptionContent>
            <OptionLabel>{option.label}</OptionLabel>
            {option.description && (
              <OptionDescription>{option.description}</OptionDescription>
            )}
          </OptionContent>
        </OptionButton>
      ))}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const OptionButton = styled.button<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary + '10' : theme.colors.surface};
  border: 2px solid ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  text-align: left;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary}08;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RadioButton = styled.div<{ $isSelected: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary : theme.colors.border};
  position: relative;
  flex-shrink: 0;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.colors.primary};
    opacity: ${({ $isSelected }) => ($isSelected ? 1 : 0)};
    transition: opacity ${({ theme }) => theme.transitions.fast};
  }
`;

const OptionContent = styled.div`
  flex: 1;
`;

const OptionLabel = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const OptionDescription = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export default SingleChoice;