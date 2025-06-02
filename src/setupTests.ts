// src/setupTests.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';

// Test server for serving static files during tests
let testServer: any = null;
const TEST_PORT = 3000;

// Start test server before all tests
export async function startTestServer() {
	if (testServer) return; // Already running

	return new Promise<void>((resolve, reject) => {
		testServer = createServer((req, res) => {
			// Enable CORS for tests
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

			if (req.method === 'OPTIONS') {
				res.writeHead(200);
				res.end();
				return;
			}

			try {
				// Serve CSV files from static directory
				if (req.url === '/DiamondPictographDataframe.csv') {
					const csvPath = join(process.cwd(), 'static', 'DiamondPictographDataframe.csv');
					const csvContent = readFileSync(csvPath, 'utf-8');
					res.setHeader('Content-Type', 'text/csv');
					res.writeHead(200);
					res.end(csvContent);
				} else if (req.url === '/BoxPictographDataframe.csv') {
					const csvPath = join(process.cwd(), 'static', 'BoxPictographDataframe.csv');
					const csvContent = readFileSync(csvPath, 'utf-8');
					res.setHeader('Content-Type', 'text/csv');
					res.writeHead(200);
					res.end(csvContent);
				} else {
					res.writeHead(404);
					res.end('Not Found');
				}
			} catch (error) {
				console.error('Test server error:', error);
				res.writeHead(500);
				res.end('Internal Server Error');
			}
		});

		testServer.listen(TEST_PORT, () => {
			console.log(`✅ Test server running on http://localhost:${TEST_PORT}`);
			resolve();
		});

		testServer.on('error', (error: any) => {
			if (error.code === 'EADDRINUSE') {
				console.log(`⚠️  Port ${TEST_PORT} already in use, assuming server is already running`);
				resolve();
			} else {
				reject(error);
			}
		});
	});
}

// Stop test server after all tests
export async function stopTestServer() {
	if (testServer) {
		return new Promise<void>((resolve) => {
			testServer.close(() => {
				console.log('🛑 Test server stopped');
				testServer = null;
				resolve();
			});
		});
	}
}

// Start the test server immediately when this module is loaded
startTestServer().catch(console.error);

// Mock browser environment for Svelte 5
vi.stubGlobal('browser', true);

// Mock browser APIs that might not be available in the test environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock localStorage with spies for testing
const createLocalStorageMock = () => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value.toString();
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		length: 0,
		key: vi.fn((index: number) => Object.keys(store)[index] || null),
		_store: store // For direct access in tests
	};
};

const localStorageMock = createLocalStorageMock();

// Apply the mock to window.localStorage
Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
	writable: true
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
	value: createLocalStorageMock(),
	writable: true
});

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
	return setTimeout(callback, 0);
};

// Mock cancelAnimationFrame
global.cancelAnimationFrame = (id: number) => {
	clearTimeout(id);
};

// Mock Svelte lifecycle functions for component tests
vi.mock('svelte', async (importOriginal) => {
	const actual = (await importOriginal()) as Record<string, any>;
	return {
		...actual,
		onMount: (fn: () => any) => {
			fn(); // Execute the function immediately
			return () => {}; // Return a cleanup function
		}
	};
});
