import React, { useState } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface DemographicsProps {
  question: Question;
  onAnswer: (answer: any) => void;
  disabled?: boolean;
}

interface MultiChoiceHandlerProps {
  options: any[];
  onSubmit: (selected: string[]) => void;
  disabled?: boolean;
}

const MultiChoiceHandler: React.FC<MultiChoiceHandlerProps> = ({ options, onSubmit, disabled }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleToggle = (value: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    setSelected(newSelected);
  };

  const handleSubmit = () => {
    onSubmit(Array.from(selected));
  };

  return (
    <>
      <OptionsContainer>
        {options.map((option) => (
          <CheckboxOption
            key={option.id || option.value}
            onClick={() => handleToggle(option.value)}
            $isSelected={selected.has(option.value)}
            disabled={disabled}
          >
            <Checkbox $isSelected={selected.has(option.value)} />
            <span>{option.label}</span>
          </CheckboxOption>
        ))}
      </OptionsContainer>
      <ContinueButton 
        onClick={handleSubmit} 
        disabled={disabled || selected.size === 0}
      >
        Continue ({selected.size} selected)
      </ContinueButton>
    </>
  );
};

const Demographics: React.FC<DemographicsProps> = ({ question, onAnswer, disabled }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Extract sub-questions from the demographics question
  const subQuestions = (question as any).questions || [];
  const currentSubQuestion = subQuestions[currentIndex];

  if (!currentSubQuestion) {
    // All questions answered, submit all answers
    if (Object.keys(answers).length > 0 && currentIndex > 0) {
      onAnswer(answers);
    }
    return null;
  }

  const handleSubAnswer = (answer: any) => {
    const newAnswers = {
      ...answers,
      [currentSubQuestion.variable]: answer
    };
    setAnswers(newAnswers);

    // Move to next question or complete
    if (currentIndex < subQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All questions answered
      onAnswer(newAnswers);
    }
  };

  const handleSkip = () => {
    // Skip current question
    if (currentIndex < subQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last question, submit what we have
      onAnswer(answers);
    }
  };

  return (
    <Container>
      <ProgressIndicator>
        Question {currentIndex + 1} of {subQuestions.length}
      </ProgressIndicator>
      
      <QuestionContent>{currentSubQuestion.content}</QuestionContent>
      
      {currentSubQuestion.type === 'text-input' && (
        <TextInputContainer>
          <Input
            type="text"
            placeholder={currentSubQuestion.placeholder || ''}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value) {
                  handleSubAnswer(value);
                } else {
                  handleSkip();
                }
              }
            }}
            disabled={disabled}
            autoFocus
          />
          <HelperText>Press Enter to continue or skip</HelperText>
        </TextInputContainer>
      )}
      
      {currentSubQuestion.type === 'single-choice' && currentSubQuestion.options && (
        <OptionsContainer>
          {currentSubQuestion.options.map((option: any) => (
            <OptionButton
              key={option.id || option.value}
              onClick={() => handleSubAnswer(option.value)}
              disabled={disabled}
            >
              {option.label}
            </OptionButton>
          ))}
        </OptionsContainer>
      )}
      
      {currentSubQuestion.type === 'multi-choice' && currentSubQuestion.options && (
        <MultiChoiceHandler
          options={currentSubQuestion.options}
          onSubmit={handleSubAnswer}
          disabled={disabled}
        />
      )}
      
      <SkipButton onClick={handleSkip} disabled={disabled}>
        Skip this question
      </SkipButton>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ProgressIndicator = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const QuestionContent = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.5;
`;

const TextInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  outline: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const HelperText = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const OptionButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  text-align: left;
  font-size: ${({ theme }) => theme.fontSizes.base};
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

const SkipButton = styled.button`
  align-self: flex-start;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  text-decoration: underline;
  transition: color ${({ theme }) => theme.transitions.fast};
  
  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.primary};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CheckboxOption = styled.button<{ $isSelected: boolean }>`
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
  font-size: ${({ theme }) => theme.fontSizes.base};
  width: 100%;
  
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

const ContinueButton = styled.button`
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

export default Demographics;