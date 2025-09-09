import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { clerkAdminApi } from '../../services/clerkApi';
import { Card } from './ui/Card';

type Dist = Record<string, { count: number; percentage: number }>;

interface QuestionStat {
  questionId: string;
  questionText: string;
  questionType: string;
  totalResponses: number;
  answerDistribution: Dist;
  semanticSummary?: Record<string, number>;
}

const QuestionBreakdown: React.FC = () => {
  const [stats, setStats] = useState<QuestionStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await clerkAdminApi.getQuestionStats();
        setStats(res.data.questionStats || []);
      } catch (e) {
        setStats([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return null;

  return (
    <Section>
      <SectionTitle>Question Responses</SectionTitle>
      <Grid>
        {stats
          .filter(q => q.totalResponses > 0)
          .map(q => (
            <QCard key={q.questionId}>
              <Header>
                <QTitle>{q.questionText}</QTitle>
                <QMeta>{q.totalResponses} responses</QMeta>
              </Header>

              {q.questionType === 'ranking' && (
                <RankingHint>
                  Weighted by rank (1st = N, 2nd = N-1, …). Percentage shows share of total points.
                </RankingHint>
              )}

              {q.questionType === 'mixed-media' && (
                <MediaSummary>
                  {['video','audio','text','skip'].map(key => (
                    <MediaChip key={key}>
                      <MediaLabel>{key}</MediaLabel>
                      <MediaValue>{q.answerDistribution[key]?.count || 0}</MediaValue>
                    </MediaChip>
                  ))}
                </MediaSummary>
              )}

              {q.questionType === 'semantic-differential' && q.semanticSummary && (
                <SemanticList>
                  {[
                    { key: 'traditional_innovative', left: 'Traditional', right: 'Innovative' },
                    { key: 'corporate_community', left: 'Corporate', right: 'Community-focused' },
                    { key: 'transactional_relationship', left: 'Transactional', right: 'Relationship-based' },
                    { key: 'behind_visible', left: 'Behind the scenes', right: 'Visible catalyst' },
                    { key: 'exclusive_inclusive', left: 'Exclusive', right: 'Inclusive' },
                  ].map(scale => {
                    const avg = q.semanticSummary![scale.key] || 0;
                    const pct = Math.max(0, Math.min(100, ((avg - 1) / 4) * 100));
                    return (
                      <SemanticRow key={scale.key}>
                        <Side>{scale.left}</Side>
                        <SemanticTrack>
                          <SemanticFill style={{ left: `${pct}%` }} />
                        </SemanticTrack>
                        <Side $align="right">{scale.right}</Side>
                      </SemanticRow>
                    );
                  })}
                </SemanticList>
              )}

              {q.questionType !== 'mixed-media' && q.questionType !== 'semantic-differential' && (
                <DistList>
                  {Object.entries(q.answerDistribution)
                    .sort((a,b) => b[1].count - a[1].count)
                    .map(([label, data]) => (
                      <DistRow key={label}>
                        <AnswerLabel title={label}>{label}</AnswerLabel>
                        <BarTrack>
                          <BarFill style={{ width: `${Math.max(data.percentage, 2)}%` }} />
                        </BarTrack>
                        <Pct>{data.percentage}%</Pct>
                      </DistRow>
                    ))}
                </DistList>
              )}
            </QCard>
          ))}
      </Grid>
    </Section>
  );
};

const Section = styled.section``;
const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const QCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`;

const QTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin: 0;
  flex: 1;
`;

const QMeta = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const RankingHint = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  background: #F7FAFC;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
`;

const DistList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const DistRow = styled.div`
  display: grid;
  grid-template-columns: minmax(160px, 280px) 1fr auto;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
`;

const AnswerLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BarTrack = styled.div`
  position: relative;
  flex: 1;
  height: 12px;
  background: #EDF2F7;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
`;

const BarFill = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: linear-gradient(135deg, #64B37A 0%, #2F6D49 100%);
  border-radius: ${({ theme }) => theme.borderRadius.full};
`;

const Pct = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const MediaSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const MediaChip = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: #F7FAFC;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const MediaLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const MediaValue = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const SemanticList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SemanticRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
`;

const Side = styled.span<{ $align?: 'right' }>`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  text-align: ${({ $align }) => ($align === 'right' ? 'right' : 'left')};
`;

const SemanticTrack = styled.div`
  position: relative;
  height: 8px;
  background: #EDF2F7;
  border-radius: ${({ theme }) => theme.borderRadius.full};
`;

const SemanticFill = styled.div`
  position: absolute;
  top: -3px;
  width: 6px;
  height: 14px;
  background: linear-gradient(135deg, #64B37A 0%, #2F6D49 100%);
  border-radius: ${({ theme }) => theme.borderRadius.full};
  transform: translateX(-50%);
`;

export default QuestionBreakdown;
