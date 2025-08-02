import React from 'react';
import styled from 'styled-components';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <Container>
      <Label>Progress: {Math.round(progress)}%</Label>
      <BarContainer>
        <BarFill $progress={progress} />
      </BarContainer>
    </Container>
  );
};

const Container = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const BarContainer = styled.div`
  width: 100%;
  height: 6px;
  background-color: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
`;

const BarFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${({ $progress }) => $progress}%;
  background-color: ${({ theme }) => theme.colors.secondary};
  transition: width ${({ theme }) => theme.transitions.normal};
  border-radius: ${({ theme }) => theme.borderRadius.full};
`;

export default ProgressBar;