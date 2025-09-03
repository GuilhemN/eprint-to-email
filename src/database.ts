import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

export interface SeenItem {
  id: string
  feedUrl: string
  title: string
  link: string
  pubDate: string
  createdAt: string
}

export interface LastRun {
  id: number
  timestamp: string
  itemCount: number
}

class DatabaseManager {
  private db: Database<sqlite3.Database, sqlite3.Statement> | null = null
  private dbPath: string

  constructor(dbPath: string = process.env.DB_PATH || './data/rss.db') {
    this.dbPath = dbPath
  }

  async initialize(): Promise<void> {
    if (this.db) return

    // Ensure the directory exists
    const dbDir = path.dirname(this.dbPath)
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }

    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database,
    })

    await this.initializeTables()
  }

  private async initializeTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    // Table to store seen RSS items
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS seen_items (
        id TEXT PRIMARY KEY,
        feed_url TEXT NOT NULL,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        pub_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    // Index for faster lookups
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_seen_items_feed_url ON seen_items(feed_url)
    `)

    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_seen_items_pub_date ON seen_items(pub_date)
    `)

    // Table to store last run information
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS last_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        item_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
  }

  // Check if an item has been seen before
  async hasSeenItem(id: string, feedUrl: string): Promise<boolean> {
    await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const result = await this.db.get('SELECT 1 FROM seen_items WHERE id = ? AND feed_url = ?', [id, feedUrl])
    return !!result
  }

  // Mark an item as seen
  async markItemAsSeen(item: Omit<SeenItem, 'createdAt'>): Promise<void> {
    await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    await this.db.run(
      `
      INSERT OR REPLACE INTO seen_items (id, feed_url, title, link, pub_date, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `,
      [item.id, item.feedUrl, item.title, item.link, item.pubDate],
    )
  }

  // Mark multiple items as seen
  async markItemsAsSeen(items: Omit<SeenItem, 'createdAt'>[]): Promise<void> {
    await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const stmt = await this.db.prepare(`
      INSERT OR REPLACE INTO seen_items (id, feed_url, title, link, pub_date, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `)

    for (const item of items) {
      await stmt.run([item.id, item.feedUrl, item.title, item.link, item.pubDate])
    }

    await stmt.finalize()
  }

  // Get the last successful run timestamp
  async getLastRunTimestamp(): Promise<string | null> {
    await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const result = (await this.db.get('SELECT timestamp FROM last_runs ORDER BY id DESC LIMIT 1')) as { timestamp: string } | undefined
    return result?.timestamp || null
  }

  // Record a successful run
  async recordLastRun(timestamp: string, itemCount: number): Promise<void> {
    await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    await this.db.run(
      `
      INSERT INTO last_runs (timestamp, item_count)
      VALUES (?, ?)
    `,
      [timestamp, itemCount],
    )
  }

  // Get seen items for a specific feed
  async getSeenItemsForFeed(feedUrl: string, limit: number = 100): Promise<SeenItem[]> {
    await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const results = await this.db.all(
      `
      SELECT * FROM seen_items 
      WHERE feed_url = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `,
      [feedUrl, limit],
    )
    return results as SeenItem[]
  }

  // Get statistics
  async getStats(): Promise<{ totalItems: number; totalRuns: number; lastRun: string | null }> {
    await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const itemsResult = (await this.db.get('SELECT COUNT(*) as count FROM seen_items')) as { count: number }
    const runsResult = (await this.db.get('SELECT COUNT(*) as count FROM last_runs')) as { count: number }
    const lastRunResult = (await this.db.get('SELECT timestamp FROM last_runs ORDER BY id DESC LIMIT 1')) as { timestamp: string } | undefined

    return {
      totalItems: itemsResult.count,
      totalRuns: runsResult.count,
      lastRun: lastRunResult?.timestamp || null,
    }
  }

  // Close database connection
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
    }
  }
}

// Singleton instance
let dbInstance: DatabaseManager | null = null

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager()
  }
  return dbInstance
}

export default DatabaseManager
