// frontend/src/components/Survey/QuestionTypes/SingleChoice.tsx
import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Question } from '../../../types/survey';

interface SingleChoiceProps {
  question: Question;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

// Define animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const SingleChoice: React.FC<SingleChoiceProps> = ({ question, onAnswer, disabled }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: any) => {
    if (disabled) return;
    setSelected(option.value);

    // Actions that should still execute immediately
    if (option.action === 'link' && option.url) {
      window.open(option.url, '_blank');
      return;
    }
    if (option.action === 'close') {
      onAnswer('close');
      return;
    }
    // For normal options, wait for user to confirm
  };

  const handleConfirm = () => {
    if (selected && !disabled) {
      onAnswer(selected);
    }
  };

  return (
    <Container>
      <OptionsGrid $count={question.options?.length || 0}>
        {question.options?.map((option, index) => (
          <OptionCard
            key={option.id}
            onClick={() => handleSelect(option)}
            $isSelected={selected === option.value}
            $isAnimating={false}
            disabled={disabled}
            $delay={index * 0.05}
          >
            <OptionContent>
              <RadioIndicator $isSelected={selected === option.value} />
              <OptionText>
                <OptionLabel>{option.label}</OptionLabel>
                {option.description && (
                  <OptionDescription>{option.description}</OptionDescription>
                )}
              </OptionText>
            </OptionContent>
          </OptionCard>
        ))}
      </OptionsGrid>

      <ConfirmRow>
        <ConfirmHint>
          {selected ? 'Click confirm to continue' : 'Select one option'}
        </ConfirmHint>
        <ConfirmButton 
          onClick={handleConfirm} 
          disabled={!selected || !!disabled}
        >
          Confirm →
        </ConfirmButton>
      </ConfirmRow>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  padding: 0;
`;

const OptionsGrid = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: ${({ $count }) => 
    $count <= 2 ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr'};
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const OptionCard = styled.button<{ 
  $isSelected: boolean; 
  $isAnimating: boolean;
  $delay: number;
}>`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: #4A90E2;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  cursor: pointer;
  text-align: left;
  transition: all ${({ theme }) => theme.transitions.normal};
  animation: ${fadeInUp} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${({ $delay }) => $delay}s both;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s ease, height 0.6s ease;
  }
  
  ${({ $isAnimating }) => $isAnimating && `
    &::before {
      width: 300%;
      height: 300%;
    }
  `}
  
  &:hover:not(:disabled) {
    background: #357ABD;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  ${({ $isSelected }) => $isSelected && `
    background: #357ABD;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
  `}
`;

const OptionContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  position: relative;
  z-index: 1;
`;

const RadioIndicator = styled.div<{ $isSelected: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid white;
  background: ${({ $isSelected }) => $isSelected ? 'white' : 'transparent'};
  position: relative;
  flex-shrink: 0;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4A90E2;
    transition: transform ${({ theme }) => theme.transitions.fast};
  }
  
  ${({ $isSelected }) => $isSelected && `
    &::after {
      transform: translate(-50%, -50%) scale(1);
    }
  `}
`;

const OptionText = styled.div`
  flex: 1;
`;

const OptionLabel = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  line-height: 1.4;
  font-family: 'Nunito', sans-serif;
`;

const OptionDescription = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: rgba(255, 255, 255, 0.85);
  margin-top: ${({ theme }) => theme.spacing.xs};
  line-height: 1.4;
  font-family: 'Nunito', sans-serif;
`;

const ConfirmRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const ConfirmHint = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const ConfirmButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    filter: brightness(0.95);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default SingleChoice;
