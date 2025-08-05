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
      // Remove default welcome message - we'll use b0 instead
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
    updateMessageQuestion: (state, action: PayloadAction<{ messageId: string; updates: Partial<Question> }>) => {
      const message = state.messages.find(m => m.id === action.payload.messageId);
      if (message && message.question) {
        message.question = { ...message.question, ...action.payload.updates };
      }
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
        // Always add the first question as a bot message
        // Create a deep copy to avoid shared references
        const questionCopy = JSON.parse(JSON.stringify(action.payload.firstQuestion));
        state.messages.push({
          id: `bot-${Date.now()}-${action.payload.firstQuestion.id}`,
          type: 'bot',
          content: questionCopy.content,
          question: questionCopy,
          timestamp: new Date().toISOString(),
        });
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
          // Debug logging for VideoAsk questions
          if (action.payload.nextQuestion.type === 'videoask') {
            console.log('Redux - Adding VideoAsk message:', {
              questionId: action.payload.nextQuestion.id,
              content: action.payload.nextQuestion.content,
              videoAskFormId: action.payload.nextQuestion.videoAskFormId
            });
          }
          
          // Create a deep copy of the question to avoid shared references
          const questionCopy = JSON.parse(JSON.stringify(action.payload.nextQuestion));
          
          state.messages.push({
            id: `bot-${Date.now()}-${action.payload.nextQuestion.id}`,
            type: 'bot',
            content: questionCopy.content,
            question: questionCopy,
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

export const { initializeSurvey, addBotMessage, addUserMessage, setTyping, resetSurvey, updateMessageQuestion } = surveySlice.actions;
export default surveySlice.reducer;