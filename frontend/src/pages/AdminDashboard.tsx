import React from 'react';
import styled from 'styled-components';

const AdminDashboard: React.FC = () => {
  return (
    <Container>
      <Header>
        <Title>GHAC Admin Dashboard</Title>
      </Header>
      <Content>
        <Card>
          <CardTitle>Survey Responses</CardTitle>
          <CardContent>Response management coming soon...</CardContent>
        </Card>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.surface};
`;

const Header = styled.header`
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  margin: 0;
`;

const Content = styled.main`
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const CardTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const CardContent = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export default AdminDashboard;