import React, { useState } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';
import VideoRecorder from './VideoRecorder';

interface MixedMediaProps {
  question: Question;
  onAnswer: (answer: any) => void;
  disabled?: boolean;
}

const MixedMedia: React.FC<MixedMediaProps> = ({ question, onAnswer, disabled }) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleOptionSelect = (optionId: string) => {
    setSelectedType(optionId);
    
    if (optionId === 'skip') {
      onAnswer({ type: 'skip' });
    } else if (optionId === 'text') {
      // Show text input
    } else if (optionId === 'video' || optionId === 'audio') {
      // Show video recorder embedded
      setIsRecording(true);
    }
  };

  const handleVideoComplete = (videoUrl: string) => {
    onAnswer({ 
      type: selectedType, 
      videoUrl,
      recordedAt: new Date().toISOString()
    });
  };

  const handleVideoCancel = () => {
    setIsRecording(false);
    setSelectedType(null);
  };

  const handleTextSubmit = () => {
    if (textValue.trim()) {
      onAnswer({ type: 'text', text: textValue });
    }
  };

  // Show video recorder if selected
  if (isRecording && (selectedType === 'video' || selectedType === 'audio')) {
    return (
      <Container>
        <VideoRecorder
          question={question.content}
          onRecordingComplete={handleVideoComplete}
          onCancel={handleVideoCancel}
          maxDuration={90}
        />
      </Container>
    );
  }

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
            <OptionIcon>
              {option.id === 'video' ? '🎥' : 
               option.id === 'audio' ? '🎤' : 
               option.id === 'text' ? '✏️' : 
               option.id === 'skip' ? '⏭️' : '💬'}
            </OptionIcon>
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
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  background: #4A90E2;
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};
  font-family: 'Nunito', sans-serif;
  
  &:hover:not(:disabled) {
    background: #357ABD;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const OptionIcon = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.primary}10;
  color: ${({ theme }) => theme.colors.primary};
`;

const OptionLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: white;
  text-align: center;
`;

const SubLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.normal};
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: 'Nunito', sans-serif;
  resize: vertical;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  background: rgba(217, 247, 255, 0.3);
  
  &:focus {
    outline: none;
    border-color: #4A90E2;
    background: white;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const BackButton = styled.button`
  background: transparent;
  border: 2px solid #4A90E2;
  color: #4A90E2;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.base};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-family: 'Nunito', sans-serif;
  
  &:hover {
    background: #4A90E2;
    color: white;
  }
`;

const SubmitButton = styled.button`
  background: #4A90E2;
  color: white;
  border: none;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-family: 'Nunito', sans-serif;
  
  &:hover:not(:disabled) {
    background: #357ABD;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default MixedMedia;