// Health Bar Utility - Smooth animated health bars for enemies

export interface HealthBarStyle {
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  // Color thresholds: returns color based on health percentage
  getHealthColor: (healthPercent: number) => string;
}

export interface HealthBarConfig {
  // Position offset from center (y is typically negative to show above)
  offsetY: number;
  // Whether to only show when damaged
  showOnlyWhenDamaged: boolean;
  // Custom style overrides
  style?: Partial<HealthBarStyle>;
}

// Default health bar style
const DEFAULT_STYLE: HealthBarStyle = {
  width: 30,
  height: 4,
  backgroundColor: '#333333',
  borderColor: '#000000',
  borderWidth: 1,
  getHealthColor: (healthPercent: number) => {
    if (healthPercent > 0.5) return '#00ff00';
    if (healthPercent > 0.25) return '#ffff00';
    return '#ff0000';
  },
};

// Animation speed - health decreases at this rate per second (as percentage)
const HEALTH_LERP_SPEED = 1.5;

// State tracking
interface HealthBarState {
  displayedHealth: number;
  lastUpdateTime: number;
}

// Track displayed health per enemy
const healthBarStates = new Map<string, HealthBarState>();

/**
 * Get the smoothly interpolated health value for display
 */
export function getDisplayedHealth(
  enemyId: string,
  actualHealth: number,
  maxHealth: number,
  currentTime: number
): number {
  const state = healthBarStates.get(enemyId);

  if (!state) {
    // First time seeing this enemy - initialize with current health
    healthBarStates.set(enemyId, {
      displayedHealth: actualHealth,
      lastUpdateTime: currentTime,
    });
    return actualHealth;
  }

  // Calculate time delta (time is already in seconds from render context)
  const deltaTime = currentTime - state.lastUpdateTime;
  state.lastUpdateTime = currentTime;

  // Calculate actual health percentage
  const actualPercent = actualHealth / maxHealth;
  const displayedPercent = state.displayedHealth / maxHealth;

  // Only animate decreasing health (instant heal is okay)
  if (actualPercent >= displayedPercent) {
    state.displayedHealth = actualHealth;
  } else {
    // Smoothly decrease displayed health toward actual health
    const decreaseAmount = HEALTH_LERP_SPEED * maxHealth * deltaTime;
    const targetHealth = actualHealth;
    const newDisplayedHealth = Math.max(
      targetHealth,
      state.displayedHealth - decreaseAmount
    );
    state.displayedHealth = newDisplayedHealth;
  }

  return state.displayedHealth;
}

/**
 * Clean up health bar state for removed enemies
 */
export function cleanupHealthBarState(enemyId: string): void {
  healthBarStates.delete(enemyId);
}

/**
 * Clean up all health bar states (e.g., on game reset)
 */
export function resetAllHealthBarStates(): void {
  healthBarStates.clear();
}

/**
 * Draw a health bar with smooth animation
 */
export function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  enemyId: string,
  centerX: number,
  centerY: number,
  actualHealth: number,
  maxHealth: number,
  currentTime: number,
  config: HealthBarConfig
): void {
  // Check if we should show the health bar
  if (config.showOnlyWhenDamaged && actualHealth >= maxHealth) {
    return;
  }

  // Merge style with defaults
  const style: HealthBarStyle = {
    ...DEFAULT_STYLE,
    ...config.style,
    getHealthColor: config.style?.getHealthColor ?? DEFAULT_STYLE.getHealthColor,
  };

  // Get smoothly interpolated health
  const displayedHealth = getDisplayedHealth(
    enemyId,
    actualHealth,
    maxHealth,
    currentTime
  );

  const healthPercent = displayedHealth / maxHealth;
  const barX = centerX - style.width / 2;
  const barY = centerY + config.offsetY;

  // Draw background
  ctx.fillStyle = style.backgroundColor;
  ctx.fillRect(barX, barY, style.width, style.height);

  // Draw health fill
  ctx.fillStyle = style.getHealthColor(healthPercent);
  ctx.fillRect(barX, barY, style.width * healthPercent, style.height);

  // Draw border
  if (style.borderWidth > 0) {
    ctx.strokeStyle = style.borderColor;
    ctx.lineWidth = style.borderWidth;
    ctx.strokeRect(barX, barY, style.width, style.height);
  }
}

/**
 * Draw a boss-style health bar with gradient and segments
 */
export function drawBossHealthBar(
  ctx: CanvasRenderingContext2D,
  enemyId: string,
  centerX: number,
  centerY: number,
  actualHealth: number,
  maxHealth: number,
  currentTime: number,
  config: {
    width: number;
    height: number;
    offsetY: number;
    segments?: number;
    glowColor?: string;
    isFlashing?: boolean;
  }
): void {
  // Get smoothly interpolated health
  const displayedHealth = getDisplayedHealth(
    enemyId,
    actualHealth,
    maxHealth,
    currentTime
  );

  const healthPercent = displayedHealth / maxHealth;
  const barX = centerX - config.width / 2;
  const barY = centerY + config.offsetY;

  // Health bar background with border
  ctx.fillStyle = '#111111';
  ctx.fillRect(barX - 2, barY - 2, config.width + 4, config.height + 4);

  // Health bar inner background
  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, config.width, config.height);

  // Health bar fill with gradient
  const healthGradient = ctx.createLinearGradient(
    barX,
    barY,
    barX + config.width * healthPercent,
    barY
  );
  if (healthPercent > 0.5) {
    healthGradient.addColorStop(0, '#FF00FF');
    healthGradient.addColorStop(1, '#9B30FF');
  } else if (healthPercent > 0.25) {
    healthGradient.addColorStop(0, '#FF8800');
    healthGradient.addColorStop(1, '#FF4400');
  } else {
    healthGradient.addColorStop(0, '#FF0000');
    healthGradient.addColorStop(1, '#AA0000');
  }
  ctx.fillStyle = healthGradient;
  ctx.fillRect(barX, barY, config.width * healthPercent, config.height);

  // Health bar border with glow
  if (config.glowColor && !config.isFlashing) {
    ctx.shadowBlur = 5;
    ctx.shadowColor = config.glowColor;
  }
  ctx.strokeStyle = config.isFlashing ? '#FFFFFF' : '#FF00FF';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, config.width, config.height);

  // Reset shadow
  ctx.shadowBlur = 0;

  // Health bar segments (to show scale)
  if (config.segments && config.segments > 1) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < config.segments; i++) {
      const segmentX = barX + (config.width / config.segments) * i;
      ctx.beginPath();
      ctx.moveTo(segmentX, barY);
      ctx.lineTo(segmentX, barY + config.height);
      ctx.stroke();
    }
  }
}
