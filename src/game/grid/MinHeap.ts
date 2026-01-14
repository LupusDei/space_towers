// MinHeap - Binary heap priority queue for A* pathfinding
// Provides O(log n) insert, extractMin, and decreaseKey operations

export interface HeapNode {
  key: string;
  priority: number;
}

/**
 * MinHeap implementation using a binary heap.
 * Supports efficient insert, extractMin, and decreaseKey operations.
 */
export class MinHeap<T extends HeapNode> {
  private heap: T[] = [];
  private indexMap: Map<string, number> = new Map();

  /**
   * Get the number of elements in the heap.
   */
  get size(): number {
    return this.heap.length;
  }

  /**
   * Check if the heap is empty.
   */
  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Insert a new element into the heap.
   * Time complexity: O(log n)
   */
  insert(node: T): void {
    this.heap.push(node);
    const index = this.heap.length - 1;
    this.indexMap.set(node.key, index);
    this.bubbleUp(index);
  }

  /**
   * Extract and return the element with the minimum priority.
   * Time complexity: O(log n)
   */
  extractMin(): T | undefined {
    if (this.heap.length === 0) {
      return undefined;
    }

    const min = this.heap[0];
    this.indexMap.delete(min.key);

    if (this.heap.length === 1) {
      this.heap.pop();
      return min;
    }

    // Move last element to root and bubble down
    const last = this.heap.pop()!;
    this.heap[0] = last;
    this.indexMap.set(last.key, 0);
    this.bubbleDown(0);

    return min;
  }

  /**
   * Peek at the minimum element without removing it.
   * Time complexity: O(1)
   */
  peek(): T | undefined {
    return this.heap[0];
  }

  /**
   * Check if a key exists in the heap.
   * Time complexity: O(1)
   */
  has(key: string): boolean {
    return this.indexMap.has(key);
  }

  /**
   * Get an element by its key.
   * Time complexity: O(1)
   */
  get(key: string): T | undefined {
    const index = this.indexMap.get(key);
    if (index === undefined) {
      return undefined;
    }
    return this.heap[index];
  }

  /**
   * Decrease the priority of an existing element.
   * The new priority must be less than or equal to the current priority.
   * Time complexity: O(log n)
   */
  decreaseKey(key: string, newPriority: number): boolean {
    const index = this.indexMap.get(key);
    if (index === undefined) {
      return false;
    }

    const node = this.heap[index];
    if (newPriority > node.priority) {
      return false; // Can only decrease, not increase
    }

    node.priority = newPriority;
    this.bubbleUp(index);
    return true;
  }

  /**
   * Clear all elements from the heap.
   */
  clear(): void {
    this.heap = [];
    this.indexMap.clear();
  }

  /**
   * Bubble up element at index to maintain heap property.
   */
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].priority <= this.heap[index].priority) {
        break;
      }
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  /**
   * Bubble down element at index to maintain heap property.
   */
  private bubbleDown(index: number): void {
    const length = this.heap.length;

    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }

      if (rightChild < length && this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }

      if (smallest === index) {
        break;
      }

      this.swap(index, smallest);
      index = smallest;
    }
  }

  /**
   * Swap two elements in the heap and update index map.
   */
  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;

    this.indexMap.set(this.heap[i].key, i);
    this.indexMap.set(this.heap[j].key, j);
  }
}

/**
 * Create a new MinHeap instance.
 */
export function createMinHeap<T extends HeapNode>(): MinHeap<T> {
  return new MinHeap<T>();
}
