import React, { useState } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface ScaleProps {
  question: Question;
  onAnswer: (answer: number) => void;
  disabled?: boolean;
}

const Scale: React.FC<ScaleProps> = ({ question, onAnswer, disabled }) => {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (value: number) => {
    setSelected(value);
    // Auto-submit after a short delay
    setTimeout(() => onAnswer(value), 300);
  };

  return (
    <Container>
      <ScaleContainer>
        {question.options?.map((option) => (
          <ScaleOption
            key={option.value}
            onClick={() => handleSelect(Number(option.value))}
            $isSelected={selected === Number(option.value)}
            disabled={disabled}
          >
            <OptionLabel>{option.label}</OptionLabel>
            {option.description && (
              <OptionDescription>{option.description}</OptionDescription>
            )}
          </ScaleOption>
        ))}
      </ScaleContainer>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
`;

const ScaleContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const ScaleOption = styled.button<{ $isSelected: boolean }>`
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary : theme.colors.surface};
  color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.text.inverse : theme.colors.text.primary};
  border: 2px solid ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  text-align: center;
  
  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const OptionLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const OptionDescription = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.4;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export default Scale;