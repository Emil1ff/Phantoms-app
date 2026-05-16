import { combineReducers } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import productsReducer from './slices/productsSlice';
import usersReducer from './slices/usersSlice';
import rolesReducer from './slices/rolesSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  products: productsReducer,
  users: usersReducer,
  roles: rolesReducer,
});
