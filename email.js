import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { createServer as createViteServer } from 'vite'

const outputDir = './dist'

async function createEmail() {
  const vite = await createViteServer({
    appType: 'custom',
  })

  try {
    const { renderEmail } = await vite.ssrLoadModule('/src/renderEmail.tsx')
    const { getDatabase } = await vite.ssrLoadModule('/src/database.ts')

    const { html, itemCount, updatedOn } = await renderEmail({})

    if (itemCount === 0) {
      console.log('No new items in feed, skipping email')

      // Still record the run in the database even if no items
      const db = getDatabase()
      await db.recordLastRun(updatedOn, 0)

      process.exit(0)
    }

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir)
    }

    writeFileSync(`${outputDir}/email.html`, html, { flag: 'w' })

    // Record this successful run in the database
    const db = getDatabase()
    await db.recordLastRun(updatedOn, itemCount)

    console.log(`Email created successfully with ${itemCount} new items`)
    process.exit(0)
  } catch (e) {
    console.error('Error creating email:', e)
    process.exit(1)
  } finally {
    await vite.close()
  }
}

createEmail()
