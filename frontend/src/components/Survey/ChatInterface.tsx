import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  startSurvey, 
  submitAnswer, 
  addBotMessage, 
  addUserMessage,
  setTyping 
} from '../../store/slices/surveySlice';
import ChatMessage from './ChatMessage';
import QuestionRenderer from './QuestionRenderer';
import TypingIndicator from './TypingIndicator';

const ChatInterface: React.FC = () => {
  const dispatch = useAppDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, currentQuestion, isTyping, isLoading, sessionId } = useAppSelector(
    (state) => state.survey
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleAnswer = async (answer: any) => {
    if (!currentQuestion || isLoading) return;

    // Don't show user message for video-autoplay or dynamic-message questions
    if (currentQuestion.type !== 'video-autoplay' && currentQuestion.type !== 'dynamic-message') {
      // Add user message for visual feedback
      const displayAnswer = formatAnswerForDisplay(answer, currentQuestion.type);
      dispatch(addUserMessage(displayAnswer));
    }

    // Show typing indicator
    dispatch(setTyping(true));

    // Submit answer
    try {
      await dispatch(submitAnswer({ 
        questionId: currentQuestion.id, 
        answer 
      }));
    } finally {
      // Stop typing indicator
      setTimeout(() => {
        dispatch(setTyping(false));
      }, 800);
    }
  };

  const formatAnswerForDisplay = (answer: any, questionType: string): string => {
    if (typeof answer === 'string') return answer;
    if (typeof answer === 'boolean') return answer ? 'Yes' : 'No';
    if (Array.isArray(answer)) return answer.join(', ');
    if (typeof answer === 'object') {
      if (answer.text) return answer.text;
      if (answer.videoUrl) return '🎥 Video response recorded';
    }
    return String(answer);
  };

  return (
    <Container>
      <MessagesContainer>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {currentQuestion && !isLoading && (
        <QuestionContainer>
          <QuestionRenderer 
            question={currentQuestion} 
            onAnswer={handleAnswer}
            disabled={isLoading}
          />
        </QuestionContainer>
      )}

      {!sessionId && !currentQuestion && (
        <StartContainer>
          <StartButton onClick={() => dispatch(startSurvey(''))}>
            🎨 Let's start
          </StartButton>
        </StartContainer>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing['2xl']};
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.full};
  }
`;

const QuestionContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.lg};
  animation: slideUp 0.3s ease-out;
`;

const StartContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  justify-content: center;
`;

const StartButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

export default ChatInterface;