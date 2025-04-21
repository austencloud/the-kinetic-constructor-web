# Service Container & Dependency Injection Implementation Guide

## Overview

This guide outlines the implementation of a modern dependency injection system for the Kinetic Constructor Web application. This approach aims to improve modularity, testability, and maintainability by:

- Centralizing service creation and management
- Replacing manual dependency handling with automated injection
- Eliminating problematic singleton patterns
- Enabling easier mocking for tests

## Implementation Steps

### 1. Create Core DI Infrastructure

#### 1.1 Service Container

```typescript
// src/lib/core/di/ServiceContainer.ts
export class ServiceContainer {
	private services: Map<string, any> = new Map();
	private factories: Map<string, () => any> = new Map();

	register<T>(token: string, instance: T): void {
		this.services.set(token, instance);
	}

	registerFactory<T>(token: string, factory: () => T): void {
		this.factories.set(token, factory);
	}

	get<T>(token: string): T {
		if (this.services.has(token)) {
			return this.services.get(token);
		}

		if (this.factories.has(token)) {
			const instance = this.factories.get(token)();
			this.services.set(token, instance);
			return instance;
		}

		throw new Error(`Service not found: ${token}`);
	}

	has(token: string): boolean {
		return this.services.has(token) || this.factories.has(token);
	}

	clear(): void {
		this.services.clear();
		this.factories.clear();
	}
}
```

#### 1.2 Service Tokens

```typescript
// src/lib/core/di/ServiceTokens.ts
export const SERVICE_TOKENS = {
	ERROR_HANDLER: 'errorHandler',
	BACKGROUND_FACTORY: 'backgroundFactory',
	SVG_MANAGER: 'svgManager',
	SEQUENCE_DATA: 'sequenceData',
	PICTOGRAPH_DATA: 'pictographData',
	THEME_SERVICE: 'themeService'
	// Add other service tokens as needed
};
```

#### 1.3 Container Provider

```typescript
// src/lib/core/di/ContainerProvider.ts
import { ServiceContainer } from './ServiceContainer';
import { browser } from '$app/environment';

// Singleton container instance
let container: ServiceContainer;

export function getContainer(): ServiceContainer {
	if (!container) {
		container = new ServiceContainer();
	}
	return container;
}

// For tests - create isolated container
export function createContainer(): ServiceContainer {
	return new ServiceContainer();
}
```

### 2. Create Service Interfaces

Define clear interfaces for your services:

```typescript
// src/lib/core/services/ErrorHandling.ts
export interface ErrorHandler {
	log(source: string, error: unknown, severity?: string): void;
	getErrors(): Array<any>;
	clearErrors(): void;
}

// Additional service interfaces...
```

### 3. Adapt Existing Services

Refactor existing services to implement these interfaces:

```typescript
// src/lib/services/ErrorHandlingService.ts
import { ErrorHandler } from '../core/services/ErrorHandling';

export class ErrorHandlingServiceImpl implements ErrorHandler {
	// Implementation...
}
```

### 4. Service Registration Module

```typescript
// src/lib/core/di/registerServices.ts
import { ServiceContainer } from './ServiceContainer';
import { SERVICE_TOKENS } from './ServiceTokens';
import { ErrorHandlingServiceImpl } from '../../services/ErrorHandlingService';
import { BackgroundFactory } from '../../components/Backgrounds/core/BackgroundFactory';
// Import other service implementations

export function registerServices(container: ServiceContainer): void {
	// Register error handler
	container.registerFactory(SERVICE_TOKENS.ERROR_HANDLER, () => new ErrorHandlingServiceImpl());

	// Register background factory
	container.register(SERVICE_TOKENS.BACKGROUND_FACTORY, BackgroundFactory);

	// Register other services...
}
```

### 5. Application Bootstrap

```typescript
// src/lib/core/bootstrap.ts
import { getContainer } from './di/ContainerProvider';
import { registerServices } from './di/registerServices';

let initialized = false;

export function bootstrapApplication(): void {
	if (initialized) return;

	const container = getContainer();
	registerServices(container);

	initialized = true;
}
```

### 6. Integration with Svelte Components

#### 6.1 Create Context for Services

```typescript
// src/lib/core/di/serviceContext.ts
import { getContext, setContext } from 'svelte';
import { SERVICE_TOKENS } from './ServiceTokens';
import type { ServiceContainer } from './ServiceContainer';

const CONTAINER_KEY = Symbol('SERVICE_CONTAINER');

export function setServiceContainer(container: ServiceContainer): void {
	setContext(CONTAINER_KEY, container);
}

export function getServiceContainer(): ServiceContainer {
	return getContext(CONTAINER_KEY);
}

export function getService<T>(token: string): T {
	const container = getServiceContainer();
	return container.get<T>(token);
}
```

#### 6.2 Root Component Provider

```svelte
<!-- src/lib/components/providers/ServiceProvider.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { bootstrapApplication } from '$lib/core/bootstrap';
	import { getContainer } from '$lib/core/di/ContainerProvider';
	import { setServiceContainer } from '$lib/core/di/serviceContext';

	onMount(() => {
		bootstrapApplication();
		setServiceContainer(getContainer());
	});
</script>

<slot></slot>
```

### 7. Usage in Components

```svelte
<!-- Example Component -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { getService } from '$lib/core/di/serviceContext';
	import { SERVICE_TOKENS } from '$lib/core/di/ServiceTokens';
	import type { ErrorHandler } from '$lib/core/services/ErrorHandling';

	let errorHandler: ErrorHandler;

	onMount(() => {
		errorHandler = getService<ErrorHandler>(SERVICE_TOKENS.ERROR_HANDLER);
		// Now use the service
	});

	function handleError(e: Error): void {
		errorHandler.log('ExampleComponent', e);
	}
</script>
```

### 8. Usage in Services (Service-to-Service Injection)

```typescript
// Example service using other services
import { getContainer } from '../core/di/ContainerProvider';
import { SERVICE_TOKENS } from '../core/di/ServiceTokens';
import type { ErrorHandler } from '../core/services/ErrorHandling';

export class PictographService {
	private errorHandler: ErrorHandler;

	constructor() {
		const container = getContainer();
		this.errorHandler = container.get<ErrorHandler>(SERVICE_TOKENS.ERROR_HANDLER);
	}

	processData() {
		try {
			// Process logic
		} catch (error) {
			this.errorHandler.log('PictographService', error);
		}
	}
}
```

### 9. Testing with DI

```typescript
// Example test
import { createContainer } from '$lib/core/di/ContainerProvider';
import { SERVICE_TOKENS } from '$lib/core/di/ServiceTokens';
import { MyService } from '$lib/services/MyService';

describe('MyService', () => {
	it('should perform expected action', () => {
		// Create an isolated container for testing
		const container = createContainer();

		// Register mock dependencies
		container.register(SERVICE_TOKENS.ERROR_HANDLER, mockErrorHandler);

		// Create service with mock dependencies
		const myService = new MyService();

		// Test the service
		expect(myService.doSomething()).toBe(expectedResult);
	});
});
```

## Migration Strategy

### Phase 1: Infrastructure Setup

- Create the core DI system files
- Define service interfaces
- Create container bootstrapping logic

### Phase 2: Service Adaptation

- Convert singleton services to DI-compatible services
- Start with core services: ErrorHandler, ThemeService, etc.
- Add service registration to the container

### Phase 3: Component Integration

- Update key components to use injected services
- Prioritize components with multiple dependencies
- Test thoroughly as components are migrated

### Phase 4: Full Adoption

- Ensure all services are properly registered
- Refactor remaining singleton usage
- Add comprehensive service documentation

## Best Practices

1. **Service Interfaces**: Always define interfaces for services before implementation
2. **Lifecycle Management**: Consider service lifecycle (singleton vs transient)
3. **Circular Dependencies**: Avoid circular dependencies between services
4. **Testing**: Design with testability in mind; use the container's isolation features
5. **Documentation**: Document service dependencies clearly

## Example Migration: ErrorHandlingService

### Before:

```typescript
// Old singleton pattern
export class ErrorHandlingService {
  private static instance: ErrorHandlingService;

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  // Implementation...
}

// Usage
const errorService = ErrorHandlingService.getInstance();
errorService.log(...);
```

### After:

```typescript
// New DI-compatible service
export class ErrorHandlingServiceImpl implements ErrorHandler {
  // Implementation...
}

// Usage in component
const errorHandler = getService<ErrorHandler>(SERVICE_TOKENS.ERROR_HANDLER);
errorHandler.log(...);

// Usage in service
constructor() {
  const container = getContainer();
  this.errorHandler = container.get<ErrorHandler>(SERVICE_TOKENS.ERROR_HANDLER);
}
```

## Performance Considerations

The DI system adds minimal overhead while providing significant architectural benefits. Token-based lookups are fast, and services are cached after first instantiation from factories.

## Future Enhancements

- Consider adding support for service decorators
- Implement automatic constructor injection
- Add service lifecycle hooks (init/destroy)
- Integrate with browser devtools for debugging

By following this guide, the Kinetic Constructor Web application will benefit from improved modularity, testability, and maintainability through a modern dependency injection approach.
