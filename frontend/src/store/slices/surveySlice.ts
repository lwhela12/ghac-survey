import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { surveyApi } from '../../services/api';
import { Question } from '../../types/survey';

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
export const checkExistingSession = createAsyncThunk(
  'survey/checkExistingSession',
  async () => {
    const response = await surveyApi.checkExistingSession();
    return response;
  }
);

export const resumeSurvey = createAsyncThunk(
  'survey/resume',
  async (sessionId: string) => {
    const response = await surveyApi.resumeSurvey(sessionId);
    return { sessionId, ...response };
  }
);

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
    initializeSurvey: () => {
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
        // Add the first question as a bot message only if it has content
        if (action.payload.firstQuestion) {
          try {
            // Create a deep copy to avoid shared references
            const questionCopy = JSON.parse(JSON.stringify(action.payload.firstQuestion));
            const hasContent = typeof questionCopy.content === 'string' && questionCopy.content.trim().length > 0;
            if (hasContent) {
              state.messages.push({
                id: `bot-${Date.now()}-${action.payload.firstQuestion.id}`,
                type: 'bot',
                content: questionCopy.content,
                question: questionCopy,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error('Error parsing firstQuestion:', error);
            console.error('firstQuestion value:', action.payload.firstQuestion);
          }
        } else {
          console.error('No firstQuestion in survey start response:', action.payload);
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
        // Set progress to 100% if we've reached a final-message
        if (action.payload.nextQuestion?.type === 'final-message') {
          state.progress = 100;
        } else {
          state.progress = action.payload.progress;
        }
        
        // Add next question as bot message if it has non-empty content OR if it's a video type
        if (action.payload.nextQuestion) {
          // Create a deep copy of the question to avoid shared references
          try {
            const questionCopy = JSON.parse(JSON.stringify(action.payload.nextQuestion));
            const hasContent = typeof questionCopy.content === 'string' && questionCopy.content.trim().length > 0;
            const isVideoType = questionCopy.type === 'video-autoplay' || questionCopy.type === 'videoask';
            
            // Add message if it has content OR if it's a video type (which may have empty content)
            if (hasContent || isVideoType) {
              state.messages.push({
                id: `bot-${Date.now()}-${action.payload.nextQuestion.id}`,
                type: 'bot',
                content: questionCopy.content || '', // Ensure content is at least empty string
                question: questionCopy,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error('Error parsing nextQuestion:', error);
            console.error('nextQuestion value:', action.payload.nextQuestion);
          }
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
      })
      // Resume survey
      .addCase(resumeSurvey.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resumeSurvey.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionId = action.payload.sessionId;
        state.currentQuestion = action.payload.currentQuestion;
        state.progress = action.payload.progress || 0;
        
        // Add current question to messages if it exists
        if (action.payload.currentQuestion) {
          const questionCopy = JSON.parse(JSON.stringify(action.payload.currentQuestion));
          state.messages.push({
            id: `bot-resumed-${Date.now()}`,
            type: 'bot',
            content: "Welcome back! Let's continue where you left off.",
            timestamp: new Date().toISOString(),
          });
          const hasContent = typeof questionCopy.content === 'string' && questionCopy.content.trim().length > 0;
          if (hasContent) {
            state.messages.push({
              id: `bot-${Date.now()}-${action.payload.currentQuestion.id}`,
              type: 'bot',
              content: questionCopy.content,
              question: questionCopy,
              timestamp: new Date().toISOString(),
            });
          }
        }
      })
      .addCase(resumeSurvey.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to resume survey';
      });
  },
});

export const { initializeSurvey, addBotMessage, addUserMessage, setTyping, resetSurvey, updateMessageQuestion } = surveySlice.actions;
export default surveySlice.reducer;
