# Actor Supervision System Migration Guide

This guide explains how to migrate existing XState actors to use the new supervision system.

## Table of Contents

1. [Introduction](#introduction)
2. [Basic Migration](#basic-migration)
3. [Setting Up Supervision Hierarchies](#setting-up-supervision-hierarchies)
4. [Selecting Appropriate Strategies](#selecting-appropriate-strategies)
5. [Handling Persistence](#handling-persistence)
6. [Advanced Usage](#advanced-usage)

## Introduction

The Actor Supervision system provides resilience and error recovery capabilities for XState actors. It's inspired by the Actor Model and Erlang/OTP supervision trees, allowing actors to recover from failures and maintain system stability.

Key benefits:
- Automatic error recovery
- Hierarchical supervision
- Sophisticated restart strategies
- Health monitoring
- Circuit breaker patterns

## Basic Migration

### Before: Using Standard XState Actors

```typescript
// Before: Using createAppMachine
import { createMachine } from 'xstate';
import { createAppMachine } from '$lib/state/core';

const myMachine = createMachine({
  id: 'myMachine',
  // machine definition...
});

export const myService = createAppMachine('myService', myMachine, {
  persist: true,
  description: 'My service'
});
```

### After: Using Supervised Actors

```typescript
// After: Using createSupervisedMachine
import { createMachine } from 'xstate';
import { createSupervisedMachine } from '$lib/state/core/machine';
import { RestartStrategy } from '$lib/state/core/supervision/strategies';

const myMachine = createMachine({
  id: 'myMachine',
  // machine definition...
});

export const myService = createSupervisedMachine('myService', myMachine, {
  persist: true,
  description: 'My service',
  strategy: new RestartStrategy(),
  onError: (error) => {
    console.error('Error in myService:', error);
  },
  onRestart: (actor) => {
    console.log('myService restarted');
  }
});
```

## Setting Up Supervision Hierarchies

Supervision hierarchies allow you to organize actors into parent-child relationships, where parents monitor and manage their children.

### Creating a Supervisor

```typescript
import { Supervisor } from '$lib/state/core/supervision';

// Create a supervisor
const mySupervisor = new Supervisor('mySupervisor', {
  // Optional parent supervisor
  parent: parentSupervisor,
  
  // Default strategy for child actors that don't specify one
  defaultStrategy: new RestartStrategy(),
  
  // Error handler
  onError: (error) => {
    console.error('Supervisor error:', error);
  },
  
  // Enable debug logging
  debug: true
});
```

### Creating Child Actors

```typescript
// Create a supervised actor with a specific supervisor
const childActor = createSupervisedMachine('childActor', childMachine, {
  supervisor: mySupervisor,
  strategy: new RestartStrategy()
});

// Alternatively, register an existing actor with a supervisor
mySupervisor.registerActor(existingActor);
```

## Selecting Appropriate Strategies

The supervision system provides several strategies for handling actor failures:

### Restart Strategy

Restarts the actor when it fails. Good for transient errors.

```typescript
import { RestartStrategy, BackoffType } from '$lib/state/core/supervision';

const restartStrategy = new RestartStrategy({
  maxRestarts: 3,                // Maximum number of restarts
  withinTimeWindow: 10000,       // Time window in milliseconds
  backoffType: BackoffType.EXPONENTIAL, // Backoff type
  initialDelay: 100,             // Initial delay in milliseconds
  maxDelay: 30000,               // Maximum delay in milliseconds
  factor: 2,                     // Factor for exponential backoff
  resetTimeout: 30000,           // Reset failure count after stability
  preserveState: true            // Preserve state when restarting
});
```

### Stop Strategy

Gracefully terminates the actor when it fails. Good for unrecoverable errors.

```typescript
import { StopStrategy } from '$lib/state/core/supervision';

const stopStrategy = new StopStrategy({
  notifySupervisor: true,        // Notify supervisor of the stop
  cleanup: async (actor) => {    // Custom cleanup function
    // Perform cleanup
  }
});
```

### Escalate Strategy

Passes the failure up to the parent supervisor. Good for errors that should be handled at a higher level.

```typescript
import { EscalateStrategy } from '$lib/state/core/supervision';

const escalateStrategy = new EscalateStrategy({
  stopActor: false,              // Whether to stop the actor before escalating
  transformError: (error, actor) => {  // Transform the error before escalating
    return new Error(`Error in ${actor.id}: ${error.message}`);
  }
});
```

### Resume Strategy

Ignores the failure and continues operation. Good for non-critical errors.

```typescript
import { ResumeStrategy } from '$lib/state/core/supervision';

const resumeStrategy = new ResumeStrategy({
  maxErrors: 10,                 // Maximum number of errors to ignore
  withinTimeWindow: 60000,       // Time window in milliseconds
  fallbackStrategy: new StopStrategy(), // Strategy to use when max errors is exceeded
  logError: true                 // Whether to log the error
});
```

## Handling Persistence

Supervised actors support persistence just like regular actors:

```typescript
const persistedActor = createSupervisedMachine('persistedActor', machine, {
  persist: true,
  strategy: new RestartStrategy({
    preserveState: true  // Preserve state when restarting
  })
});
```

When an actor is restarted with `preserveState: true`, it will use its last snapshot to restore its state.

## Advanced Usage

### Using the Root Supervisor

The root supervisor is a singleton that acts as the top-level supervisor:

```typescript
import { RootSupervisor } from '$lib/state/core/supervision';

// Get the root supervisor
const rootSupervisor = RootSupervisor.getInstance({
  defaultStrategy: new RestartStrategy(),
  circuitBreaker: {
    failureThreshold: 5,
    failureWindowMs: 60000,
    resetTimeoutMs: 30000,
    successThreshold: 3
  },
  onError: (error) => {
    console.error('Root supervisor error:', error);
  },
  debug: true
});

// Create an actor with the root supervisor
const rootActor = createSupervisedMachine('rootActor', machine, {
  supervisor: rootSupervisor,
  strategy: new RestartStrategy()
});
```

### Handling Actor Health

Supervised actors provide health metrics:

```typescript
// Get health metrics
const healthMetrics = actor.getHealthMetrics();

console.log('Actor health:', healthMetrics.status);
console.log('Error count:', healthMetrics.errorCount);
console.log('Restart count:', healthMetrics.restartCount);
console.log('Uptime:', healthMetrics.uptime);
```

### Manually Reporting Errors

You can manually report errors to the supervision system:

```typescript
try {
  // Some operation that might fail
} catch (error) {
  actor.reportError(error, { 
    operation: 'customOperation',
    additionalContext: 'Some context'
  });
}
```

### Manually Restarting Actors

You can manually restart actors:

```typescript
// Restart with preserved state
await actor.restart(true);

// Restart with initial state
await actor.restart(false);
```
