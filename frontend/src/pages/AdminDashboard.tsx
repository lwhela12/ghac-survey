import React, { useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { useClerk, useUser, useAuth } from '@clerk/clerk-react';
import { setClerkGetToken } from '../services/clerkApi';
import AdminOverview from '../components/Admin/AdminOverview';
import ResponsesList from '../components/Admin/ResponsesList';
import ResponseDetail from '../components/Admin/ResponseDetail';
import Analytics from '../components/Admin/Analytics';
import ghacLogo from '../assets/images/GHAC.jpg';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();

  // Initialize Clerk API with getToken function
  useEffect(() => {
    setClerkGetToken(getToken);
  }, [getToken]);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/sign-in');
  };

  return (
    <Container>
      <Sidebar>
        <LogoSection>
          <Logo src={ghacLogo} alt="GHAC Logo" />
          <LogoText>Admin Panel</LogoText>
        </LogoSection>
        
        <Navigation>
          <NavItem to="/admin/dashboard" end>
            📊 Overview
          </NavItem>
          <NavItem to="/admin/responses">
            📝 Responses
          </NavItem>
          <NavItem to="/admin/analytics">
            📈 Analytics
          </NavItem>
        </Navigation>
        
        <UserSection>
          <UserInfo>
            <UserName>{clerkUser?.fullName || clerkUser?.firstName || 'Admin'}</UserName>
            <UserEmail>{clerkUser?.primaryEmailAddress?.emailAddress}</UserEmail>
          </UserInfo>
          <LogoutButton onClick={handleLogout}>
            🚪 Sign Out
          </LogoutButton>
        </UserSection>
      </Sidebar>
      
      <MainContent>
        <Routes>
          <Route path="dashboard" element={<AdminOverview />} />
          <Route path="responses" element={<ResponsesList />} />
          <Route path="responses/:responseId" element={<ResponseDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="*" element={<AdminOverview />} />
        </Routes>
      </MainContent>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.surface};
`;

const Sidebar = styled.aside`
  width: 280px;
  background-color: ${({ theme }) => theme.colors.background};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const LogoSection = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  text-align: center;
`;

const Logo = styled.img`
  width: 120px;
  height: 60px;
  object-fit: contain;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  mix-blend-mode: multiply;
`;

const LogoText = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin: 0;
  font-family: 'Nunito', sans-serif;
`;

const Navigation = styled.nav`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: 'Nunito', sans-serif;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: rgba(74, 144, 226, 0.1);
    color: #4A90E2;
  }
  
  &.active {
    background-color: #4A90E2;
    color: white;
  }
`;

const UserSection = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const UserInfo = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const UserName = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: 'Nunito', sans-serif;
`;

const UserEmail = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: 'Nunito', sans-serif;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.error};
  }
`;

const MainContent = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

export default AdminDashboard;