import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import ChatInterface from '../components/Survey/ChatInterface';
import ProgressBar from '../components/Survey/ProgressBar';
import { startSurvey, initializeSurvey } from '../store/slices/surveySlice';

const SurveyPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sessionId, progress, messages } = useAppSelector((state) => state.survey);

  useEffect(() => {
    // Initialize survey with welcome message
    // The initializeSurvey action handles duplicate prevention internally
    dispatch(initializeSurvey());
  }, [dispatch]);

  return (
    <Container>
      <Header>
        <Logo>
          <LogoText>GHAC</LogoText>
          <LogoSubtext>Greater Hartford Arts Council</LogoSubtext>
        </Logo>
        <ProgressBar progress={progress} />
      </Header>
      <ChatInterface />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Header = styled.header`
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Logo = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const LogoText = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const LogoSubtext = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

export default SurveyPage;