// frontend/src/components/Admin/ui/Card.tsx
import React from 'react';
import styled from 'styled-components';

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: ${({ theme }) => theme.spacing.lg};
`;

type CardProps = React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>;

export const CardSection: React.FC<CardProps> = ({ children, ...rest }) => (
  <CardSectionEl {...rest}>{children}</CardSectionEl>
);

const CardSectionEl = styled.div`
  & + & {
    margin-top: ${({ theme }) => theme.spacing.lg};
    padding-top: ${({ theme }) => theme.spacing.lg};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

export default Card;
