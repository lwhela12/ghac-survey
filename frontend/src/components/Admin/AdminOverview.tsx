import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Card } from './ui/Card';
import QuestionBreakdown from './QuestionBreakdown';
import { IconBarChart, IconCheckCircle, IconPercent, IconClock } from './ui/icons';
import { clerkAdminApi } from '../../services/clerkApi';

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalResponses: 0,
    completedResponses: 0,
    avgCompletionTime: 0,
    demographicsOptInRate: 0,
    avgDonation: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await clerkAdminApi.getAnalyticsSummary();
      const data = response.data;
      setStats({
        totalResponses: data.totalResponses || 0,
        completedResponses: data.completedResponses || 0,
        avgCompletionTime: data.avgCompletionTime || 0,
        demographicsOptInRate: data.demographicsOptInRate || 0,
        avgDonation: data.avgDonation || 0,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completionRate = stats.totalResponses > 0 
    ? ((stats.completedResponses / stats.totalResponses) * 100).toFixed(1)
    : '0.0';
  const demoOptIn = (stats.demographicsOptInRate * 100).toFixed(1);
  const formatCurrency = (n: number) => n > 0 ? `$${n.toLocaleString('en-US')}` : '—';

  return (
    <Container>
      <PageHeader>
        <Title>Dashboard Overview</Title>
        <Subtitle>GHAC Donor Survey Analytics</Subtitle>
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <StatIcon><IconBarChart size={32} /></StatIcon>
          <StatContent>
            <StatValue>{isLoading ? '...' : stats.totalResponses}</StatValue>
            <StatLabel>Starts</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon><IconCheckCircle size={32} /></StatIcon>
          <StatContent>
            <StatValue>{isLoading ? '...' : stats.completedResponses}</StatValue>
            <StatLabel>Completes</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon><IconPercent size={32} /></StatIcon>
          <StatContent>
            <StatValue>{isLoading ? '...' : `${completionRate}%`}</StatValue>
            <StatLabel>Completion Rate</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon><IconPercent size={32} /></StatIcon>
          <StatContent>
            <StatValue>{isLoading ? '...' : `${demoOptIn}%`}</StatValue>
            <StatLabel>Demographics Opt-in</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon><IconClock size={32} /></StatIcon>
          <StatContent>
            <StatValue>
              {isLoading ? '...' : formatCurrency(stats.avgDonation)}
            </StatValue>
            <StatLabel>Average Donation</StatLabel>
          </StatContent>
        </StatCard>
      </StatsGrid>

      {/* Quick Actions removed per request; header now holds actions */}

      <QuestionBreakdown />
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
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
`;

const StatCard = styled(Card)`
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
  line-height: 1;
  color: ${({ theme }) => theme.colors.primary};
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const StatContent = styled.div``;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

// Quick Actions styles removed

export default AdminOverview;
