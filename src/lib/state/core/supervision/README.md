# Actor Supervision System

A comprehensive actor supervision system for XState v5, providing resilience, hierarchical state management, and sophisticated error recovery capabilities.

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Usage Examples](#usage-examples)
5. [API Reference](#api-reference)
6. [Testing](#testing)
7. [Migration](#migration)

## Overview

The Actor Supervision System is inspired by the Actor Model and Erlang/OTP supervision trees. It provides a robust framework for managing actor lifecycles, handling errors, and ensuring system resilience.

## Key Features

- **Hierarchical Supervision**: Organize actors into parent-child relationships for structured error handling
- **Supervision Strategies**: Choose from multiple strategies for handling actor failures
- **Automatic Recovery**: Restart actors with configurable backoff strategies
- **Health Monitoring**: Track actor health metrics and performance
- **Circuit Breaker Pattern**: Prevent cascading failures with circuit breaker implementation
- **Type Safety**: Full TypeScript support with proper generics

## Architecture

The supervision system consists of several key components:

### Core Components

- **SupervisedActor**: A wrapper around XState's Actor that adds supervision capabilities
- **Supervisor**: Manages a group of actors and applies supervision strategies
- **RootSupervisor**: A singleton supervisor that acts as the top-level supervisor
- **Supervision Strategies**: Different approaches to handling actor failures
- **Circuit Breaker**: Prevents cascading failures by failing fast when the system is unstable

### Supervision Strategies

- **Restart**: Recreates the actor with its initial state or specified snapshot
- **Stop**: Gracefully terminates the actor when it fails
- **Escalate**: Passes the failure up to the parent's supervisor
- **Resume**: Ignores the failure and continues operation

## Usage Examples

### Basic Supervision

```typescript
import { createMachine } from 'xstate';
import { createSupervisedMachine } from '$lib/state/core/machine';
import { RestartStrategy } from '$lib/state/core/supervision/strategies';

// Create a machine
const myMachine = createMachine({
  id: 'myMachine',
  initial: 'idle',
  states: {
    idle: {
      on: { START: 'active' }
    },
    active: {
      on: { STOP: 'idle' }
    }
  }
});

// Create a supervised actor with a restart strategy
const myActor = createSupervisedMachine('myActor', myMachine, {
  strategy: new RestartStrategy({
    maxRestarts: 3,
    withinTimeWindow: 10000,
    backoffType: 'exponential'
  }),
  persist: true,
  onError: (error) => {
    console.error('Actor error:', error);
  },
  onRestart: (actor) => {
    console.log('Actor restarted');
  }
});
```

### Complex Hierarchies

```typescript
import { Supervisor } from '$lib/state/core/supervision/Supervisor';
import { RootSupervisor } from '$lib/state/core/supervision/RootSupervisor';
import { RestartStrategy, EscalateStrategy } from '$lib/state/core/supervision/strategies';

// Get the root supervisor
const rootSupervisor = RootSupervisor.getInstance();

// Create a child supervisor
const databaseSupervisor = new Supervisor('database', {
  parent: rootSupervisor,
  defaultStrategy: new RestartStrategy()
});

// Create another child supervisor
const uiSupervisor = new Supervisor('ui', {
  parent: rootSupervisor,
  defaultStrategy: new EscalateStrategy()
});

// Create actors with different supervisors
const dbActor = createSupervisedMachine('database', dbMachine, {
  supervisor: databaseSupervisor
});

const uiActor = createSupervisedMachine('ui', uiMachine, {
  supervisor: uiSupervisor
});
```

### Custom Recovery Logic

```typescript
import { RestartStrategy } from '$lib/state/core/supervision/strategies';

// Create a custom restart strategy
const customStrategy = new RestartStrategy({
  maxRestarts: 5,
  withinTimeWindow: 60000,
  backoffType: 'exponential',
  preserveState: true,
  // Custom cleanup before restart
  cleanup: async (actor) => {
    await saveStateToStorage(actor.getSnapshot());
    await notifyAdminOfRestart(actor.id);
  }
});

// Use the custom strategy
const myActor = createSupervisedMachine('myActor', myMachine, {
  strategy: customStrategy
});
```

### Monitoring and Debugging

```typescript
// Get health metrics
const healthMetrics = myActor.getHealthMetrics();

console.log('Actor status:', healthMetrics.status);
console.log('Error count:', healthMetrics.errorCount);
console.log('Restart count:', healthMetrics.restartCount);
console.log('Last error:', healthMetrics.lastError?.message);
console.log('Uptime:', healthMetrics.uptime);

// Get error history from root supervisor
const errorHistory = RootSupervisor.getInstance().getErrorHistory();
console.log('System-wide errors:', errorHistory);

// Check circuit breaker state
const circuitState = RootSupervisor.getInstance().getCircuitBreakerState();
console.log('Circuit breaker state:', circuitState);
```

## API Reference

### SupervisedActor

```typescript
interface SupervisedActor<TMachine extends AnyStateMachine> extends Actor<TMachine> {
  id: string;
  strategy: SupervisionStrategy;
  supervisor?: Supervisor;
  getHealthMetrics(): ActorHealthMetrics;
  restart(preserveState?: boolean): Promise<void>;
  getMachine(): TMachine;
  getOptions(): SupervisedActorOptions<TMachine>;
  reportError(error: Error, context?: Record<string, any>): void;
  getPersistedSnapshot(): SnapshotFrom<TMachine> | undefined;
}
```

### Supervisor

```typescript
interface Supervisor {
  id: string;
  parent?: Supervisor;
  actors: Map<string, SupervisedActor<any>>;
  defaultStrategy: SupervisionStrategy;
  registerActor<TMachine>(actor: SupervisedActor<TMachine>): void;
  unregisterActor(actorId: string): void;
  handleActorError(actor: SupervisedActor<any>, error: Error, context?: Record<string, any>): Promise<void>;
  escalateError(actor: SupervisedActor<any>, error: Error, context?: Record<string, any>): Promise<void>;
  stopAllActors(): Promise<void>;
  getAllActors(): SupervisedActor<any>[];
  getActor(actorId: string): SupervisedActor<any> | undefined;
}
```

### RootSupervisor

```typescript
class RootSupervisor extends Supervisor {
  static getInstance(options?: RootSupervisorOptions): RootSupervisor;
  static resetInstance(): void;
  getErrorHistory(): SupervisionError[];
  clearErrorHistory(): void;
  resetCircuitBreaker(): void;
  getCircuitBreakerState(): string | undefined;
}
```

### Supervision Strategies

```typescript
interface SupervisionStrategy {
  type: SupervisionStrategyType;
  handleError(supervisor: Supervisor, actor: SupervisedActor<any>, error: Error): Promise<void>;
}

class RestartStrategy implements SupervisionStrategy { ... }
class StopStrategy implements SupervisionStrategy { ... }
class EscalateStrategy implements SupervisionStrategy { ... }
class ResumeStrategy implements SupervisionStrategy { ... }
```

### Circuit Breaker

```typescript
interface CircuitBreaker {
  state: CircuitBreakerState;
  recordSuccess(): void;
  recordFailure(error: Error): void;
  isAllowed(): boolean;
  reset(): void;
}
```

## Testing

The supervision system includes comprehensive tests that demonstrate its functionality:

```typescript
import { describe, it, expect } from 'vitest';
import { SupervisedActor, Supervisor, RootSupervisor } from '$lib/state/core/supervision';
import { RestartStrategy } from '$lib/state/core/supervision/strategies';

describe('Actor Supervision', () => {
  it('should restart an actor when it fails', async () => {
    // Test implementation
  });
  
  it('should escalate errors to parent supervisors', async () => {
    // Test implementation
  });
  
  // More tests...
});
```

See the `supervision.test.ts` file for complete test examples.

## Migration

For detailed instructions on migrating existing actors to use the supervision system, see the [Migration Guide](./MIGRATION_GUIDE.md).
