import React from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface DynamicMessageProps {
  question: Question;
  onAnswer: () => void;
}

const DynamicMessage: React.FC<DynamicMessageProps> = ({ question, onAnswer }) => {
  // Auto-advance after showing the message
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onAnswer();
    }, 2000); // Show message for 2 seconds before advancing

    return () => clearTimeout(timer);
  }, [onAnswer]);

  return (
    <Container>
      <Message>{question.content}</Message>
    </Container>
  );
};

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
`;

const Message = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.6;
  margin: 0;
`;

export default DynamicMessage;