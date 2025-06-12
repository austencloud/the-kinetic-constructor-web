import type { 
  Version, 
  ServerInfo, 
  LauncherSettings, 
  PerformanceMetrics,
  ComparisonResult,
  LogEntry
} from '../types/launcher.types.js'
import { versionDetector } from '../services/version-detector.js'
import { devServerManager } from '../services/dev-server-manager.js'
import { portManager } from '../services/port-manager.js'

export class LauncherState {
  // Core state
  versions = $state<Version[]>([])
  runningServers = $state<Map<string, ServerInfo>>(new Map())
  activeVersion = $state<string | null>(null)
  isLoading = $state(false)
  error = $state<string | null>(null)

  // UI state
  selectedVersions = $state<string[]>([])
  showComparison = $state(false)
  showLogs = $state(false)
  showPerformanceMetrics = $state(true)

  // Settings
  settings = $state<LauncherSettings>({
    autoStart: false,
    defaultVersion: null,
    theme: 'system',
    showPerformanceMetrics: true,
    logLevel: 'info'
  })

  // Performance tracking
  performanceMetrics = $state<Map<string, PerformanceMetrics>>(new Map())
  comparisonResults = $state<ComparisonResult[]>([])

  // Logs
  logs = $state<Map<string, LogEntry[]>>(new Map())

  // Derived state
  availableVersions = $derived(
    this.versions.filter(v => v.status === 'available' || v.status === 'running')
  )

  runningVersions = $derived(
    this.versions.filter(v => v.status === 'running')
  )

  hasRunningServers = $derived(
    this.runningServers.size > 0
  )

  canCompare = $derived(
    this.selectedVersions.length === 2 && 
    this.selectedVersions.every(id => 
      this.versions.find(v => v.id === id)?.status === 'running'
    )
  )

  constructor() {
    // Load settings from localStorage immediately
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('launcher-settings')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          Object.assign(this.settings, parsed)
        } catch (error) {
          console.warn('Failed to load settings:', error)
        }
      }
    }
  }

  // Method to set up effects - call this from a component
  setupEffects() {
    // Auto-refresh versions every 30 seconds
    $effect(() => {
      const interval = setInterval(() => {
        this.refreshVersions()
      }, 30000)

      return () => clearInterval(interval)
    })

    // Auto-update performance metrics for running servers
    $effect(() => {
      if (this.settings.showPerformanceMetrics && this.hasRunningServers) {
        const interval = setInterval(() => {
          this.updatePerformanceMetrics()
        }, 5000)

        return () => clearInterval(interval)
      }
    })

    // Save settings to localStorage when changed
    $effect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('launcher-settings', JSON.stringify(this.settings))
      }
    })
  }

  async initialize(): Promise<void> {
    this.isLoading = true
    this.error = null

    try {
      await this.refreshVersions()
      
      // Auto-start default version if configured
      if (this.settings.autoStart && this.settings.defaultVersion) {
        const defaultVersion = this.versions.find(v => v.id === this.settings.defaultVersion)
        if (defaultVersion && defaultVersion.status === 'available') {
          await this.startVersion(defaultVersion.id)
        }
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to initialize launcher'
      console.error('Launcher initialization failed:', error)
    } finally {
      this.isLoading = false
    }
  }

  async refreshVersions(): Promise<void> {
    try {
      const detectedVersions = await versionDetector.detectVersions()
      
      // Update versions while preserving running status
      this.versions = detectedVersions.map(detected => {
        const existing = this.versions.find(v => v.id === detected.id)
        if (existing && existing.status === 'running') {
          return { ...detected, status: 'running' }
        }
        return detected
      })
    } catch (error) {
      console.error('Failed to refresh versions:', error)
      this.error = 'Failed to detect versions'
    }
  }

  async startVersion(versionId: string): Promise<void> {
    const version = this.versions.find(v => v.id === versionId)
    if (!version) {
      throw new Error(`Version ${versionId} not found`)
    }

    if (version.status === 'running') {
      return
    }

    try {
      // Update status to starting
      version.status = 'starting'
      
      const serverInfo = await devServerManager.start(version)
      
      // Update state
      version.status = 'running'
      version.lastStarted = new Date()
      this.runningServers.set(versionId, serverInfo)
      this.activeVersion = versionId

      // Start collecting logs
      this.startLogCollection(versionId)

    } catch (error) {
      version.status = 'error'
      throw error
    }
  }

  async stopVersion(versionId: string): Promise<void> {
    const version = this.versions.find(v => v.id === versionId)
    if (!version) {
      throw new Error(`Version ${versionId} not found`)
    }

    try {
      version.status = 'stopping'
      
      await devServerManager.stop(versionId)
      
      // Update state
      version.status = 'available'
      this.runningServers.delete(versionId)
      this.performanceMetrics.delete(versionId)
      this.logs.delete(versionId)

      if (this.activeVersion === versionId) {
        this.activeVersion = null
      }

    } catch (error) {
      version.status = 'error'
      throw error
    }
  }

  async restartVersion(versionId: string): Promise<void> {
    await this.stopVersion(versionId)
    await new Promise(resolve => setTimeout(resolve, 1000))
    await this.startVersion(versionId)
  }

  async openApp(versionId: string): Promise<void> {
    try {
      await devServerManager.openApp(versionId)
    } catch (error) {
      console.error(`Failed to open app ${versionId}:`, error)
      throw error
    }
  }

  async compareVersions(version1Id: string, version2Id: string): Promise<void> {
    const v1 = this.versions.find(v => v.id === version1Id)
    const v2 = this.versions.find(v => v.id === version2Id)

    if (!v1 || !v2) {
      throw new Error('One or both versions not found')
    }

    // Start both versions if not running
    if (v1.status !== 'running') {
      await this.startVersion(version1Id)
    }
    if (v2.status !== 'running') {
      await this.startVersion(version2Id)
    }

    // Collect comparison data
    const metrics1 = this.performanceMetrics.get(version1Id)
    const metrics2 = this.performanceMetrics.get(version2Id)

    if (metrics1 && metrics2) {
      const comparison: ComparisonResult = {
        versions: [version1Id, version2Id],
        metrics: {
          performance: {
            fps: [metrics1.fps || 0, metrics2.fps || 0],
            memory: [metrics1.memory?.used || 0, metrics2.memory?.used || 0],
            loadTime: [metrics1.loadTime || 0, metrics2.loadTime || 0],
            bundleSize: [metrics1.bundleSize || 0, metrics2.bundleSize || 0]
          },
          features: {
            common: v1.features?.filter(f => v2.features?.includes(f)) || [],
            unique: [
              v1.features?.filter(f => !v2.features?.includes(f)) || [],
              v2.features?.filter(f => !v1.features?.includes(f)) || []
            ],
            missing: [[], []] // Would need more sophisticated analysis
          },
          techStack: {
            dependencies: {
              common: v1.techStack?.filter(t => v2.techStack?.includes(t)) || [],
              unique: [
                v1.techStack?.filter(t => !v2.techStack?.includes(t)) || [],
                v2.techStack?.filter(t => !v1.techStack?.includes(t)) || []
              ],
              versions: {} // Would need package.json analysis
            },
            devDependencies: {
              common: [],
              unique: [[], []],
              versions: {}
            }
          }
        },
        timestamp: new Date()
      }

      this.comparisonResults.unshift(comparison)
      
      // Keep only last 10 comparisons
      if (this.comparisonResults.length > 10) {
        this.comparisonResults.splice(10)
      }
    }

    this.selectedVersions = [version1Id, version2Id]
    this.showComparison = true
  }

  toggleVersionSelection(versionId: string): void {
    const index = this.selectedVersions.indexOf(versionId)
    if (index >= 0) {
      this.selectedVersions.splice(index, 1)
    } else if (this.selectedVersions.length < 2) {
      this.selectedVersions.push(versionId)
    } else {
      // Replace first selection
      this.selectedVersions[0] = this.selectedVersions[1]
      this.selectedVersions[1] = versionId
    }
  }

  private async updatePerformanceMetrics(): Promise<void> {
    for (const [versionId] of this.runningServers) {
      try {
        const metrics = await devServerManager.getPerformanceMetrics(versionId)
        if (metrics) {
          this.performanceMetrics.set(versionId, metrics)
        }
      } catch (error) {
        console.warn(`Failed to get metrics for ${versionId}:`, error)
      }
    }
  }

  private async startLogCollection(versionId: string): Promise<void> {
    const collectLogs = async () => {
      try {
        const logs = await devServerManager.getLogs(versionId)
        this.logs.set(versionId, logs)
      } catch (error) {
        console.warn(`Failed to collect logs for ${versionId}:`, error)
      }
    }

    // Initial collection
    await collectLogs()

    // Set up periodic collection
    const interval = setInterval(collectLogs, 2000)

    // Clean up when server stops
    const cleanup = () => {
      clearInterval(interval)
    }

    // Store cleanup function (in a real app, you'd want better cleanup management)
    setTimeout(() => {
      if (!this.runningServers.has(versionId)) {
        cleanup()
      }
    }, 1000)
  }

  // Settings methods
  updateSettings(updates: Partial<LauncherSettings>): void {
    Object.assign(this.settings, updates)
  }

  setDefaultVersion(versionId: string | null): void {
    this.settings.defaultVersion = versionId
  }

  setTheme(theme: LauncherSettings['theme']): void {
    this.settings.theme = theme
  }

  // UI methods
  clearError(): void {
    this.error = null
  }

  closeComparison(): void {
    this.showComparison = false
    this.selectedVersions = []
  }

  toggleLogs(): void {
    this.showLogs = !this.showLogs
  }

  togglePerformanceMetrics(): void {
    this.settings.showPerformanceMetrics = !this.settings.showPerformanceMetrics
  }
}

export const launcherState = new LauncherState()
