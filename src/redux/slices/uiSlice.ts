import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Language } from '../../i18n';
import { bootstrapAuth, login, loginWithGoogle, logout, refreshAuthToken } from './authSlice';

export type ThemeMode = 'light' | 'dark' | 'system';

type UiState = {
  theme: ThemeMode;
  language: Language;
  selectedPanel?: 'admin' | 'student' | 'teacher' | null;
};

const initialState: UiState = {
  theme: 'system',
  language: 'az',
  selectedPanel: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },
    setLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },
    setSelectedPanel(state, action: PayloadAction<'admin' | 'student' | 'teacher' | null>) {
      state.selectedPanel = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        if (!action.payload) {
          state.selectedPanel = null;
        }
      })
      .addCase(login.fulfilled, state => {
        state.selectedPanel = null;
      })
      .addCase(loginWithGoogle.fulfilled, state => {
        state.selectedPanel = null;
      })
      .addCase(refreshAuthToken.fulfilled, state => {
        state.selectedPanel = null;
      })
      .addCase(logout.fulfilled, state => {
        state.selectedPanel = null;
      });
  },
});

  export const { setTheme, setLanguage, setSelectedPanel } = uiSlice.actions;
  export default uiSlice.reducer;
