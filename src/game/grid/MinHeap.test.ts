import { describe, it, expect, beforeEach } from 'vitest';
import { MinHeap, createMinHeap, type HeapNode } from './MinHeap';

interface TestNode extends HeapNode {
  value: string;
}

function createNode(key: string, priority: number, value: string): TestNode {
  return { key, priority, value };
}

describe('MinHeap', () => {
  let heap: MinHeap<TestNode>;

  beforeEach(() => {
    heap = new MinHeap<TestNode>();
  });

  describe('basic operations', () => {
    it('should start empty', () => {
      expect(heap.isEmpty()).toBe(true);
      expect(heap.size).toBe(0);
    });

    it('should insert elements', () => {
      heap.insert(createNode('a', 5, 'A'));
      expect(heap.isEmpty()).toBe(false);
      expect(heap.size).toBe(1);
    });

    it('should extract minimum element', () => {
      heap.insert(createNode('a', 5, 'A'));
      heap.insert(createNode('b', 3, 'B'));
      heap.insert(createNode('c', 7, 'C'));

      const min = heap.extractMin();
      expect(min?.key).toBe('b');
      expect(min?.priority).toBe(3);
      expect(heap.size).toBe(2);
    });

    it('should peek without removing', () => {
      heap.insert(createNode('a', 5, 'A'));
      heap.insert(createNode('b', 3, 'B'));

      const peeked = heap.peek();
      expect(peeked?.key).toBe('b');
      expect(heap.size).toBe(2);
    });

    it('should return undefined for empty heap operations', () => {
      expect(heap.extractMin()).toBeUndefined();
      expect(heap.peek()).toBeUndefined();
    });
  });

  describe('heap ordering', () => {
    it('should maintain min-heap property', () => {
      const priorities = [5, 3, 8, 1, 9, 2, 7, 4, 6];
      priorities.forEach((p, i) => {
        heap.insert(createNode(`n${i}`, p, `V${i}`));
      });

      const extracted: number[] = [];
      while (!heap.isEmpty()) {
        extracted.push(heap.extractMin()!.priority);
      }

      expect(extracted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should handle duplicate priorities', () => {
      heap.insert(createNode('a', 5, 'A'));
      heap.insert(createNode('b', 5, 'B'));
      heap.insert(createNode('c', 5, 'C'));

      expect(heap.size).toBe(3);

      const first = heap.extractMin();
      expect(first?.priority).toBe(5);

      const second = heap.extractMin();
      expect(second?.priority).toBe(5);

      const third = heap.extractMin();
      expect(third?.priority).toBe(5);
    });
  });

  describe('has and get', () => {
    it('should check if key exists', () => {
      heap.insert(createNode('a', 5, 'A'));

      expect(heap.has('a')).toBe(true);
      expect(heap.has('b')).toBe(false);
    });

    it('should get element by key', () => {
      heap.insert(createNode('a', 5, 'A'));
      heap.insert(createNode('b', 3, 'B'));

      const nodeA = heap.get('a');
      expect(nodeA?.value).toBe('A');
      expect(nodeA?.priority).toBe(5);

      const nodeB = heap.get('b');
      expect(nodeB?.value).toBe('B');

      expect(heap.get('c')).toBeUndefined();
    });

    it('should not find removed elements', () => {
      heap.insert(createNode('a', 5, 'A'));
      heap.extractMin();

      expect(heap.has('a')).toBe(false);
      expect(heap.get('a')).toBeUndefined();
    });
  });

  describe('decreaseKey', () => {
    it('should decrease priority and reorder', () => {
      heap.insert(createNode('a', 10, 'A'));
      heap.insert(createNode('b', 5, 'B'));
      heap.insert(createNode('c', 8, 'C'));

      // B is currently min (5)
      expect(heap.peek()?.key).toBe('b');

      // Decrease A's priority to 2 (now A should be min)
      const result = heap.decreaseKey('a', 2);
      expect(result).toBe(true);

      expect(heap.peek()?.key).toBe('a');
      expect(heap.peek()?.priority).toBe(2);
    });

    it('should return false for non-existent key', () => {
      heap.insert(createNode('a', 5, 'A'));

      expect(heap.decreaseKey('b', 3)).toBe(false);
    });

    it('should return false if new priority is higher', () => {
      heap.insert(createNode('a', 5, 'A'));

      expect(heap.decreaseKey('a', 10)).toBe(false);
      expect(heap.get('a')?.priority).toBe(5); // Unchanged
    });

    it('should handle decreasing to same priority', () => {
      heap.insert(createNode('a', 5, 'A'));

      // Same priority should succeed but not change anything
      expect(heap.decreaseKey('a', 5)).toBe(true);
      expect(heap.get('a')?.priority).toBe(5);
    });

    it('should maintain heap property after multiple decreases', () => {
      heap.insert(createNode('a', 10, 'A'));
      heap.insert(createNode('b', 20, 'B'));
      heap.insert(createNode('c', 30, 'C'));
      heap.insert(createNode('d', 40, 'D'));
      heap.insert(createNode('e', 50, 'E'));

      // Decrease in various orders
      heap.decreaseKey('e', 5);
      heap.decreaseKey('c', 15);
      heap.decreaseKey('d', 8);

      // Extract all and verify order
      const extracted: string[] = [];
      while (!heap.isEmpty()) {
        extracted.push(heap.extractMin()!.key);
      }

      // e(5), d(8), a(10), c(15), b(20)
      expect(extracted).toEqual(['e', 'd', 'a', 'c', 'b']);
    });
  });

  describe('clear', () => {
    it('should remove all elements', () => {
      heap.insert(createNode('a', 5, 'A'));
      heap.insert(createNode('b', 3, 'B'));

      heap.clear();

      expect(heap.isEmpty()).toBe(true);
      expect(heap.size).toBe(0);
      expect(heap.has('a')).toBe(false);
    });
  });

  describe('stress test', () => {
    it('should handle large number of elements', () => {
      const count = 1000;
      const priorities: number[] = [];

      // Insert random priorities
      for (let i = 0; i < count; i++) {
        const priority = Math.floor(Math.random() * 10000);
        priorities.push(priority);
        heap.insert(createNode(`n${i}`, priority, `V${i}`));
      }

      // Extract all and verify sorted order
      const extracted: number[] = [];
      while (!heap.isEmpty()) {
        extracted.push(heap.extractMin()!.priority);
      }

      // Verify ascending order
      for (let i = 1; i < extracted.length; i++) {
        expect(extracted[i]).toBeGreaterThanOrEqual(extracted[i - 1]);
      }
    });
  });

  describe('createMinHeap factory', () => {
    it('should create a new MinHeap instance', () => {
      const newHeap = createMinHeap<TestNode>();
      expect(newHeap).toBeInstanceOf(MinHeap);
      expect(newHeap.isEmpty()).toBe(true);
    });
  });
});
