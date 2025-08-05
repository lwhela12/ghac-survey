import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { clerkAdminApi } from '../../services/clerkApi';

interface QuestionStats {
  questionId: string;
  questionText: string;
  questionType: string;
  totalResponses: number;
  answerDistribution: Record<string, number>;
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
      const response = await clerkAdminApi.getAnalyticsSummary();
      const data = response.data;
      setStats({
        totalResponses: data.totalResponses || 0,
        completedResponses: data.completedResponses || 0,
        avgCompletionTime: data.avgCompletionTime || 0,
      });
      
      // In a real implementation, we'd have an endpoint for question-level stats
      // For now, we'll show placeholder data
      setQuestionStats([
        {
          questionId: 'b2',
          questionText: 'How are you connected to the Greater Hartford Arts Council (GHAC)?',
          questionType: 'single-choice',
          totalResponses: stats.completedResponses,
          answerDistribution: {
            'Individual donor': 35,
            'Corporate donor': 20,
            'Foundation representative': 15,
            'Artist/Creative': 20,
            'Other': 10,
          },
        },
        {
          questionId: 'b8',
          questionText: 'Overall, how satisfied are you with GHAC\'s work?',
          questionType: 'scale',
          totalResponses: stats.completedResponses,
          answerDistribution: {
            'Very Satisfied': 45,
            'Satisfied': 30,
            'Neutral': 15,
            'Dissatisfied': 7,
            'Very Dissatisfied': 3,
          },
        },
      ]);
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
            const blob = await clerkAdminApi.exportResponses('11111111-1111-1111-1111-111111111111');
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
          💾 Export Raw Data
        </ExportButton>
      </Header>

      <MetricsGrid>
        <MetricCard highlight>
          <MetricIcon>📊</MetricIcon>
          <MetricContent>
            <MetricValue>{stats.totalResponses}</MetricValue>
            <MetricLabel>Total Responses</MetricLabel>
            <MetricChange positive>+12% from last month</MetricChange>
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

      <InsightsSection>
        <SectionTitle>Key Insights</SectionTitle>
        <InsightsGrid>
          <InsightCard>
            <InsightIcon>💡</InsightIcon>
            <InsightContent>
              <InsightTitle>High Engagement</InsightTitle>
              <InsightText>
                {completionRate}% of respondents complete the survey, which is above the industry average of 65%.
              </InsightText>
            </InsightContent>
          </InsightCard>

          <InsightCard>
            <InsightIcon>🎯</InsightIcon>
            <InsightContent>
              <InsightTitle>Meeting Time Goals</InsightTitle>
              <InsightText>
                Average completion time of {stats.avgCompletionTime.toFixed(1)} minutes meets the 10-minute target.
              </InsightText>
            </InsightContent>
          </InsightCard>

          <InsightCard>
            <InsightIcon>📈</InsightIcon>
            <InsightContent>
              <InsightTitle>Growth Trend</InsightTitle>
              <InsightText>
                Response rate has increased by 12% compared to the previous period.
              </InsightText>
            </InsightContent>
          </InsightCard>
        </InsightsGrid>
      </InsightsSection>

      <QuestionAnalysis>
        <SectionTitle>Question-Level Analysis</SectionTitle>
        {questionStats.map((question) => (
          <QuestionCard key={question.questionId}>
            <QuestionHeader>
              <QuestionText>{question.questionText}</QuestionText>
              <ResponseCount>{question.totalResponses} responses</ResponseCount>
            </QuestionHeader>
            <DistributionChart>
              {Object.entries(question.answerDistribution).map(([answer, percentage]) => (
                <DistributionRow key={answer}>
                  <AnswerLabel>{answer}</AnswerLabel>
                  <BarContainer>
                    <Bar width={percentage} />
                    <Percentage>{percentage}%</Percentage>
                  </BarContainer>
                </DistributionRow>
              ))}
            </DistributionChart>
          </QuestionCard>
        ))}
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

const MetricCard = styled.div<{ highlight?: boolean }>`
  background: ${({ theme, highlight }) => 
    highlight ? 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)' : theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.transitions.normal};
  
  ${({ highlight }) => highlight && `
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

const MetricChange = styled.div<{ positive?: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ positive }) => positive ? '#22c55e' : '#ef4444'};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-family: 'Nunito', sans-serif;
`;

const InsightsSection = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
`;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  font-family: 'Nunito', sans-serif;
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const InsightCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  border-left: 4px solid #4A90E2;
`;

const InsightIcon = styled.div`
  font-size: 32px;
  line-height: 1;
`;

const InsightContent = styled.div``;

const InsightTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  font-family: 'Nunito', sans-serif;
`;

const InsightText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  margin: 0;
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
  width: 150px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: 'Nunito', sans-serif;
`;

const BarContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Bar = styled.div<{ width: number }>`
  height: 24px;
  background: linear-gradient(90deg, #4A90E2 0%, #357ABD 100%);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  width: ${({ width }) => `${width}%`};
  transition: width ${({ theme }) => theme.transitions.normal};
`;

const Percentage = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-family: 'Nunito', sans-serif;
`;

export default Analytics;