/**
 * Test for StartPositionService - Default Start Positions
 * Verifies that the service loads the preferred default start positions: alpha1, beta5, gamma11
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StartPositionService } from './StartPositionService.svelte.ts';
import { Letter } from '$lib/types/Letter';

describe('StartPositionService - Default Start Positions', () => {
	let service: StartPositionService;

	beforeEach(() => {
		service = new StartPositionService({
			enableValidation: true,
			autoSync: false,
			enableCaching: false, // Disable caching for tests
			maxPositions: 500
		});
	});

	it('should load exactly 3 default start positions', async () => {
		await service.loadPositions();

		expect(service.availablePositions).toHaveLength(3);
		expect(service.error).toBeNull();
		expect(service.hasPositions).toBe(true);
	});

	it('should load the specific default positions: alpha1, beta5, gamma11', async () => {
		await service.loadPositions();

		const positions = service.availablePositions;
		expect(positions).toHaveLength(3);

		// Check that we have the expected letters
		const letters = positions.map(p => p.letter);
		expect(letters).toContain(Letter.α);
		expect(letters).toContain(Letter.β);
		expect(letters).toContain(Letter.Γ);

		// Check that we have the expected positions
		const startPositions = positions.map(p => p.startPos);
		expect(startPositions).toContain('alpha1');
		expect(startPositions).toContain('beta5');
		expect(startPositions).toContain('gamma11');

		// Check that startPos equals endPos for all positions (start position requirement)
		positions.forEach(position => {
			expect(position.startPos).toBe(position.endPos);
			expect(position.isStartPosition).toBe(true);
		});
	});

	it('should find alpha1 position with correct properties', async () => {
		await service.loadPositions();

		const alpha1Position = service.availablePositions.find(
			p => p.letter === Letter.α && p.startPos === 'alpha1'
		);

		expect(alpha1Position).toBeDefined();
		expect(alpha1Position?.letter).toBe(Letter.α);
		expect(alpha1Position?.startPos).toBe('alpha1');
		expect(alpha1Position?.endPos).toBe('alpha1');
		expect(alpha1Position?.isStartPosition).toBe(true);
	});

	it('should find beta5 position with correct properties', async () => {
		await service.loadPositions();

		const beta5Position = service.availablePositions.find(
			p => p.letter === Letter.β && p.startPos === 'beta5'
		);

		expect(beta5Position).toBeDefined();
		expect(beta5Position?.letter).toBe(Letter.β);
		expect(beta5Position?.startPos).toBe('beta5');
		expect(beta5Position?.endPos).toBe('beta5');
		expect(beta5Position?.isStartPosition).toBe(true);
	});

	it('should find gamma11 position with correct properties', async () => {
		await service.loadPositions();

		const gamma11Position = service.availablePositions.find(
			p => p.letter === Letter.Γ && p.startPos === 'gamma11'
		);

		expect(gamma11Position).toBeDefined();
		expect(gamma11Position?.letter).toBe(Letter.Γ);
		expect(gamma11Position?.startPos).toBe('gamma11');
		expect(gamma11Position?.endPos).toBe('gamma11');
		expect(gamma11Position?.isStartPosition).toBe(true);
	});

	it('should handle position selection correctly', async () => {
		await service.loadPositions();

		const firstPosition = service.availablePositions[0];
		service.selectPosition(firstPosition);

		expect(service.selectedPosition).toBe(firstPosition);
		expect(service.hasSelection).toBe(true);
	});

	it('should handle position clearing correctly', async () => {
		await service.loadPositions();

		const firstPosition = service.availablePositions[0];
		service.selectPosition(firstPosition);
		expect(service.hasSelection).toBe(true);

		service.clearPosition();
		expect(service.selectedPosition).toBeNull();
		expect(service.hasSelection).toBe(false);
	});

	it('should emit positions:loaded event when loading completes', async () => {
		let eventEmitted = false;
		let eventData: any = null;

		service.on('positions:loaded', (data) => {
			eventEmitted = true;
			eventData = data;
		});

		await service.loadPositions();

		expect(eventEmitted).toBe(true);
		expect(eventData).toBeDefined();
		expect(eventData.positions).toHaveLength(3);
	});

	it('should validate positions when validation is enabled', async () => {
		await service.loadPositions();

		// All positions should be valid since they come from authentic data
		service.availablePositions.forEach(position => {
			const validation = service.validatePosition(position);
			expect(validation.isValid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});
	});

	it('should handle refresh correctly', async () => {
		await service.loadPositions();
		const initialPositions = [...service.availablePositions];

		await service.refreshPositions();

		// Should still have the same 3 positions after refresh
		expect(service.availablePositions).toHaveLength(3);
		expect(service.availablePositions.map(p => p.letter)).toEqual(
			initialPositions.map(p => p.letter)
		);
	});
});
