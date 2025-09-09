import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const ClerkSignUp: React.FC = () => {
  return (
    <Container>
      <BackLink to="/">← Back to Survey</BackLink>
      <SignUpWrapper>
        <Title>Create Admin Account</Title>
        <SignUp 
          path="/admin/sign-up"
          routing="path"
          afterSignUpUrl="/admin"
          signInUrl="/admin/sign-in"
          fallbackRedirectUrl="/admin"
          appearance={{
            elements: {
              rootBox: {
                margin: '0 auto',
              },
              card: {
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
              },
              headerTitle: {
                display: 'none',
              },
              formButtonPrimary: {
                backgroundColor: '#0055A5',
                '&:hover': {
                  backgroundColor: '#003d7a',
                },
              },
            },
          }}
        />
      </SignUpWrapper>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const BackLink = styled(Link)`
  position: absolute;
  top: ${({ theme }) => theme.spacing.xl};
  left: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: color ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SignUpWrapper = styled.div`
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export default ClerkSignUp;
