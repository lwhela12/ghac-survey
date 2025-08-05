import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

function App() {
  return (
    <Provider store={store}>
      <ClerkProvider publishableKey={clerkPubKey}>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <Router>
            <Routes>
              <Route path="/" element={<SurveyPage />} />
              <Route path="/admin/sign-in" element={<ClerkSignIn />} />
              <Route path="/admin/sign-up" element={<ClerkSignUp />} />
              <Route
                path="/admin/*"
                element={
                  <ClerkPrivateRoute>
                    <AdminDashboard />
                  </ClerkPrivateRoute>
                }
              />
            </Routes>
          </Router>
        </ThemeProvider>
      </ClerkProvider>
    </Provider>
  );
}

export default App;