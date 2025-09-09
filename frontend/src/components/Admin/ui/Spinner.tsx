// frontend/src/components/Admin/ui/Spinner.tsx
import styled from 'styled-components';

export const Spinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default Spinner;

