/**
 * Event Database Service - Persistent storage for historical event tracking
 * Uses IndexedDB for browser-based storage of conflict events
 */

import { TimelineEvent, Alert, Casualties, ConflictData } from '../types';

interface StoredEvent extends TimelineEvent {
  storedAt: string;
  sourceArticles?: string[]; // URLs of source articles
  verificationStatus?: 'pending' | 'verified' | 'disputed';
  relatedEvents?: string[]; // IDs of related events
}

interface DailySnapshot {
  id: string;
  date: string;
  casualties: Casualties;
  activeOperations: string[];
  threatLevel: number;
  economicImpact: {
    oilPrice: number;
    shippingDisruption: string;
  };
  timestamp: string;
}

interface EventStatistics {
  totalEvents: number;
  eventsByType: { [key: string]: number };
  eventsBySeverity: { [key: string]: number };
  mostActiveLocations: { location: string; count: number }[];
  peakActivityDays: { date: string; count: number }[];
  averageConfidence: number;
}

class EventDatabase {
  private dbName = 'ConflictTrackerDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDatabase();
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: 'id' });
          eventStore.createIndex('timestamp', 'timestamp', { unique: false });
          eventStore.createIndex('type', 'type', { unique: false });
          eventStore.createIndex('severity', 'severity', { unique: false });
          eventStore.createIndex('location', 'location', { unique: false });
          eventStore.createIndex('confidence', 'confidence', { unique: false });
          eventStore.createIndex('storedAt', 'storedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('alerts')) {
          const alertStore = db.createObjectStore('alerts', { keyPath: 'id' });
          alertStore.createIndex('timestamp', 'timestamp', { unique: false });
          alertStore.createIndex('type', 'type', { unique: false });
          alertStore.createIndex('severity', 'severity', { unique: false });
        }

        if (!db.objectStoreNames.contains('snapshots')) {
          const snapshotStore = db.createObjectStore('snapshots', { keyPath: 'id' });
          snapshotStore.createIndex('date', 'date', { unique: true });
          snapshotStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('statistics')) {
          db.createObjectStore('statistics', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Store a new event
   */
  async storeEvent(event: TimelineEvent): Promise<void> {
    if (!this.db) await this.initializeDatabase();

    const storedEvent: StoredEvent = {
      ...event,
      storedAt: new Date().toISOString(),
      sourceArticles: event.metadata?.url ? [event.metadata.url] : [],
      verificationStatus: (event.metadata as any)?.verified ? 'verified' : 'pending'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readwrite');
      const store = transaction.objectStore('events');
      const request = store.put(storedEvent);

      request.onsuccess = () => {
        this.updateStatistics();
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to store event:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Store multiple events
   */
  async storeEvents(events: TimelineEvent[]): Promise<void> {
    if (!this.db) await this.initializeDatabase();

    const transaction = this.db!.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');

    for (const event of events) {
      const storedEvent: StoredEvent = {
        ...event,
        storedAt: new Date().toISOString(),
        sourceArticles: event.metadata?.url ? [event.metadata.url] : [],
        verificationStatus: (event.metadata as any)?.verified ? 'verified' : 'pending'
      };
      store.put(storedEvent);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        this.updateStatistics();
        resolve();
      };

      transaction.onerror = () => {
        console.error('Failed to store events:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Retrieve events by date range
   */
  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<StoredEvent[]> {
    if (!this.db) await this.initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      const index = store.index('timestamp');
      
      const range = IDBKeyRange.bound(
        startDate.toISOString(),
        endDate.toISOString()
      );

      const request = index.openCursor(range);
      const events: StoredEvent[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          events.push(cursor.value);
          cursor.continue();
        } else {
          resolve(events);
        }
      };

      request.onerror = () => {
        console.error('Failed to retrieve events:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get events by type
   */
  async getEventsByType(type: string): Promise<StoredEvent[]> {
    if (!this.db) await this.initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      const index = store.index('type');
      const request = index.getAll(type);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Failed to retrieve events by type:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get events by location
   */
  async getEventsByLocation(location: string): Promise<StoredEvent[]> {
    if (!this.db) await this.initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      const index = store.index('location');
      const request = index.getAll(location);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Failed to retrieve events by location:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get high-confidence events only
   */
  async getVerifiedEvents(minConfidence: number = 0.7): Promise<StoredEvent[]> {
    if (!this.db) await this.initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      const request = store.getAll();

      request.onsuccess = () => {
        const events = request.result.filter(event => 
          (event.confidence || 0) >= minConfidence &&
          event.verificationStatus === 'verified'
        );
        resolve(events);
      };

      request.onerror = () => {
        console.error('Failed to retrieve verified events:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Store daily snapshot
   */
  async storeDailySnapshot(data: ConflictData): Promise<void> {
    if (!this.db) await this.initializeDatabase();

    const today = new Date().toISOString().split('T')[0];
    const snapshot: DailySnapshot = {
      id: `snapshot-${today}`,
      date: today,
      casualties: data.casualties,
      activeOperations: data.timeline
        .filter(e => e.metadata?.entities?.operations)
        .flatMap(e => e.metadata!.entities!.operations!)
        .map(op => op),
      threatLevel: data.threatLevel.globalLevel,
      economicImpact: {
        oilPrice: 92.45, // Would come from economic data service
        shippingDisruption: 'severe'
      },
      timestamp: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['snapshots'], 'readwrite');
      const store = transaction.objectStore('snapshots');
      const request = store.put(snapshot);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to store snapshot:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get historical snapshots
   */
  async getHistoricalSnapshots(days: number = 30): Promise<DailySnapshot[]> {
    if (!this.db) await this.initializeDatabase();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['snapshots'], 'readonly');
      const store = transaction.objectStore('snapshots');
      const index = store.index('date');
      
      const range = IDBKeyRange.bound(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      const request = index.openCursor(range);
      const snapshots: DailySnapshot[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          snapshots.push(cursor.value);
          cursor.continue();
        } else {
          resolve(snapshots);
        }
      };

      request.onerror = () => {
        console.error('Failed to retrieve snapshots:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update statistics
   */
  private async updateStatistics(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['events', 'statistics'], 'readwrite');
    const eventStore = transaction.objectStore('events');
    const statsStore = transaction.objectStore('statistics');

    const allEvents = await new Promise<StoredEvent[]>((resolve, reject) => {
      const request = eventStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Calculate statistics
    const stats: EventStatistics = {
      totalEvents: allEvents.length,
      eventsByType: {},
      eventsBySeverity: {},
      mostActiveLocations: [],
      peakActivityDays: [],
      averageConfidence: 0
    };

    // Count by type
    allEvents.forEach(event => {
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
      stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;
    });

    // Calculate location frequency
    const locationCounts = new Map<string, number>();
    allEvents.forEach(event => {
      const count = locationCounts.get(event.location) || 0;
      locationCounts.set(event.location, count + 1);
    });

    stats.mostActiveLocations = Array.from(locationCounts.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate average confidence
    const confidenceSum = allEvents.reduce((sum, event) => sum + (event.confidence || 0), 0);
    stats.averageConfidence = allEvents.length > 0 ? confidenceSum / allEvents.length : 0;

    // Store statistics
    statsStore.put({ id: 'current', ...stats });
  }

  /**
   * Get current statistics
   */
  async getStatistics(): Promise<EventStatistics | null> {
    if (!this.db) await this.initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['statistics'], 'readonly');
      const store = transaction.objectStore('statistics');
      const request = store.get('current');

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Failed to retrieve statistics:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Search events by keyword
   */
  async searchEvents(keyword: string): Promise<StoredEvent[]> {
    if (!this.db) await this.initializeDatabase();

    const lowerKeyword = keyword.toLowerCase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      const request = store.getAll();

      request.onsuccess = () => {
        const events = request.result.filter(event => 
          event.title.toLowerCase().includes(lowerKeyword) ||
          event.description.toLowerCase().includes(lowerKeyword) ||
          event.location.toLowerCase().includes(lowerKeyword)
        );
        resolve(events);
      };

      request.onerror = () => {
        console.error('Failed to search events:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear old events (cleanup)
   */
  async clearOldEvents(daysToKeep: number = 90): Promise<number> {
    if (!this.db) await this.initializeDatabase();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readwrite');
      const store = transaction.objectStore('events');
      const index = store.index('storedAt');
      
      const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
      const request = index.openCursor(range);
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          this.updateStatistics();
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        console.error('Failed to clear old events:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Export data for backup
   */
  async exportData(): Promise<{
    events: StoredEvent[];
    snapshots: DailySnapshot[];
    statistics: EventStatistics | null;
  }> {
    if (!this.db) await this.initializeDatabase();

    const events = await new Promise<StoredEvent[]>((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readonly');
      const request = transaction.objectStore('events').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const snapshots = await new Promise<DailySnapshot[]>((resolve, reject) => {
      const transaction = this.db!.transaction(['snapshots'], 'readonly');
      const request = transaction.objectStore('snapshots').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const statistics = await this.getStatistics();

    return { events, snapshots, statistics };
  }
}

export const eventDatabase = new EventDatabase();