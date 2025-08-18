import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface MultiChoiceProps {
  question: Question;
  onAnswer: (answer: string[]) => void;
  disabled?: boolean;
}

const MultiChoice: React.FC<MultiChoiceProps> = ({ question, onAnswer, disabled }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const exclusiveValues = useMemo(() => (question.options || [])
    .filter(o => (o as any).exclusive || o.value === 'no-updates')
    .map(o => o.value), [question.options]);

  const hasExclusiveSelected = useMemo(() => Array.from(selected).some(v => exclusiveValues.includes(v)), [selected, exclusiveValues]);
  const hasNonExclusiveSelected = useMemo(() => Array.from(selected).some(v => !exclusiveValues.includes(v)), [selected, exclusiveValues]);

  const isOptionDisabled = (optionValue: string): boolean => {
    if (disabled) return true;
    const isExclusive = exclusiveValues.includes(optionValue);
    const isSelected = selected.has(optionValue);
    // If an exclusive is selected, disable all non-exclusive options (unless it's the selected one)
    if (hasExclusiveSelected && !isExclusive && !isSelected) return true;
    // If any non-exclusive is selected, disable exclusive options (unless it's the selected one)
    if (hasNonExclusiveSelected && isExclusive && !isSelected) return true;
    // Enforce maxSelections
    if (question.maxSelections && selected.size >= question.maxSelections && !isSelected) return true;
    return false;
  };

  const handleToggle = (value: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      if (question.maxSelections && newSelected.size >= question.maxSelections) {
        return; // Don't add if max selections reached
      }
      const isExclusive = exclusiveValues.includes(value);
      if (isExclusive) {
        // Selecting an exclusive clears others
        newSelected.clear();
        newSelected.add(value);
      } else {
        // Selecting non-exclusive clears any exclusive selection
        for (const v of Array.from(newSelected)) {
          if (exclusiveValues.includes(v)) newSelected.delete(v);
        }
        newSelected.add(value);
      }
    }
    setSelected(newSelected);
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    // Enforce exclusivity for "no-updates" if present
    const values = Array.from(selected);
    const hasNoUpdates = values.includes('no-updates');
    const filtered = hasNoUpdates ? ['no-updates'] : values.filter(v => v !== 'no-updates');
    onAnswer(filtered);
  };

  return (
    <Container>
      <OptionsContainer>
        {question.options?.map((option) => (
          <OptionButton
            key={option.id}
            onClick={() => handleToggle(option.value)}
            $isSelected={selected.has(option.value)}
            disabled={isOptionDisabled(option.value)}
          >
            <Checkbox $isSelected={selected.has(option.value)} />
            <OptionLabel>{option.label}</OptionLabel>
          </OptionButton>
        ))}
      </OptionsContainer>
      
      <SubmitButton 
        onClick={handleSubmit} 
        disabled={disabled || selected.size === 0}
      >
        Continue ({selected.size} selected)
      </SubmitButton>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const OptionsContainer = styled.div`
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

const Checkbox = styled.div<{ $isSelected: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 2px solid ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary : theme.colors.border};
  background-color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary : 'transparent'};
  position: relative;
  flex-shrink: 0;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 14px;
    font-weight: bold;
    opacity: ${({ $isSelected }) => ($isSelected ? 1 : 0)};
  }
`;

const OptionLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const SubmitButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  align-self: flex-start;
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary}dd;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default MultiChoice;
