import React from 'react';
import styled from 'styled-components';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <Container>
      <ContentWrapper>
        <MainTitle>Welcome to the Studio</MainTitle>
        
        <Subtitle>
          <LightText>A conversation with </LightText>
          <HighlightedName>Amanda Roy</HighlightedName>
          <LightText>, CEO</LightText>
          <br />
          <LightText>of the Greater Hartford Arts Council</LightText>
        </Subtitle>
        
        <StartButton onClick={onStart}>
          <ButtonText>Let's Chat!</ButtonText>
        </StartButton>
      </ContentWrapper>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
  position: relative;
  background: transparent;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xl};
  max-width: 800px;
  width: 100%;
  text-align: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: ${({ theme }) => theme.spacing.lg};
  }
`;

const MainTitle = styled.h1`
  color: #0055A5;
  font-size: 96px;
  font-family: 'Playfair Display', 'Georgia', serif;
  font-weight: 700;
  line-height: 1.1;
  margin: 0;
  letter-spacing: -3px;
  font-style: normal;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 72px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 48px;
    letter-spacing: -1px;
  }
`;

const Subtitle = styled.div`
  font-size: 36px;
  line-height: 1.3;
  margin-top: -${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 28px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 20px;
    margin-top: 0;
  }
`;

const LightText = styled.span`
  color: #0055A5;
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  letter-spacing: -0.5px;
`;

const HighlightedName = styled.span`
  color: #B2BB1C;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  letter-spacing: -0.5px;
`;

const StartButton = styled.button`
  background: #0055A5;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 42px;
  border: none;
  padding: 24px 60px;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.medium};
  margin-top: ${({ theme }) => theme.spacing.lg};
  
  &:hover {
    background: #B2BB1C;
    transform: translateY(-2px);
    box-shadow: 0px 6px 8px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.25);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 20px 48px;
    width: 100%;
    max-width: 320px;
  }
`;

const ButtonText = styled.span`
  color: #FFF8F1;
  font-size: 32px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 24px;
  }
`;

export default WelcomeScreen;