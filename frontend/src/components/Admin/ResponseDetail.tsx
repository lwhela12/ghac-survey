import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { clerkAdminApi } from '../../services/clerkApi';
import { getQuestionTextFromId, formatComplexAnswer, getQuestionType } from '../../utils/questionTextMapping';

interface ResponseData {
  id: string;
  survey_id: string;
  respondent_name: string;
  started_at: string;
  completed_at: string | null;
  survey_name: string;
}

interface Answer {
  id: string;
  question_id: string;
  answer_text: string | null;
  answer_choice_ids: string[] | null;
  video_url: string | null;
  metadata: any;
  answered_at: string;
  response_id: string;
}

const ResponseDetail: React.FC = () => {
  const { responseId } = useParams<{ responseId: string }>();
  const navigate = useNavigate();
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (responseId) {
      loadResponseDetail();
    }
  }, [responseId]);

  const loadResponseDetail = async () => {
    try {
      setIsLoading(true);
      const response = await clerkAdminApi.getResponseDetail(responseId!);
      const data = response.data;
      setResponse(data.response);
      setAnswers(data.answers || []);
    } catch (error) {
      console.error('Failed to load response detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getQuestionTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'single-choice': '🔘',
      'multi-choice': '☑️',
      'text-input': '✏️',
      'scale': '📊',
      'yes-no': '👍',
      'mixed-media': '🎥',
      'ranking': '🏆',
      'contact-form': '📧',
      'demographics': '👤',
    };
    return icons[type] || '💬';
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Loading response details...</LoadingText>
      </LoadingContainer>
    );
  }

  if (!response) {
    return (
      <ErrorContainer>
        <ErrorText>Response not found</ErrorText>
        <BackButton onClick={() => navigate('/admin/responses')}>
          ← Back to Responses
        </BackButton>
      </ErrorContainer>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/admin/responses')}>
          ← Back to Responses
        </BackButton>
        <HeaderInfo>
          <Title>Response Details</Title>
          <RespondentName>{response.respondent_name || 'Anonymous'}</RespondentName>
        </HeaderInfo>
      </Header>

      <InfoSection>
        <InfoCard>
          <InfoLabel>Started</InfoLabel>
          <InfoValue>{formatDate(response.started_at)}</InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Status</InfoLabel>
          <InfoValue>
            <StatusBadge $completed={!!response.completed_at}>
              {response.completed_at ? 'Completed' : 'In Progress'}
            </StatusBadge>
          </InfoValue>
        </InfoCard>
        {response.completed_at && (
          <InfoCard>
            <InfoLabel>Completed</InfoLabel>
            <InfoValue>{formatDate(response.completed_at)}</InfoValue>
          </InfoCard>
        )}
        <InfoCard>
          <InfoLabel>Total Answers</InfoLabel>
          <InfoValue>{answers.filter(a => getQuestionType(a.question_id, a) !== 'dynamic-message').length}</InfoValue>
        </InfoCard>
      </InfoSection>

      <AnswersSection>
        <SectionTitle>Survey Answers</SectionTitle>
        {answers.filter(a => getQuestionType(a.question_id, a) !== 'dynamic-message').length === 0 ? (
          <EmptyAnswers>No meaningful answers recorded</EmptyAnswers>
        ) : (
          <AnswersList>
            {answers
              .filter(a => getQuestionType(a.question_id, a) !== 'dynamic-message')
              .map((answer, index) => (
              <AnswerCard key={answer.id}>
                <AnswerHeader>
                  <QuestionNumber>Q{index + 1}</QuestionNumber>
                  <QuestionType>
                    {getQuestionTypeIcon(getQuestionType(answer.question_id, answer))} {getQuestionType(answer.question_id, answer)}
                  </QuestionType>
                </AnswerHeader>
                <QuestionText>
                  {answer.metadata?.blockId ? getQuestionTextFromId(answer.metadata.blockId) : getQuestionTextFromId(answer.question_id)}
                </QuestionText>
                <AnswerContent>
                  {answer.video_url ? (
                    <>
                      <VideoLink href={answer.video_url} target="_blank" rel="noopener noreferrer">
                        🎥 View Video Response →
                      </VideoLink>
                      <UrlText>{answer.video_url}</UrlText>
                    </>
                  ) : (
                    <AnswerText>{formatComplexAnswer(answer)}</AnswerText>
                  )}
                </AnswerContent>
                <AnswerTime>
                  Answered: {formatDate(answer.answered_at)}
                </AnswerTime>
              </AnswerCard>
            ))}
          </AnswersList>
        )}
      </AnswersSection>
    </Container>
  );
};

const Container = styled.div`
  max-width: 1000px;
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

const ErrorContainer = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['3xl']};
`;

const ErrorText = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: 'Nunito', sans-serif;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    border-color: #4A90E2;
    color: #4A90E2;
  }
`;

const HeaderInfo = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
  font-family: 'Nunito', sans-serif;
`;

const RespondentName = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin: 0;
  font-family: 'Nunito', sans-serif;
`;

const InfoSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const InfoCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const InfoLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-family: 'Nunito', sans-serif;
`;

const InfoValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-family: 'Nunito', sans-serif;
`;

const StatusBadge = styled.span<{ $completed: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background: ${({ $completed }) => $completed ? '#22c55e20' : '#f59e0b20'};
  color: ${({ $completed }) => $completed ? '#22c55e' : '#f59e0b'};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const AnswersSection = styled.section``;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  font-family: 'Nunito', sans-serif;
`;

const EmptyAnswers = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: ${({ theme }) => theme.spacing['2xl']};
  font-family: 'Nunito', sans-serif;
`;

const AnswersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const AnswerCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all ${({ theme }) => theme.transitions.normal};
  
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const AnswerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const QuestionNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #4A90E2;
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: 'Nunito', sans-serif;
`;

const QuestionType = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: 'Nunito', sans-serif;
  text-transform: capitalize;
`;

const QuestionText = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-family: 'Nunito', sans-serif;
`;

const AnswerContent = styled.div`
  background: rgba(74, 144, 226, 0.05);
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const AnswerText = styled.p`
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: 'Nunito', sans-serif;
  white-space: pre-wrap;
  margin: 0;
`;


const VideoLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: #4A90E2;
  text-decoration: none;
  font-family: 'Nunito', sans-serif;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  
  &:hover {
    text-decoration: underline;
  }
`;

const AnswerTime = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: 'Nunito', sans-serif;
`;

const UrlText = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  word-break: break-all;
`;

export default ResponseDetail;
