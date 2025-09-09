// frontend/src/components/Admin/ui/Badge.tsx
import styled, { css } from 'styled-components';

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export const Badge = styled.span<{ variant?: Variant }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  ${({ variant = 'neutral', theme }) => {
    switch (variant) {
      case 'success':
        return css`background: #22c55e20; color: #16a34a;`;
      case 'warning':
        return css`background: #f59e0b20; color: #b45309;`;
      case 'danger':
        return css`background: #ef444420; color: #b91c1c;`;
      case 'info':
        return css`background: #F7FAFC; color: ${theme.colors.text.primary};`;
      default:
        return css`background: #F7FAFC; color: ${theme.colors.text.primary};`;
    }
  }}
`;

export default Badge;
