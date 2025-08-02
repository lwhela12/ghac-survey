import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { adminApi } from '../../services/api';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminSliceState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AdminSliceState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'admin/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await adminApi.login(email, password);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response.user;
  }
);

export const logout = createAsyncThunk('admin/logout', async () => {
  await adminApi.logout();
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
});

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AdminUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, clearAuth } = adminSlice.actions;
export default adminSlice.reducer;