import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { surveyApi } from '../../services/api';
import { Question, SurveyState } from '../../types/survey';

interface SurveySliceState {
  sessionId: string | null;
  currentQuestion: Question | null;
  progress: number;
  messages: Array<{
    id: string;
    type: 'bot' | 'user' | 'system';
    content: string;
    question?: Question;
    timestamp: string; // Store as ISO string for serialization
  }>;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
}

const initialState: SurveySliceState = {
  sessionId: null,
  currentQuestion: null,
  progress: 0,
  messages: [],
  isLoading: false,
  isTyping: false,
  error: null,
};

// Async thunks
export const startSurvey = createAsyncThunk(
  'survey/start',
  async (name: string) => {
    const response = await surveyApi.startSurvey(name);
    return response;
  }
);

export const submitAnswer = createAsyncThunk(
  'survey/submitAnswer',
  async ({ questionId, answer }: { questionId: string; answer: any }) => {
    const response = await surveyApi.submitAnswer(questionId, answer);
    return response;
  }
);

export const completeSurvey = createAsyncThunk(
  'survey/complete',
  async () => {
    const response = await surveyApi.completeSurvey();
    return response;
  }
);

const surveySlice = createSlice({
  name: 'survey',
  initialState,
  reducers: {
    initializeSurvey: (state) => {
      // Only add welcome message if no messages exist
      if (state.messages.length === 0) {
        state.messages.push({
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: "Welcome to the Greater Hartford Arts Council survey! I'm here to learn about your connection to arts and culture in our community.",
          timestamp: new Date().toISOString(),
        });
      }
    },
    addBotMessage: (state, action: PayloadAction<{ content: string; question?: Question }>) => {
      state.messages.push({
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: action.payload.content,
        question: action.payload.question,
        timestamp: new Date().toISOString(),
      });
    },
    addUserMessage: (state, action: PayloadAction<string>) => {
      state.messages.push({
        id: `user-${Date.now()}`,
        type: 'user',
        content: action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    resetSurvey: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Start survey
      .addCase(startSurvey.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startSurvey.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionId = action.payload.sessionId;
        state.currentQuestion = action.payload.firstQuestion;
        // Only add the first question as a bot message if it's not video-autoplay
        if (action.payload.firstQuestion.type !== 'video-autoplay') {
          state.messages.push({
            id: `bot-${Date.now()}`,
            type: 'bot',
            content: action.payload.firstQuestion.content,
            question: action.payload.firstQuestion,
            timestamp: new Date().toISOString(),
          });
        }
      })
      .addCase(startSurvey.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to start survey';
      })
      // Submit answer
      .addCase(submitAnswer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentQuestion = action.payload.nextQuestion;
        state.progress = action.payload.progress;
        
        // Add next question as bot message if there is one
        if (action.payload.nextQuestion) {
          state.messages.push({
            id: `bot-${Date.now()}`,
            type: 'bot',
            content: action.payload.nextQuestion.content,
            question: action.payload.nextQuestion,
            timestamp: new Date().toISOString(),
          });
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to submit answer';
      })
      // Complete survey
      .addCase(completeSurvey.fulfilled, (state) => {
        state.currentQuestion = null;
        state.progress = 100;
      });
  },
});

export const { initializeSurvey, addBotMessage, addUserMessage, setTyping, resetSurvey } = surveySlice.actions;
export default surveySlice.reducer;