// Wave Data Tests for Space Towers
// Tests the wave utility functions

import { describe, it, expect } from 'vitest';
import { calculateWaveCredits } from './waves';

describe('Wave Utilities', () => {
  describe('calculateWaveCredits', () => {
    it('returns 1 credit for wave 1', () => {
      expect(calculateWaveCredits(1)).toBe(1);
    });

    it('returns N credits for wave N', () => {
      expect(calculateWaveCredits(5)).toBe(5);
      expect(calculateWaveCredits(10)).toBe(10);
      expect(calculateWaveCredits(100)).toBe(100);
    });

    it('handles large wave numbers', () => {
      expect(calculateWaveCredits(999)).toBe(999);
    });
  });
});
