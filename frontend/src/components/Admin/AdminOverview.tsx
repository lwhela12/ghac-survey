import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { adminApi } from '../../services/api';

const AdminOverview: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalResponses: 0,
    completedResponses: 0,
    avgCompletionTime: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getAnalytics('11111111-1111-1111-1111-111111111111');
      setStats({
        totalResponses: parseInt(data.total_responses) || 0,
        completedResponses: parseInt(data.completed_responses) || 0,
        avgCompletionTime: parseFloat(data.avg_completion_time_minutes) || 0,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completionRate = stats.totalResponses > 0 
    ? ((stats.completedResponses / stats.totalResponses) * 100).toFixed(1)
    : 0;

  return (
    <Container>
      <PageHeader>
        <Title>Dashboard Overview</Title>
        <Subtitle>GHAC Donor Survey Analytics</Subtitle>
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <StatIcon>📊</StatIcon>
          <StatContent>
            <StatValue>{isLoading ? '...' : stats.totalResponses}</StatValue>
            <StatLabel>Total Responses</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon>✅</StatIcon>
          <StatContent>
            <StatValue>{isLoading ? '...' : stats.completedResponses}</StatValue>
            <StatLabel>Completed Surveys</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon>📈</StatIcon>
          <StatContent>
            <StatValue>{isLoading ? '...' : `${completionRate}%`}</StatValue>
            <StatLabel>Completion Rate</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon>⏱️</StatIcon>
          <StatContent>
            <StatValue>
              {isLoading ? '...' : `${stats.avgCompletionTime.toFixed(1)} min`}
            </StatValue>
            <StatLabel>Avg. Completion Time</StatLabel>
          </StatContent>
        </StatCard>
      </StatsGrid>

      <ActionsSection>
        <SectionTitle>Quick Actions</SectionTitle>
        <ActionsGrid>
          <ActionButton onClick={() => navigate('/admin/responses')}>
            <ActionIcon>📝</ActionIcon>
            <ActionText>
              <ActionTitle>View Responses</ActionTitle>
              <ActionDesc>Browse all survey responses</ActionDesc>
            </ActionText>
          </ActionButton>

          <ActionButton onClick={() => navigate('/admin/analytics')}>
            <ActionIcon>📊</ActionIcon>
            <ActionText>
              <ActionTitle>Analytics</ActionTitle>
              <ActionDesc>Detailed survey analytics</ActionDesc>
            </ActionText>
          </ActionButton>

          <ActionButton onClick={async () => {
            try {
              const blob = await adminApi.exportResponses('11111111-1111-1111-1111-111111111111');
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ghac-survey-export-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } catch (error) {
              console.error('Export failed:', error);
              alert('Failed to export data. Please try again.');
            }
          }}>
            <ActionIcon>💾</ActionIcon>
            <ActionText>
              <ActionTitle>Export Data</ActionTitle>
              <ActionDesc>Download responses as CSV</ActionDesc>
            </ActionText>
          </ActionButton>
        </ActionsGrid>
      </ActionsSection>
    </Container>
  );
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  font-family: 'Nunito', sans-serif;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin: 0;
  font-family: 'Nunito', sans-serif;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.transitions.normal};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const StatIcon = styled.div`
  font-size: 48px;
  line-height: 1;
`;

const StatContent = styled.div``;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-family: 'Nunito', sans-serif;
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: 'Nunito', sans-serif;
`;

const ActionsSection = styled.section``;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  font-family: 'Nunito', sans-serif;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ActionButton = styled.button`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  text-decoration: none;
  color: inherit;
  transition: all ${({ theme }) => theme.transitions.normal};
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  cursor: pointer;
  border: 2px solid transparent;
  
  &:hover {
    border-color: #4A90E2;
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const ActionIcon = styled.div`
  font-size: 36px;
  line-height: 1;
`;

const ActionText = styled.div``;

const ActionTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-family: 'Nunito', sans-serif;
`;

const ActionDesc = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: 'Nunito', sans-serif;
`;

export default AdminOverview;