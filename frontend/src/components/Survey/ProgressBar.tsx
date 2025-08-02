// frontend/src/components/Survey/ProgressBar.tsx
import React from 'react';
import styled, { keyframes } from 'styled-components';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const getMessage = () => {
    if (progress < 25) return "Just getting started! 🎨";
    if (progress < 50) return "You're doing great! 🌟";
    if (progress < 75) return "Almost there! 💫";
    if (progress < 100) return "Final stretch! 🎯";
    return "Complete! 🎉";
  };

  return (
    <Container>
      <ProgressInfo>
        <Label>{getMessage()}</Label>
        <Percentage>{Math.round(progress)}%</Percentage>
      </ProgressInfo>
      <BarContainer>
        <BarBackground />
        <BarFill $progress={progress}>
          <BarGlow />
          <BarShimmer />
        </BarFill>
        <Milestones>
          <Milestone $active={progress >= 25} $position={25} title="25%" />
          <Milestone $active={progress >= 50} $position={50} title="50%" />
          <Milestone $active={progress >= 75} $position={75} title="75%" />
        </Milestones>
      </BarContainer>
    </Container>
  );
};

const shimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
`;

const pulse = keyframes`
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
`;

const Container = styled.div`
  width: 100%;
  max-width: 600px;
  padding: 0 ${({ theme }) => theme.spacing.sm};
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: #4A90E2;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-family: 'Nunito', sans-serif;
`;

const Percentage = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: #4A90E2;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: 'Nunito', sans-serif;
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const BarContainer = styled.div`
  position: relative;
  width: 100%;
  height: 12px;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const BarBackground = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(74, 144, 226, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
`;

const BarFill = styled.div<{ $progress: number }>`
  position: absolute;
  height: 100%;
  width: ${({ $progress }) => $progress}%;
  background: linear-gradient(90deg, #4A90E2 0%, #357ABD 50%, #4A90E2 100%);
  background-size: 200% 100%;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  transition: width ${({ theme }) => theme.transitions.slow} ease-out;
  overflow: hidden;
  box-shadow: 
    0 2px 8px rgba(74, 144, 226, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.4);
`;

const BarGlow = styled.div`
  position: absolute;
  top: 0;
  right: -10px;
  width: 20px;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
  filter: blur(4px);
  animation: ${pulse} 2s ease-in-out infinite;
`;

const BarShimmer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: ${shimmer} 3s linear infinite;
`;

const Milestones = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
`;

const Milestone = styled.div<{ $active: boolean; $position: number }>`
  position: absolute;
  left: ${({ $position }) => $position}%;
  width: 16px;
  height: 16px;
  background: ${({ $active }) => 
    $active ? '#4A90E2' : '#FFF8F1'};
  border: 3px solid ${({ $active }) => 
    $active ? '#4A90E2' : 'rgba(74, 144, 226, 0.3)'};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  transform: translateX(-50%) scale(${({ $active }) => $active ? 1 : 0.8});
  transition: all ${({ theme }) => theme.transitions.normal};
  cursor: pointer;
  
  ${({ $active }) => $active && `
    box-shadow: 
      0 0 0 6px rgba(74, 144, 226, 0.15),
      0 2px 8px rgba(74, 144, 226, 0.3);
  `}
  
  &::after {
    content: '';
    position: absolute;
    inset: -8px;
    border-radius: ${({ theme }) => theme.borderRadius.full};
  }
`;

export default ProgressBar;