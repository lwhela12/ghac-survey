// frontend/src/components/Survey/QuestionTypes/TextInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface TextInputProps {
  question: Question;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({ question, onAnswer, disabled }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus when component mounts
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() || !question.required) {
      onAnswer(value);
      setValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <InputWrapper>
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={question.placeholder || 'Type your answer...'}
            disabled={disabled}
          />
          <SubmitButton 
            type="submit" 
            disabled={disabled || (question.required && !value.trim())}
            $hasValue={!!value.trim()}
          >
            <SendIcon>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path 
                  d="M2 10L17 10M17 10L11 4M17 10L11 16" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </SendIcon>
          </SubmitButton>
        </InputWrapper>
        <HintText>Press Enter to send</HintText>
      </Form>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
`;

const Form = styled.form`
  width: 100%;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: ${({ theme }) => theme.spacing.xs};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: none;
  background: transparent;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.primary};
  
  &:focus {
    outline: none;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.light};
  }
`;

const SubmitButton = styled.button<{ $hasValue: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${({ theme, $hasValue }) => 
    $hasValue ? theme.colors.primary : theme.colors.border};
  color: ${({ theme, $hasValue }) => 
    $hasValue ? theme.colors.text.inverse : theme.colors.text.light};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text.inverse};
    transform: scale(1.05);
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const SendIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HintText = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.light};
  margin-top: ${({ theme }) => theme.spacing.xs};
  text-align: center;
  opacity: 0.7;
`;

export default TextInput;