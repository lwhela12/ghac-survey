import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { clerkAdminApi } from '../../services/clerkApi';

interface Response {
  id: string;
  survey_id: string;
  respondent_name: string;
  started_at: string;
  completed_at: string | null;
  survey_name: string;
  answer_count: number;
}

const ResponsesList: React.FC = () => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadResponses();
  }, [currentPage, statusFilter]);

  const loadResponses = async () => {
    try {
      setIsLoading(true);
      const response = await clerkAdminApi.getResponses(currentPage, 20);
      const data = response.data;
      setResponses(data.responses || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to load responses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatus = (response: Response) => {
    return response.completed_at ? 'Completed' : 'In Progress';
  };

  const getStatusColor = (response: Response) => {
    return response.completed_at ? '#22c55e' : '#f59e0b';
  };

  return (
    <Container>
      <Header>
        <Title>Survey Responses</Title>
        <Controls>
          <FilterSelect 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Responses</option>
            <option value="completed">Completed Only</option>
            <option value="incomplete">In Progress Only</option>
          </FilterSelect>
          <ExportButton
            onClick={async () => {
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
            }}
          >
            💾 Export CSV
          </ExportButton>
        </Controls>
      </Header>

      {isLoading ? (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading responses...</LoadingText>
        </LoadingContainer>
      ) : responses.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📭</EmptyIcon>
          <EmptyText>No responses found</EmptyText>
          <EmptySubtext>Responses will appear here as users complete the survey</EmptySubtext>
        </EmptyState>
      ) : (
        <>
          <ResponseTable>
            <TableHeader>
              <tr>
                <th>Respondent</th>
                <th>Started</th>
                <th>Status</th>
                <th>Answers</th>
                <th>Actions</th>
              </tr>
            </TableHeader>
            <TableBody>
              {responses.map((response) => (
                <TableRow key={response.id} onClick={() => navigate(`/admin/responses/${response.id}`)}>
                  <td>
                    <RespondentName>
                      {response.respondent_name || 'Anonymous'}
                    </RespondentName>
                  </td>
                  <td>{formatDate(response.started_at)}</td>
                  <td>
                    <StatusBadge color={getStatusColor(response)}>
                      {getStatus(response)}
                    </StatusBadge>
                  </td>
                  <td>{response.answer_count}</td>
                  <td>
                    <ViewButton onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/responses/${response.id}`);
                    }}>
                      View Details →
                    </ViewButton>
                  </td>
                </TableRow>
              ))}
            </TableBody>
          </ResponseTable>

          {totalPages > 1 && (
            <Pagination>
              <PageButton 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                ← Previous
              </PageButton>
              <PageInfo>
                Page {currentPage} of {totalPages}
              </PageInfo>
              <PageButton 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next →
              </PageButton>
            </Pagination>
          )}
        </>
      )}
    </Container>
  );
};

const Container = styled.div``;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  margin: 0;
  font-family: 'Nunito', sans-serif;
`;

const Controls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FilterSelect = styled.select`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #4A90E2;
  }
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
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: 'Nunito', sans-serif;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: #357ABD;
    transform: translateY(-1px);
  }
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

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['3xl']};
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const EmptyText = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  font-family: 'Nunito', sans-serif;
`;

const EmptySubtext = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  margin: 0;
  font-family: 'Nunito', sans-serif;
`;

const ResponseTable = styled.table`
  width: 100%;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const TableHeader = styled.thead`
  background: rgba(74, 144, 226, 0.05);
  
  th {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
    text-align: left;
    font-family: 'Nunito', sans-serif;
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: rgba(74, 144, 226, 0.03);
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  td {
    padding: ${({ theme }) => theme.spacing.lg};
    font-family: 'Nunito', sans-serif;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const RespondentName = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const StatusBadge = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background: ${({ color }) => `${color}20`};
  color: ${({ color }) => color};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const ViewButton = styled.button`
  background: transparent;
  border: 1px solid #4A90E2;
  color: #4A90E2;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: #4A90E2;
    color: white;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xl};
  margin-top: ${({ theme }) => theme.spacing['2xl']};
`;

const PageButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: 'Nunito', sans-serif;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover:not(:disabled) {
    border-color: #4A90E2;
    color: #4A90E2;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: 'Nunito', sans-serif;
`;

export default ResponsesList;