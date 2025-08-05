// frontend/src/pages/SurveyPage.tsx
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import ChatInterface from '../components/Survey/ChatInterface';
import ProgressBar from '../components/Survey/ProgressBar';
import { initializeSurvey } from '../store/slices/surveySlice';
import ghacLogo from '../assets/images/GHAC.jpg';

const SurveyPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sessionId, progress } = useAppSelector((state) => state.survey);

  useEffect(() => {
    dispatch(initializeSurvey());
  }, [dispatch]);

  return (
    <Container>
      <Header>
        <HeaderBackground />
        <HeaderContent>
          <LogoContainer>
            <LogoImage />
          </LogoContainer>
          {sessionId && <ProgressBar progress={progress} />}
        </HeaderContent>
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
  position: relative;
  background: linear-gradient(135deg, #FFF8F1 0%, #FFEEDE 100%);
  border-bottom: 2px solid rgba(74, 144, 226, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
`;

const HeaderBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.03;
  background-image: 
    radial-gradient(circle at 20% 50%, #4A90E2 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, #B2BB1C 0%, transparent 50%);
  pointer-events: none;
`;

const HeaderContent = styled.div`
  position: relative;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const LogoImage = styled.div`
  width: 216px;
  height: 108px;
  background-image: url(${ghacLogo});
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  
  /* Blend white background with header */
  mix-blend-mode: multiply;
  filter: contrast(1.1);
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 180px;
    height: 90px;
  }
`;

export default SurveyPage;