#!/usr/bin/env node

/**
 * Custom development server script
 * Runs Vite with minimal logging but shows the localhost URL
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create scripts directory if it doesn't exist
const scriptsDir = path.join(process.cwd(), 'scripts');
if (!fs.existsSync(scriptsDir)) {
	fs.mkdirSync(scriptsDir, { recursive: true });
}

// Colors for console output
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	cyan: '\x1b[36m',
	green: '\x1b[32m',
	yellow: '\x1b[33m'
};

// Find an available port starting from 5173
async function findAvailablePort(startPort) {
	const net = await import('net');

	function isPortAvailable(port) {
		return new Promise((resolve) => {
			const server = net.default.createServer();

			server.once('error', () => {
				resolve(false);
			});

			server.once('listening', () => {
				server.close();
				resolve(true);
			});

			server.listen(port);
		});
	}

	let port = startPort;
	while (!(await isPortAvailable(port))) {
		port++;
	}

	return port;
}

// Main function
async function main() {
	// Clear console
	console.clear();

	// Show startup message
	console.log(
		`${colors.bright}${colors.cyan}Starting development server on PORT 5179...${colors.reset}\n`
	);

	// Use dedicated port 5179 for the-kinetic-constructor-web
	const port = 5179;

	// Prepare Vite command - ALWAYS use port 5179
	const args = ['dev', '--host', '--port', '5179', '--open'];

	// Add any command line arguments passed to this script
	process.argv.slice(2).forEach((arg) => {
		if (arg !== '--logLevel=error' && !arg.startsWith('--port') && arg !== '--open') {
			args.push(arg);
		}
	});

	// Start Vite
	console.log(`${colors.cyan}Starting Vite with args: ${args.join(' ')}${colors.reset}`);

	const vite = spawn('npx', ['vite', ...args], {
		stdio: ['inherit', 'pipe', 'inherit'],
		shell: true
	});

	// Check if spawn was successful
	if (!vite) {
		throw new Error('Failed to spawn Vite process');
	}

	// Handle Vite output
	let serverStarted = false;
	let actualPort = port;

	vite.stdout.on('data', (data) => {
		const output = data.toString();

		// Show all Vite output but capture the port
		process.stdout.write(output);

		// Extract the actual port from Vite's output
		const portMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
		if (portMatch) {
			actualPort = parseInt(portMatch[1]);

			if (!serverStarted) {
				serverStarted = true;
				// Show our custom message after Vite's output
				setTimeout(() => {
					console.log(
						`\n${colors.bright}${colors.green}✅ Server running on dedicated port:${colors.reset}`
					);
					console.log(
						`${colors.bright}${colors.yellow}➜ Local:   ${colors.cyan}http://localhost:5179/${colors.reset}`
					);
					console.log(`\n${colors.bright}${colors.green}🚀 Ready for development!${colors.reset}`);
				}, 100);
			}
		}
	});

	vite.stderr.on('data', (data) => {
		console.error(data.toString());
	});

	// Handle spawn errors
	vite.on('error', (err) => {
		console.error(
			`${colors.bright}${colors.red}Failed to start Vite: ${err.message}${colors.reset}`
		);
		process.exit(1);
	});

	// Handle process exit
	vite.on('close', (code) => {
		if (code !== 0) {
			console.log(`\n${colors.bright}Vite process exited with code ${code}${colors.reset}`);
		}
	});

	// Handle termination signals
	['SIGINT', 'SIGTERM'].forEach((signal) => {
		process.on(signal, () => {
			vite.kill(signal);
			process.exit();
		});
	});

	// No timeout fallback needed since we show Vite's output directly
}

main().catch((err) => {
	console.error('Error starting development server:', err);
	process.exit(1);
});
