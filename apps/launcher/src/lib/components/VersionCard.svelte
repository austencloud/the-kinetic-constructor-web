<script lang="ts">
  import type { Version, PerformanceMetrics } from '../types/launcher.types.js'
  import { launcherState } from '../stores/launcher.svelte.js'
  import { 
    Play, 
    Square, 
    RotateCcw, 
    ExternalLink, 
    CheckCircle2, 
    AlertCircle, 
    Clock,
    Zap,
    Monitor,
    Package,
    Rocket
  } from 'lucide-svelte'

  interface Props {
    version: Version
    metrics?: PerformanceMetrics
    isSelected?: boolean
  }

  let { version, metrics, isSelected = false }: Props = $props()

  let isStarting = $state(false)
  let isStopping = $state(false)

  const statusConfig = {
    available: {
      icon: CheckCircle2,
      class: 'status-available',
      text: 'Available',
      color: 'electric-blue'
    },
    running: {
      icon: Zap,
      class: 'status-running',
      text: 'Running',
      color: 'neon-green'
    },
    starting: {
      icon: Clock,
      class: 'status-starting',
      text: 'Starting...',
      color: 'neon-orange'
    },
    stopping: {
      icon: Clock,
      class: 'status-stopping',
      text: 'Stopping...',
      color: 'neon-orange'
    },
    stopped: {
      icon: CheckCircle2,
      class: 'status-available',
      text: 'Stopped',
      color: 'electric-blue'
    },
    error: {
      icon: AlertCircle,
      class: 'status-error',
      text: 'Error',
      color: 'red-500'
    },
    'not-found': {
      icon: Package,
      class: 'status-not-found',
      text: 'Not Found',
      color: 'slate-500'
    },
    'manual-start-required': {
      icon: AlertCircle,
      class: 'status-warning',
      text: 'Manual Start Required',
      color: 'neon-orange'
    }
  }

  const currentStatus = $derived(statusConfig[version.status])
  const serverInfo = $derived(launcherState.runningServers.get(version.id))
  const IconComponent = $derived(currentStatus.icon)

  // Calculate performance percentage for progress bar
  const performanceScore = $derived(() => {
    if (!metrics) return 85 // Default good score
    const fpsScore = Math.min((metrics.fps || 60) / 60 * 100, 100)
    const memoryScore = Math.max(100 - (metrics.memory?.used || 50), 0)
    return Math.round((fpsScore + memoryScore) / 2)
  })

  async function handleStart() {
    if (isStarting || version.status === 'running') return
    
    isStarting = true
    try {
      await launcherState.startVersion(version.id)
    } catch (error) {
      console.error('Failed to start version:', error)
    } finally {
      isStarting = false
    }
  }

  async function handleStop() {
    if (isStopping || version.status !== 'running') return
    
    isStopping = true
    try {
      await launcherState.stopVersion(version.id)
    } catch (error) {
      console.error('Failed to stop version:', error)
    } finally {
      isStopping = false
    }
  }

  async function handleRestart() {
    if (version.status !== 'running') return
    
    try {
      await launcherState.restartVersion(version.id)
    } catch (error) {
      console.error('Failed to restart version:', error)
    }
  }

  function handleSelect() {
    launcherState.toggleVersionSelection(version.id)
  }

  async function openInBrowser() {
    try {
      await launcherState.openApp(version.id)
    } catch (error) {
      console.error('Failed to open app:', error)
      if (serverInfo) {
        window.open(serverInfo.url, '_blank')
      }
    }
  }

  function formatUptime(startTime: Date): string {
    const now = new Date()
    const diff = now.getTime() - startTime.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }
</script>

<div
  class="version-card glass-card group animate-scale-in {isSelected ? 'selected' : ''}"
  class:opacity-75={version.status === 'not-found'}
>
  <!-- Status indicator with pulse effect -->
  <div class="status-indicator-wrapper absolute top-4 right-4">
    <div class="status-indicator {currentStatus.class}">
      <div class="status-dot"></div>
      {#if version.status === 'running'}
        <div class="pulse-ring"></div>
      {/if}
    </div>
  </div>

  <!-- Header with electric title -->
  <div class="version-header mb-4">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="version-title text-xl font-bold mb-2">
          {version.name}
        </h3>
        <p class="version-description text-sm text-slate-400 mb-3">
          {version.description}
        </p>
        
        <!-- Status badge -->
        <div class="status-badge inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border">
          <IconComponent size={12} />
          {currentStatus.text}
        </div>
      </div>

      {#if version.status === 'available' || version.status === 'not-found'}
        <label class="version-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onchange={handleSelect}
            disabled={version.status === 'not-found'}
          />
          <div class="checkbox-custom"></div>
        </label>
      {/if}
    </div>
  </div>

  <!-- Tech Stack Tags -->
  {#if version.techStack && version.techStack.length > 0}
    <div class="tech-stack flex flex-wrap gap-2 mb-4">
      {#each version.techStack as tech}
        <span class="tech-tag">{tech}</span>
      {/each}
    </div>
  {/if}

  <!-- Performance Metrics -->
  {#if version.status === 'running'}
    <div class="metrics-section mb-4">
      <!-- Performance Score Bar -->
      <div class="performance-bar mb-3">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-slate-400 uppercase tracking-wide">Performance</span>
          <span class="text-xs font-mono text-electric-blue">{performanceScore()}%</span>
        </div>
        <div class="progress-track">
          <div 
            class="progress-fill"
            style="width: {performanceScore()}%"
          ></div>
        </div>
      </div>

      <!-- Server Info & Metrics Grid -->
      <div class="grid grid-cols-2 gap-3">
        {#if serverInfo}
          <div class="server-panel glass-card">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-neon-green font-semibold">PORT {serverInfo.port}</div>
                <div class="text-xs text-slate-400">Up {formatUptime(serverInfo.startTime)}</div>
              </div>
              <button onclick={openInBrowser} class="btn-icon" title="Open">
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        {/if}

        {#if metrics}
          <div class="metrics-panel glass-card">
            <div class="grid grid-cols-2 gap-1 text-xs">
              <div class="metric-item">
                <span class="text-slate-400">FPS</span>
                <span class="text-electric-blue font-mono">{metrics.fps || 'N/A'}</span>
              </div>
              <div class="metric-item">
                <span class="text-slate-400">MEM</span>
                <span class="text-neon-green font-mono">{metrics.memory ? `${metrics.memory.used}MB` : 'N/A'}</span>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="action-section">
    {#if version.status === 'available'}
      <button onclick={handleStart} disabled={isStarting} class="launch-button btn-electric">
        {#if isStarting}
          <Clock size={16} class="animate-spin" />
          Starting...
        {:else}
          <Rocket size={16} />
          Launch
        {/if}
      </button>
    {:else if version.status === 'running'}
      <div class="flex gap-2">
        <button onclick={handleRestart} class="btn-glass flex-1" title="Restart">
          <RotateCcw size={14} />
          Restart
        </button>
        <button onclick={handleStop} disabled={isStopping} class="btn-glass">
          {#if isStopping}
            <Clock size={14} class="animate-spin" />
          {:else}
            <Square size={14} />
          {/if}
        </button>
      </div>
    {:else if version.status === 'not-found'}
      <div class="not-found-panel">
        <Package size={24} class="mx-auto mb-2 text-slate-500" />
        <div class="text-xs text-slate-500 text-center">Version Not Found</div>
      </div>
    {:else if version.status === 'error'}
      <button onclick={handleStart} class="launch-button bg-neon-orange">
        <RotateCcw size={16} />
        Retry
      </button>
    {/if}
  </div>

  <!-- Features (Collapsible) -->
  {#if version.features && version.features.length > 0}
    <details class="features-section mt-4">
      <summary class="features-summary">
        Features ({version.features.length})
      </summary>
      <ul class="features-list mt-2 space-y-1">
        {#each version.features as feature}
          <li class="feature-item">
            <CheckCircle2 size={10} class="text-neon-green flex-shrink-0" />
            {feature}
          </li>
        {/each}
      </ul>
    </details>
  {/if}
</div>

<style>
  .version-card {
    padding: 1.5rem;
    transition: all 0.3s ease-out;
    position: relative;
    min-height: 280px;
  }

  .version-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: var(--shadow-glass), var(--shadow-electric);
  }

  .version-card.selected {
    border-color: var(--electric-blue);
    box-shadow: var(--shadow-glass), var(--shadow-electric);
  }

  .version-title {
    background: linear-gradient(135deg, var(--electric-blue) 0%, var(--cyber-blue) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .status-indicator-wrapper {
    width: 16px;
    height: 16px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    position: relative;
  }

  .status-running .status-dot {
    background: var(--neon-green);
    box-shadow: 0 0 10px var(--neon-green);
  }

  .status-available .status-dot {
    background: var(--electric-blue);
  }

  .status-error .status-dot {
    background: #ef4444;
  }

  .pulse-ring {
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border: 2px solid var(--neon-green);
    border-radius: 50%;
    animation: pulse-ring 2s ease-in-out infinite;
  }

  .status-badge {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--border-primary);
    color: var(--text-secondary);
  }

  .status-badge.status-running {
    background: rgba(16, 185, 129, 0.2);
    border-color: var(--neon-green);
    color: var(--neon-green);
  }

  .tech-tag {
    padding: 0.25rem 0.5rem;
    background: rgba(0, 212, 255, 0.2);
    color: var(--electric-blue);
    border: 1px solid var(--electric-blue);
    border-radius: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .progress-track {
    height: 4px;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--neon-green) 0%, var(--electric-blue) 100%);
    transition: width 1s ease-out;
    border-radius: 2px;
  }

  .server-panel, .metrics-panel {
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .metric-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .launch-button {
    width: 100%;
    padding: 0.875rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: var(--gradient-electric);
    color: white;
    box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
  }

  .launch-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4);
    filter: brightness(1.1);
  }

  .launch-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-glass {
    padding: 0.5rem 1rem;
    background: var(--gradient-glass);
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
    border-radius: 0.5rem;
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: all 0.2s ease-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .btn-glass:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: var(--border-secondary);
    transform: translateY(-1px);
  }

  .btn-icon {
    padding: 0.25rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.375rem;
    color: var(--electric-blue);
    cursor: pointer;
    transition: all 0.2s ease-out;
  }

  .btn-icon:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  .not-found-panel {
    padding: 1rem;
    text-align: center;
    background: rgba(100, 116, 139, 0.1);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 0.75rem;
  }

  .version-checkbox {
    position: relative;
    cursor: pointer;
  }

  .version-checkbox input {
    opacity: 0;
    position: absolute;
  }

  .checkbox-custom {
    width: 18px;
    height: 18px;
    border: 2px solid var(--border-primary);
    border-radius: 0.25rem;
    background: transparent;
    transition: all 0.2s ease-out;
  }

  .version-checkbox input:checked + .checkbox-custom {
    background: var(--gradient-electric);
    border-color: var(--electric-blue);
  }

  .checkbox-custom::after {
    content: '';
    position: absolute;
    top: 1px;
    left: 4px;
    width: 6px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    opacity: 0;
    transition: opacity 0.2s ease-out;
  }

  .version-checkbox input:checked + .checkbox-custom::after {
    opacity: 1;
  }

  .features-summary {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: color 0.2s ease-out;
  }

  .features-summary:hover {
    color: var(--electric-blue);
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-tertiary);
  }
</style>
