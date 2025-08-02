import React, { useState } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface TextInputProps {
  question: Question;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({ question, onAnswer, disabled }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() || !question.required) {
      onAnswer(value);
      setValue('');
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={question.placeholder || 'Type your answer...'}
        disabled={disabled}
        autoFocus
      />
      <SubmitButton 
        type="submit" 
        disabled={disabled || (question.required && !value.trim())}
      >
        Send
      </SubmitButton>
    </Form>
  );
};

const Form = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Input = styled.input`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  transition: border-color ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.surface};
    cursor: not-allowed;
  }
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
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary}dd;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default TextInput;