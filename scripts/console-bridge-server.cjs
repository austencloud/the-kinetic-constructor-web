// Simple WebSocket server using Node.js built-in modules only
const http = require('http');
const crypto = require('crypto');

const port = 5180;

// WebSocket key for handshake
const WEBSOCKET_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function generateAcceptKey(key) {
	return crypto
		.createHash('sha1')
		.update(key + WEBSOCKET_MAGIC_STRING)
		.digest('base64');
}

function parseWebSocketFrame(buffer) {
	if (buffer.length < 2) return null;

	const firstByte = buffer[0];
	const secondByte = buffer[1];

	const fin = (firstByte & 0x80) === 0x80;
	const opcode = firstByte & 0x0f;
	const masked = (secondByte & 0x80) === 0x80;
	let payloadLength = secondByte & 0x7f;

	let offset = 2;

	if (payloadLength === 126) {
		payloadLength = buffer.readUInt16BE(offset);
		offset += 2;
	} else if (payloadLength === 127) {
		payloadLength = buffer.readBigUInt64BE(offset);
		offset += 8;
	}

	if (masked) {
		const maskKey = buffer.slice(offset, offset + 4);
		offset += 4;
		const payload = buffer.slice(offset, offset + Number(payloadLength));

		for (let i = 0; i < payload.length; i++) {
			payload[i] ^= maskKey[i % 4];
		}

		return payload.toString('utf8');
	}

	return buffer.slice(offset, offset + Number(payloadLength)).toString('utf8');
}

const server = http.createServer();
const clients = new Set();

server.on('upgrade', (request, socket, head) => {
	const key = request.headers['sec-websocket-key'];
	const acceptKey = generateAcceptKey(key);

	const responseHeaders = [
		'HTTP/1.1 101 Switching Protocols',
		'Upgrade: websocket',
		'Connection: Upgrade',
		`Sec-WebSocket-Accept: ${acceptKey}`,
		'',
		''
	].join('\r\n');

	socket.write(responseHeaders);
	clients.add(socket);

	console.log('\x1b[32m🌐 Browser console connected\x1b[0m');

	socket.on('data', (buffer) => {
		try {
			const message = parseWebSocketFrame(buffer);
			if (message) {
				const { level, message: logMessage, timestamp } = JSON.parse(message);
				const time = new Date(timestamp).toLocaleTimeString();
				const prefix = `[BROWSER ${time}]`;

				switch (level) {
					case 'error':
						console.log(`\x1b[31m${prefix} ${logMessage}\x1b[0m`);
						break;
					case 'warn':
						console.log(`\x1b[33m${prefix} ${logMessage}\x1b[0m`);
						break;
					case 'info':
						console.log(`\x1b[34m${prefix} ${logMessage}\x1b[0m`);
						break;
					default:
						console.log(`\x1b[37m${prefix} ${logMessage}\x1b[0m`);
				}
			}
		} catch (error) {
			console.log(`\x1b[31m❌ Invalid console message\x1b[0m`);
		}
	});

	socket.on('close', () => {
		clients.delete(socket);
		console.log('\x1b[33m🔌 Browser console disconnected\x1b[0m');
	});

	socket.on('error', () => {
		clients.delete(socket);
	});
});

server.listen(port, () => {
	console.log(`\x1b[34m🔗 Console bridge server running on ws://localhost:${port}\x1b[0m`);
	console.log('\x1b[36mNow run: npm run dev\x1b[0m');
	console.log('\x1b[36mBrowser console logs will appear here!\x1b[0m');
});

server.on('error', (error) => {
	console.log('❌ Failed to start console bridge server - continuing without it');
	console.log('Error:', error.message);
});
