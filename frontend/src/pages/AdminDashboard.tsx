import React, { useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useClerk, useUser, useAuth } from '@clerk/clerk-react';
import { setClerkGetToken } from '../services/clerkApi';
import AdminOverview from '../components/Admin/AdminOverview';
// Temporarily hidden pages; keep imports commented for easy re-enable
// import ResponsesList from '../components/Admin/ResponsesList';
// import ResponseDetail from '../components/Admin/ResponseDetail';
// import Analytics from '../components/Admin/Analytics';
import ghacLogo from '../assets/images/GHAC.jpg';
import { IconChartLine, IconLogOut } from '../components/Admin/ui/icons';

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
            <NavIcon><IconChartLine /></NavIcon>
            Overview
          </NavItem>
        </Navigation>

        <UserSection>
          <UserInfo>
            <UserName>{clerkUser?.fullName || clerkUser?.firstName || 'Admin'}</UserName>
            <UserEmail>{clerkUser?.primaryEmailAddress?.emailAddress}</UserEmail>
          </UserInfo>
          <LogoutButton onClick={handleLogout}>
            <NavIcon><IconLogOut /></NavIcon>
            Sign Out
          </LogoutButton>
        </UserSection>
      </Sidebar>

      <MainContent>
        <MainHeader>
          <HeaderBrand>
            <HeaderLogo src={ghacLogo} alt="GHAC" />
            <HeaderTitle>GHAC Admin</HeaderTitle>
          </HeaderBrand>
        </MainHeader>

        <Routes>
          <Route path="dashboard" element={<AdminOverview />} />
          <Route path="*" element={<AdminOverview />} />
        </Routes>
      </MainContent>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  /* Use neutral white like Nesolagus (avoid cream app bg) */
  background-color: ${({ theme }) => theme.colors.surface};
`;

const Sidebar = styled.aside`
  width: 256px;
  background-color: ${({ theme }) => theme.colors.surface};
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
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin: 0;
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
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: #F7FAFC;
  }
  
  &.active {
    position: relative;
    background-color: #F7FAFC;
    border: 1px solid ${({ theme }) => theme.colors.border};
  }

  &.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6px;
    bottom: 6px;
    width: 3px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 2px;
  }
`;

const NavIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  svg { display: block; width: 20px; height: 20px; }
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
`;

const UserEmail = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
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
  padding: ${({ theme }) => theme.spacing.lg};
`;

const MainHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.lg} 0;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const HeaderBrand = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const HeaderLogo = styled.img`
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 4px;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

// HeaderActions temporarily hidden (export/analytics buttons removed)

export default AdminDashboard;
