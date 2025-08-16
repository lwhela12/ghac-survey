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
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const handleSelect = (value: number) => {
    setSelected(value);
    // Auto-submit after a short delay
    setTimeout(() => onAnswer(value), 300);
  };

  return (
    <Container>
      <ScaleWrapper>
        <ScaleLine />
        <BubblesContainer>
          {question.options?.map((option) => {
            const value = Number(option.value);
            const isSelected = selected === value;
            const isHovered = hoveredValue === value;
            
            return (
              <BubbleWrapper key={option.value}>
                <NumberLabel>{value}</NumberLabel>
                <Bubble
                  onClick={() => handleSelect(value)}
                  onMouseEnter={() => setHoveredValue(value)}
                  onMouseLeave={() => setHoveredValue(null)}
                  $isSelected={isSelected}
                  $isHovered={isHovered}
                  disabled={disabled}
                  aria-label={`${option.label}: ${option.description}`}
                >
                  {isSelected && <CheckMark>✓</CheckMark>}
                </Bubble>
                <Emoji>{option.emoji}</Emoji>
                {(option.showText || isHovered) && (
                  <Label>
                    {option.label.split(' ').map((word, i) => (
                      <span key={i}>{word}</span>
                    ))}
                  </Label>
                )}
              </BubbleWrapper>
            );
          })}
        </BubblesContainer>
      </ScaleWrapper>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.lg} 0;
`;

const ScaleWrapper = styled.div`
  position: relative;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`;

const ScaleLine = styled.div`
  position: absolute;
  top: 38%;
  left: 10%;
  right: 10%;
  height: 2px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 1px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    left: 5%;
    right: 5%;
  }
`;

const BubblesContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
`;

const BubbleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  cursor: pointer;
  min-width: 0;
`;

const NumberLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Bubble = styled.button<{ $isSelected: boolean; $isHovered: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid ${({ theme, $isSelected, $isHovered }) =>
    $isSelected ? theme.colors.primary : 
    $isHovered ? theme.colors.primary : 
    theme.colors.border};
  background: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary : theme.colors.surface};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    transform: scale(1.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 36px;
    height: 36px;
  }
`;

const CheckMark = styled.span`
  color: ${({ theme }) => theme.colors.text.inverse};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 1;
`;

const Emoji = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  line-height: 1;
  margin-top: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`;

const Label = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  line-height: 1.2;
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

const Description = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.3;
  margin-top: ${({ theme }) => theme.spacing.xs};
  max-width: 100px;
  text-align: center;
  position: absolute;
  top: 100%;
  margin-top: ${({ theme }) => theme.spacing.sm};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

export default Scale;