// src/lib/components/MainWidget/state/store.ts
import { configureStore, combineReducers, type Middleware } from '@reduxjs/toolkit';
import {
	persistStore,
	persistReducer,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER
} from 'redux-persist';
import storage from 'redux-persist/lib/storage/createWebStorage';

// Import reducers
import appReducer from './appSlice';
import { tabs } from './appState';

// Persist configuration
const persistConfig = {
	key: 'root',
	version: 1,
	storage,
	whitelist: ['app'] // Reducers to persist
};

// Combine reducers
const rootReducer = combineReducers({
	app: appReducer
	// Add other reducers here as needed
});

// Type for root state

// Create a Svelte store that mirrors the Redux store

// Selector function
export function useSelector<T>(selector: (state: RootState) => T): T {
	let value: T;

	const unsubscribe = store.subscribe(() => {
		value = selector(store.getState());
	});

	// Initial value
	value = selector(store.getState());

	return value;
}
// Type for root state
export type RootState = ReturnType<typeof rootReducer>;

// Simple logging middleware with proper typing
const loggingMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
	if (import.meta.env.DEV) {
		console.group('Redux Action');
		console.log('Action:', action);
		console.log('Previous State:', store.getState());

		const result = next(action);

		console.log('Next State:', store.getState());
		console.groupEnd();

		return result;
	}

	return next(action);
};

// Middleware configuration with proper typing
const middleware = (getDefaultMiddleware: any) => {
	const defaultMiddleware = getDefaultMiddleware({
		serializableCheck: {
			ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
		}
	});

	// Add logging middleware only in development
	return import.meta.env.DEV ? [...defaultMiddleware, loggingMiddleware] : defaultMiddleware;
};

// Configure store
export const store = configureStore({
	reducer: rootReducer,
	middleware,
	devTools: import.meta.env.DEV
});

// Dispatch type
export type AppDispatch = typeof store.dispatch;

// Create a persisted store
export const persistor = persistStore(store);

// Selector helpers
export const selectAppState = (state: RootState) => state.app;
export const selectActiveTab = (state: RootState) => {
	const { currentTab } = state.app;
	return tabs[currentTab];
};
export const selectSlideDirection = (state: RootState) =>
	state.app.currentTab > state.app.previousTab;
