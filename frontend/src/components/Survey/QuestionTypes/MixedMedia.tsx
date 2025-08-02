import React, { useState } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface MixedMediaProps {
  question: Question;
  onAnswer: (answer: any) => void;
  disabled?: boolean;
}

const MixedMedia: React.FC<MixedMediaProps> = ({ question, onAnswer, disabled }) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');

  const handleOptionSelect = (optionId: string) => {
    setSelectedType(optionId);
    
    if (optionId === 'skip') {
      onAnswer({ type: 'skip' });
    } else if (optionId === 'text') {
      // Show text input
    } else {
      // For video/audio, would integrate with VideoAsk
      onAnswer({ type: optionId, videoUrl: 'placeholder-for-videoask-integration' });
    }
  };

  const handleTextSubmit = () => {
    if (textValue.trim()) {
      onAnswer({ type: 'text', text: textValue });
    }
  };

  if (selectedType === 'text') {
    return (
      <Container>
        <TextArea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder="Type your response here..."
          rows={4}
          autoFocus
        />
        <ButtonGroup>
          <BackButton onClick={() => setSelectedType(null)}>
            ← Back
          </BackButton>
          <SubmitButton 
            onClick={handleTextSubmit}
            disabled={!textValue.trim() || disabled}
          >
            Submit
          </SubmitButton>
        </ButtonGroup>
      </Container>
    );
  }

  return (
    <Container>
      <OptionsGrid>
        {question.options?.map((option) => (
          <OptionCard
            key={option.id}
            onClick={() => handleOptionSelect(option.id)}
            disabled={disabled}
          >
            <OptionIcon>{option.label.substring(0, 2)}</OptionIcon>
            <OptionLabel>{option.label}</OptionLabel>
          </OptionCard>
        ))}
      </OptionsGrid>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const OptionCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const OptionIcon = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
`;

const OptionLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: inherit;
  resize: vertical;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const BackButton = styled.button`
  background: none;
  border: 2px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const SubmitButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
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

export default MixedMedia;