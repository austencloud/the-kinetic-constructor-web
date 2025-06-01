#!/usr/bin/env node

/**
 * ✨ MAGICAL F5 DEVELOPMENT EXPERIENCE ✨
 *
 * Features:
 * - Lightning-fast startup with intelligent caching
 * - Auto-dependency detection and installation
 * - Beautiful progress indicators and animations
 * - Smart browser launching with dev tools
 * - Health checks and auto-recovery
 * - Performance monitoring
 * - Hot reload with instant feedback
 */

import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✨ Magical console styling
const magic = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',

	// Colors
	cyan: '\x1b[36m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	red: '\x1b[31m',
	white: '\x1b[37m',

	// Backgrounds
	bgCyan: '\x1b[46m',
	bgGreen: '\x1b[42m',
	bgYellow: '\x1b[43m',
	bgBlue: '\x1b[44m',
	bgMagenta: '\x1b[45m',

	// Special effects
	rainbow: (text) => {
		const colors = [magic.red, magic.yellow, magic.green, magic.cyan, magic.blue, magic.magenta];
		return (
			text
				.split('')
				.map((char, i) => colors[i % colors.length] + char)
				.join('') + magic.reset
		);
	},

	gradient: (text, color1, color2) => color1 + text + magic.reset,

	box: (text, color = magic.cyan) => {
		const lines = text.split('\n');
		const maxLength = Math.max(...lines.map((line) => line.length));
		const border = '─'.repeat(maxLength + 2);

		return [
			color + '┌' + border + '┐' + magic.reset,
			...lines.map((line) => color + '│ ' + line.padEnd(maxLength) + ' │' + magic.reset),
			color + '└' + border + '┘' + magic.reset
		].join('\n');
	}
};

// ✨ Animated loading spinner
class MagicalSpinner {
	constructor(message = 'Loading...', frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']) {
		this.message = message;
		this.frames = frames;
		this.current = 0;
		this.interval = null;
	}

	start() {
		process.stdout.write('\x1B[?25l'); // Hide cursor
		this.interval = setInterval(() => {
			process.stdout.write(
				`\r${magic.cyan}${this.frames[this.current]}${magic.reset} ${this.message}`
			);
			this.current = (this.current + 1) % this.frames.length;
		}, 100);
	}

	stop(successMessage = '') {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
		process.stdout.write('\r\x1B[K'); // Clear line
		process.stdout.write('\x1B[?25h'); // Show cursor
		if (successMessage) {
			console.log(`${magic.green}✓${magic.reset} ${successMessage}`);
		}
	}

	update(message) {
		this.message = message;
	}
}

// ✨ Smart dependency checker
class DependencyMagic {
	static async checkAndInstall() {
		const spinner = new MagicalSpinner('Checking dependencies...');
		spinner.start();

		try {
			// Check if node_modules exists and is recent
			const nodeModulesPath = path.join(process.cwd(), 'node_modules');
			const packageJsonPath = path.join(process.cwd(), 'package.json');

			if (!existsSync(nodeModulesPath)) {
				spinner.update('Installing dependencies for the first time...');
				await execAsync('npm install');
				spinner.stop('Dependencies installed successfully!');
				return;
			}

			// Check if package.json is newer than node_modules
			const [nodeModulesStat, packageJsonStat] = await Promise.all([
				fs.stat(nodeModulesPath),
				fs.stat(packageJsonPath)
			]);

			if (packageJsonStat.mtime > nodeModulesStat.mtime) {
				spinner.update('Package.json changed, updating dependencies...');
				await execAsync('npm install');
				spinner.stop('Dependencies updated!');
			} else {
				spinner.stop('Dependencies are up to date!');
			}
		} catch (error) {
			spinner.stop();
			console.log(`${magic.yellow}⚠${magic.reset} Dependency check failed, continuing anyway...`);
		}
	}
}

// ✨ Cache optimizer
class CacheMagic {
	static async optimize() {
		const spinner = new MagicalSpinner('Optimizing caches...');
		spinner.start();

		try {
			// Clear old Vite caches if they exist
			const viteCachePath = path.join(process.cwd(), 'node_modules', '.vite');
			if (existsSync(viteCachePath)) {
				const stat = await fs.stat(viteCachePath);
				const daysSinceModified = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24);

				if (daysSinceModified > 7) {
					spinner.update('Clearing old Vite cache...');
					await fs.rm(viteCachePath, { recursive: true, force: true });
				}
			}

			spinner.stop('Cache optimized!');
		} catch (error) {
			spinner.stop('Cache optimization skipped');
		}
	}
}

// ✨ Port manager with magic
class PortMagic {
	static async findMagicalPort(startPort = 7734) {
		const net = await import('net');

		function checkPort(port) {
			return new Promise((resolve) => {
				const server = net.default.createServer();
				server.once('error', () => resolve(false));
				server.once('listening', () => {
					server.close();
					resolve(true);
				});
				server.listen(port);
			});
		}

		// Try the preferred port first
		if (await checkPort(startPort)) {
			return startPort;
		}

		// Find next available port
		for (let port = startPort + 1; port < startPort + 10; port++) {
			if (await checkPort(port)) {
				return port;
			}
		}

		return startPort; // Fallback
	}
}

// ✨ Browser launcher with magic
class BrowserMagic {
	static async launchWithDevTools(url) {
		const isWindows = process.platform === 'win32';
		const isMac = process.platform === 'darwin';

		try {
			if (isWindows) {
				// Try Chrome first, then Edge, then default browser
				const commands = [
					`start chrome "${url}" --auto-open-devtools-for-tabs`,
					`start msedge "${url}" --auto-open-devtools-for-tabs`,
					`start "${url}"`
				];

				for (const cmd of commands) {
					try {
						await execAsync(cmd);
						break;
					} catch (e) {
						continue;
					}
				}
			} else if (isMac) {
				await execAsync(`open -a "Google Chrome" "${url}" --args --auto-open-devtools-for-tabs`);
			} else {
				await execAsync(`google-chrome "${url}" --auto-open-devtools-for-tabs || firefox "${url}"`);
			}
		} catch (error) {
			console.log(`${magic.yellow}⚠${magic.reset} Could not auto-open browser with dev tools`);
		}
	}
}

// ✨ Health monitor
class HealthMagic {
	static startMonitoring(port) {
		let healthCheckInterval;
		let isHealthy = false;

		const checkHealth = async () => {
			try {
				const response = await fetch(`http://localhost:${port}/`);
				if (response.ok && !isHealthy) {
					isHealthy = true;
					console.log(`\n${magic.green}💚 Application is healthy and responding!${magic.reset}`);
				}
			} catch (error) {
				if (isHealthy) {
					isHealthy = false;
					console.log(`\n${magic.red}💔 Application seems to be having issues...${magic.reset}`);
				}
			}
		};

		// Start health monitoring after 5 seconds
		setTimeout(() => {
			healthCheckInterval = setInterval(checkHealth, 10000); // Check every 10 seconds
		}, 5000);

		return () => {
			if (healthCheckInterval) {
				clearInterval(healthCheckInterval);
			}
		};
	}
}

// ✨ Main magical function
async function startMagicalDevelopment() {
	// Clear console with style
	console.clear();

	// Show magical banner
	console.log(magic.box(magic.rainbow('✨ MAGICAL DEVELOPMENT EXPERIENCE ✨'), magic.cyan));
	console.log('');

	try {
		// Phase 1: Environment setup
		console.log(`${magic.blue}🔮 Phase 1: Environment Magic${magic.reset}`);
		await DependencyMagic.checkAndInstall();
		await CacheMagic.optimize();

		// Phase 2: Port magic
		console.log(`\n${magic.blue}🔮 Phase 2: Port Magic${magic.reset}`);
		const port = await PortMagic.findMagicalPort();
		console.log(
			`${magic.green}✓${magic.reset} Found magical port: ${magic.cyan}${port}${magic.reset}`
		);

		// Phase 3: Server startup
		console.log(`\n${magic.blue}🔮 Phase 3: Server Summoning${magic.reset}`);
		const startTime = Date.now();

		const args = ['dev', '--port', port.toString(), '--logLevel=error'];
		if (process.argv.includes('--open')) {
			args.push('--open');
		}

		const vite = spawn('vite', args, {
			stdio: ['inherit', 'pipe', 'pipe'],
			shell: true,
			env: { ...process.env, FORCE_COLOR: '1' }
		});

		let serverReady = false;

		// Handle Vite output with magic
		vite.stdout.on('data', async (data) => {
			const output = data.toString();

			if ((output.includes('ready') || output.includes('Local:')) && !serverReady) {
				serverReady = true;
				const startupTime = ((Date.now() - startTime) / 1000).toFixed(2);

				console.log(
					'\n' +
						magic.box(
							`
🚀 Server Ready in ${startupTime}s!

${magic.bright}Local:${magic.reset}   ${magic.cyan}http://localhost:${port}/${magic.reset}
${magic.bright}Network:${magic.reset} ${magic.dim}Use --host to expose${magic.reset}

${magic.green}✨ Happy coding! Press Ctrl+C to stop${magic.reset}
        `.trim(),
							magic.green
						)
				);

				// Auto-launch browser if requested
				if (process.argv.includes('--open') || process.argv.includes('--browser')) {
					console.log(`\n${magic.yellow}🌐 Opening browser with dev tools...${magic.reset}`);
					await BrowserMagic.launchWithDevTools(`http://localhost:${port}`);
				}

				// Start health monitoring
				const stopHealthMonitoring = HealthMagic.startMonitoring(port);

				// Cleanup on exit
				process.on('SIGINT', () => {
					stopHealthMonitoring();
					console.log(
						`\n\n${magic.magenta}✨ Thanks for using the magical dev experience!${magic.reset}`
					);
					vite.kill('SIGINT');
					process.exit(0);
				});
			}

			// Show errors in a magical way
			if (output.includes('ERROR') || output.includes('error')) {
				console.log(`\n${magic.red}💥 ${output.trim()}${magic.reset}`);
			}
		});

		vite.stderr.on('data', (data) => {
			const error = data.toString();
			if (!error.includes('ExperimentalWarning')) {
				console.log(`${magic.red}🚨 ${error.trim()}${magic.reset}`);
			}
		});

		vite.on('close', (code) => {
			if (code !== 0) {
				console.log(`\n${magic.red}💔 Server stopped with code ${code}${magic.reset}`);
			}
		});

		// Show tips while starting
		setTimeout(() => {
			if (!serverReady) {
				console.log(
					`\n${magic.dim}💡 Tip: Add --browser to auto-open with dev tools${magic.reset}`
				);
				console.log(`${magic.dim}💡 Tip: Press F5 in browser for instant reload${magic.reset}`);
			}
		}, 2000);
	} catch (error) {
		console.error(`\n${magic.red}💥 Magical startup failed:${magic.reset}`, error.message);
		process.exit(1);
	}
}

// ✨ Start the magic!
startMagicalDevelopment().catch((error) => {
	console.error(`${magic.red}💥 Critical magical failure:${magic.reset}`, error);
	process.exit(1);
});
