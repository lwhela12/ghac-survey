import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
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
          💾 Export Raw Data
        </ExportButton>
      </Header>

      <MetricsGrid>
        <MetricCard $highlight>
          <MetricIcon>📊</MetricIcon>
          <MetricContent>
            <MetricValue>{stats.totalResponses}</MetricValue>
            <MetricLabel>Total Responses</MetricLabel>
          </MetricContent>
        </MetricCard>

        <MetricCard>
          <MetricIcon>✅</MetricIcon>
          <MetricContent>
            <MetricValue>{completionRate}%</MetricValue>
            <MetricLabel>Completion Rate</MetricLabel>
            <MetricSubtext>{stats.completedResponses} completed</MetricSubtext>
          </MetricContent>
        </MetricCard>

        <MetricCard>
          <MetricIcon>⏱️</MetricIcon>
          <MetricContent>
            <MetricValue>{stats.avgCompletionTime.toFixed(1)} min</MetricValue>
            <MetricLabel>Avg. Time to Complete</MetricLabel>
            <MetricSubtext>Target: Under 10 min</MetricSubtext>
          </MetricContent>
        </MetricCard>

        <MetricCard>
          <MetricIcon>📉</MetricIcon>
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
            <EmptyStateIcon>📊</EmptyStateIcon>
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
                          <Bar width={data.percentage} />
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
  border-top-color: #4A90E2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: 'Nunito', sans-serif;
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
  font-family: 'Nunito', sans-serif;
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: #4A90E2;
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: 'Nunito', sans-serif;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: #357ABD;
    transform: translateY(-1px);
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
`;

const MetricCard = styled.div<{ $highlight?: boolean }>`
  background: ${({ theme, $highlight }) => 
    $highlight ? 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)' : theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.transitions.normal};
  
  ${({ $highlight }) => $highlight && `
    color: white;
    
    div {
      color: white !important;
    }
  `}
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const MetricIcon = styled.div`
  font-size: 48px;
  line-height: 1;
`;

const MetricContent = styled.div``;

const MetricValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-family: 'Nunito', sans-serif;
`;

const MetricLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-family: 'Nunito', sans-serif;
`;

const MetricSubtext = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  opacity: 0.8;
  font-family: 'Nunito', sans-serif;
`;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  font-family: 'Nunito', sans-serif;
`;

const QuestionAnalysis = styled.section``;

const QuestionCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
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
  font-family: 'Nunito', sans-serif;
`;

const ResponseCount = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: 'Nunito', sans-serif;
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
  font-family: 'Nunito', sans-serif;
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

const Bar = styled.div<{ width: number }>`
  height: 28px;
  background: ${({ width }) => {
    if (width > 60) return 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)';
    if (width > 30) return 'linear-gradient(90deg, #4A90E2 0%, #357ABD 100%)';
    if (width > 10) return 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)';
    return 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)';
  }};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  width: ${({ width }) => `${Math.max(width, 2)}%`};
  min-width: 2%;
  transition: width ${({ theme }) => theme.transitions.normal};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const PercentageContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 80px;
`;

const Percentage = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-family: 'Nunito', sans-serif;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['3xl']};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const EmptyStateIcon = styled.div`
  font-size: 64px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const EmptyStateText = styled.p`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  font-family: 'Nunito', sans-serif;
`;

const EmptyStateSubtext = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  margin: 0;
  font-family: 'Nunito', sans-serif;
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
  font-family: 'Nunito', sans-serif;
`;

export default Analytics;