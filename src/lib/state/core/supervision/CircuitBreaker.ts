/**
 * Actor Supervision System - Circuit Breaker
 * 
 * This file contains the implementation of the circuit breaker pattern
 * to prevent cascading failures in the actor system.
 */

import { LogLevel, log } from '../logger';
import type { CircuitBreaker, CircuitBreakerOptions } from './types';
import { CircuitBreakerState } from './types';

/**
 * Implementation of the circuit breaker pattern
 */
export class DefaultCircuitBreaker implements CircuitBreaker {
  /**
   * Current state of the circuit breaker
   */
  state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  
  /**
   * Timestamps of recent failures
   */
  private failures: number[] = [];
  
  /**
   * Count of successful operations in half-open state
   */
  private successesInHalfOpen: number = 0;
  
  /**
   * Timer for automatically transitioning from open to half-open
   */
  private resetTimer: NodeJS.Timeout | null = null;
  
  /**
   * Options for the circuit breaker
   */
  private options: Required<CircuitBreakerOptions>;
  
  /**
   * ID for logging purposes
   */
  private id: string;
  
  constructor(id: string, options: CircuitBreakerOptions) {
    this.id = id;
    
    // Set default options with provided overrides
    this.options = {
      failureThreshold: options.failureThreshold,
      failureWindowMs: options.failureWindowMs,
      resetTimeoutMs: options.resetTimeoutMs,
      successThreshold: options.successThreshold
    };
    
    log(
      this.id,
      LogLevel.DEBUG,
      `[CircuitBreaker] Initialized with options:`,
      this.options
    );
  }
  
  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successesInHalfOpen++;
      
      log(
        this.id,
        LogLevel.DEBUG,
        `[CircuitBreaker] Recorded success in HALF_OPEN state (${this.successesInHalfOpen}/${this.options.successThreshold})`
      );
      
      if (this.successesInHalfOpen >= this.options.successThreshold) {
        this.transitionToClosed();
      }
    }
  }
  
  /**
   * Record a failed operation
   */
  recordFailure(error: Error): void {
    const now = Date.now();
    
    if (this.state === CircuitBreakerState.CLOSED) {
      // Add failure and remove old ones outside the window
      this.failures.push(now);
      const windowStart = now - this.options.failureWindowMs;
      this.failures = this.failures.filter(time => time >= windowStart);
      
      log(
        this.id,
        LogLevel.DEBUG,
        `[CircuitBreaker] Recorded failure in CLOSED state (${this.failures.length}/${this.options.failureThreshold})`
      );
      
      // Check if threshold is exceeded
      if (this.failures.length >= this.options.failureThreshold) {
        this.transitionToOpen();
      }
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in half-open state should reopen the circuit
      log(
        this.id,
        LogLevel.INFO,
        `[CircuitBreaker] Failure in HALF_OPEN state, reopening circuit`
      );
      
      this.transitionToOpen();
    }
    
    // In OPEN state, we just ignore failures as the circuit is already open
  }
  
  /**
   * Check if operations are allowed
   */
  isAllowed(): boolean {
    if (this.state === CircuitBreakerState.CLOSED) {
      return true;
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      return true; // Allow limited traffic in half-open state
    } else {
      return false; // No traffic allowed in open state
    }
  }
  
  /**
   * Reset the circuit breaker to closed state
   */
  reset(): void {
    log(
      this.id,
      LogLevel.INFO,
      `[CircuitBreaker] Manually resetting circuit breaker to CLOSED state`
    );
    
    this.transitionToClosed();
  }
  
  /**
   * Transition to the OPEN state
   */
  private transitionToOpen(): void {
    if (this.state !== CircuitBreakerState.OPEN) {
      log(
        this.id,
        LogLevel.WARN,
        `[CircuitBreaker] Transitioning from ${this.state} to OPEN state`
      );
      
      this.state = CircuitBreakerState.OPEN;
      this.failures = [];
      this.successesInHalfOpen = 0;
      
      // Set timer to transition to half-open after reset timeout
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }
      
      this.resetTimer = setTimeout(() => {
        this.transitionToHalfOpen();
      }, this.options.resetTimeoutMs);
      
      // Ensure timer doesn't prevent Node from exiting
      if (this.resetTimer.unref) {
        this.resetTimer.unref();
      }
    }
  }
  
  /**
   * Transition to the HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    if (this.state === CircuitBreakerState.OPEN) {
      log(
        this.id,
        LogLevel.INFO,
        `[CircuitBreaker] Transitioning from OPEN to HALF_OPEN state`
      );
      
      this.state = CircuitBreakerState.HALF_OPEN;
      this.successesInHalfOpen = 0;
    }
  }
  
  /**
   * Transition to the CLOSED state
   */
  private transitionToClosed(): void {
    log(
      this.id,
      LogLevel.INFO,
      `[CircuitBreaker] Transitioning from ${this.state} to CLOSED state`
    );
    
    this.state = CircuitBreakerState.CLOSED;
    this.failures = [];
    this.successesInHalfOpen = 0;
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }
}
