#!/usr/bin/env node

import { getDatabase } from './dist/database.js'

const command = process.argv[2]

async function main() {
  const db = getDatabase()

  try {
    switch (command) {
      case 'stats':
        const stats = await db.getStats()
        console.log('Database Statistics:')
        console.log(`- Total seen items: ${stats.totalItems}`)
        console.log(`- Total runs: ${stats.totalRuns}`)
        console.log(`- Last run: ${stats.lastRun || 'Never'}`)
        break

      case 'webhook-test':
        console.log('Testing webhook endpoint...')
        const webhookUrl = process.argv[3] || 'http://localhost:8080/trigger-email'
        const webhookSecret = process.argv[4] || process.env.WEBHOOK_SECRET || 'your-secret-key'

        try {
          const response = await fetch(`${webhookUrl}?key=${webhookSecret}&send=false`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ send: false }),
          })

          const result = await response.json()

          if (response.ok) {
            console.log('✅ Webhook test successful:', result.message)
          } else {
            console.log('❌ Webhook test failed:', result.error || result.message)
          }
        } catch (error) {
          console.error('❌ Webhook test error:', error.message)
        }
        break

      case 'reset':
        // This would require additional methods in the database class
        console.log('Reset functionality would clear all data. Not implemented for safety.')
        console.log('To reset, delete the database file manually.')
        break

      case 'test-email':
        console.log('Running test email...')
        const { exec } = await import('child_process')
        const { promisify } = await import('util')
        const execAsync = promisify(exec)

        try {
          const { stdout, stderr } = await execAsync('RUN_IMMEDIATELY=true node email.js')
          console.log('Output:', stdout)
          if (stderr) console.error('Errors:', stderr)
        } catch (error) {
          console.error('Test email failed:', error)
        }
        break

      default:
        console.log('RSS-to-Email Management Tool')
        console.log('')
        console.log('Available commands:')
        console.log('  stats                    - Show database statistics')
        console.log('  test-email               - Run email generation immediately')
        console.log('  webhook-test [url] [key] - Test webhook endpoint')
        console.log('  reset                    - Reset all data (manual operation)')
        break
    }
  } finally {
    await db.close()
  }
}

main().catch(console.error)
