import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { ClerkProvider } from '@clerk/clerk-react';
import { store } from './store/store';
import { theme } from './styles/theme';
import { GlobalStyle } from './styles/GlobalStyle';
import SurveyPage from './pages/SurveyPage';
import AdminDashboard from './pages/AdminDashboard';
import ClerkPrivateRoute from './components/Admin/ClerkPrivateRoute';
import ClerkSignIn from './pages/ClerkSignIn';
import ClerkSignUp from './pages/ClerkSignUp';
import ErrorBoundary from './components/ErrorBoundary';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

// Bridge Clerk navigation to React Router to avoid full page reloads during auth flows
const ClerkWithRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      {children}
    </ClerkProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <Router>
          <ClerkWithRouter>
            <ThemeProvider theme={theme}>
              <GlobalStyle />
              <Routes>
                <Route path="/" element={<SurveyPage />} />
                <Route path="/admin/sign-in/*" element={<ClerkSignIn />} />
                <Route path="/admin/sign-up/*" element={<ClerkSignUp />} />
                <Route
                  path="/admin/*"
                  element={
                    <ClerkPrivateRoute>
                      <AdminDashboard />
                    </ClerkPrivateRoute>
                  }
                />
              </Routes>
            </ThemeProvider>
          </ClerkWithRouter>
        </Router>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
