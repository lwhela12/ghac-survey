import React, { Component, ReactNode } from 'react';
import styled from 'styled-components';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Survey Error:', error, errorInfo);
    // You could send this to an error reporting service
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorCard>
            <ErrorIcon>⚠️</ErrorIcon>
            <ErrorTitle>Oops! Something went wrong</ErrorTitle>
            <ErrorMessage>
              Don't worry - your progress has been saved. Please refresh the page to continue.
            </ErrorMessage>
            <ReloadButton onClick={this.handleReload}>
              Refresh Page
            </ReloadButton>
          </ErrorCard>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #FFF8F1 0%, #FFEEDE 100%);
`;

const ErrorCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 20px;
`;

const ErrorTitle = styled.h2`
  font-size: 24px;
  color: #333;
  margin-bottom: 12px;
`;

const ErrorMessage = styled.p`
  color: #666;
  line-height: 1.6;
  margin-bottom: 24px;
`;

const ReloadButton = styled.button`
  background: #0055A5;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

export default ErrorBoundary;