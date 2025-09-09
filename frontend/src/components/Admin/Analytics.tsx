import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Card } from './ui/Card';
import { PrimaryButton } from './ui/Buttons';
import { IconFileDown, IconBarChart } from './ui/icons';
import { IconCheckCircle, IconClock, IconActivity } from './ui/icons';
import { clerkAdminApi } from '../../services/clerkApi';

interface QuestionStats {
  questionId: string;
  questionText: string;
  questionType: string;
  totalResponses: number;
  answerDistribution: Record<string, {
    count: number;
    percentage: number;
  }>;
}

const Analytics: React.FC = () => {
  const [stats, setStats] = useState({
    totalResponses: 0,
    completedResponses: 0,
    avgCompletionTime: 0,
  });
  const [questionStats, setQuestionStats] = useState<QuestionStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Load summary statistics
      const summaryResponse = await clerkAdminApi.getAnalyticsSummary();
      const summaryData = summaryResponse.data;
      setStats({
        totalResponses: summaryData.totalResponses || 0,
        completedResponses: summaryData.completedResponses || 0,
        avgCompletionTime: summaryData.avgCompletionTime || 0,
      });
      
      // Load question-level statistics
      const questionResponse = await clerkAdminApi.getQuestionStats();
      const questionData = questionResponse.data;
      
      if (questionData.questionStats && questionData.questionStats.length > 0) {
        setQuestionStats(questionData.questionStats);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completionRate = stats.totalResponses > 0 
    ? ((stats.completedResponses / stats.totalResponses) * 100).toFixed(1)
    : 0;

  const dropoffRate = stats.totalResponses > 0
    ? (((stats.totalResponses - stats.completedResponses) / stats.totalResponses) * 100).toFixed(1)
    : 0;

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Loading analytics...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Survey Analytics</Title>
        <ExportButton onClick={async () => {
          try {
            const response = await clerkAdminApi.exportResponses('11111111-1111-1111-1111-111111111111');
            const url = window.URL.createObjectURL(response.data);
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
          <IconFileDown /> Export Raw Data
        </ExportButton>
      </Header>

      <MetricsGrid>
        <MetricCard>
          <MetricIcon><IconBarChart /></MetricIcon>
          <MetricContent>
            <MetricValue>{stats.totalResponses}</MetricValue>
            <MetricLabel>Total Responses</MetricLabel>
          </MetricContent>
        </MetricCard>

        <MetricCard>
          <MetricIcon><IconCheckCircle /></MetricIcon>
          <MetricContent>
            <MetricValue>{completionRate}%</MetricValue>
            <MetricLabel>Completion Rate</MetricLabel>
            <MetricSubtext>{stats.completedResponses} completed</MetricSubtext>
          </MetricContent>
        </MetricCard>

        <MetricCard>
          <MetricIcon><IconClock /></MetricIcon>
          <MetricContent>
            <MetricValue>{stats.avgCompletionTime.toFixed(1)} min</MetricValue>
            <MetricLabel>Avg. Time to Complete</MetricLabel>
            <MetricSubtext>Target: Under 10 min</MetricSubtext>
          </MetricContent>
        </MetricCard>

        <MetricCard>
          <MetricIcon><IconActivity /></MetricIcon>
          <MetricContent>
            <MetricValue>{dropoffRate}%</MetricValue>
            <MetricLabel>Drop-off Rate</MetricLabel>
            <MetricSubtext>{stats.totalResponses - stats.completedResponses} incomplete</MetricSubtext>
          </MetricContent>
        </MetricCard>
      </MetricsGrid>

      <QuestionAnalysis>
        <SectionTitle>Question-Level Analysis</SectionTitle>
        {questionStats.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon><IconBarChart /></EmptyStateIcon>
            <EmptyStateText>No response data available yet.</EmptyStateText>
            <EmptyStateSubtext>Analytics will appear here once surveys are completed.</EmptyStateSubtext>
          </EmptyState>
        ) : (
          questionStats
            .filter(q => q.totalResponses > 0)
            .sort((a, b) => b.totalResponses - a.totalResponses)
            .slice(0, 10) // Show top 10 questions by response count
            .map((question) => (
              <QuestionCard key={question.questionId}>
                <QuestionHeader>
                  <div>
                    <QuestionBadge type={question.questionType}>
                      {question.questionType.replace('-', ' ')}
                    </QuestionBadge>
                    <QuestionText>{question.questionText}</QuestionText>
                  </div>
                  <ResponseCount>{question.totalResponses} responses</ResponseCount>
                </QuestionHeader>
                <DistributionChart>
                  {Object.entries(question.answerDistribution)
                    .sort((a, b) => b[1].percentage - a[1].percentage)
                    .map(([answer, data]) => (
                      <DistributionRow key={answer}>
                        <AnswerLabel title={answer}>{answer}</AnswerLabel>
                        <BarContainer>
                          <BarTrack>
                            <BarFill width={data.percentage} />
                          </BarTrack>
                          <PercentageContainer>
                            <Percentage>{data.percentage}%</Percentage>
                            <ResponseCount>({data.count})</ResponseCount>
                          </PercentageContainer>
                        </BarContainer>
                      </DistributionRow>
                    ))}
                </DistributionChart>
              </QuestionCard>
            ))
        )}
      </QuestionAnalysis>
    </Container>
  );
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing['3xl']};
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  margin: 0;
`;

const ExportButton = styled(PrimaryButton)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
`;

const MetricCard = styled(Card)`
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.transitions.normal};
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const MetricIcon = styled.div`
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  svg { width: 32px; height: 32px; }
`;

const MetricContent = styled.div``;

const MetricValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const MetricLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const MetricSubtext = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  opacity: 0.8;
`;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
`;

const QuestionAnalysis = styled.section``;

const QuestionCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const QuestionText = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin: 0;
  flex: 1;
`;

const ResponseCount = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const DistributionChart = styled.div``;

const DistributionRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const AnswerLabel = styled.div`
  min-width: 200px;
  max-width: 300px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: ${({ theme }) => theme.spacing.md};
`;

const BarContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  position: relative;
`;

const BarTrack = styled.div`
  position: relative;
  flex: 1;
  height: 12px;
  background: #EDF2F7; /* neutral light track */
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
`;

const BarFill = styled.div<{ width: number }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  /* Single, consistent Nesolagus green gradient */
  background: linear-gradient(135deg, #64B37A 0%, #2F6D49 100%);
  width: ${({ width }) => `${Math.max(width, 2)}%`};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  transition: width ${({ theme }) => theme.transitions.normal};
`;

const PercentageContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 80px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Percentage = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['3xl']};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const EmptyStateIcon = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  svg { width: 48px; height: 48px; }
`;

const EmptyStateText = styled.p`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

const EmptyStateSubtext = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  margin: 0;
`;

const QuestionBadge = styled.span<{ type: string }>`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background: ${({ type }) => {
    switch (type) {
      case 'single-choice': return '#e0f2fe';
      case 'multi-choice': return '#f0fdf4';
      case 'yes-no': return '#fef3c7';
      case 'quick-reply': return '#ede9fe';
      default: return '#f3f4f6';
    }
  }};
  color: ${({ type }) => {
    switch (type) {
      case 'single-choice': return '#0369a1';
      case 'multi-choice': return '#166534';
      case 'yes-no': return '#a16207';
      case 'quick-reply': return '#6b21a8';
      default: return '#4b5563';
    }
  }};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-transform: uppercase;
  margin-right: ${({ theme }) => theme.spacing.md};
`;

export default Analytics;
