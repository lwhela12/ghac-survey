import { configureStore } from '@reduxjs/toolkit';
import surveyReducer from './slices/surveySlice';
import adminReducer from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    survey: surveyReducer,
    admin: adminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;