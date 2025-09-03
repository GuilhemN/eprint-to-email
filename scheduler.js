import cron from 'node-cron'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { getEmailConfigFromEnv, sendEmail } from './dist/emailSender.js'

const execAsync = promisify(exec)

async function runEmailJob() {
  console.log(`[${new Date().toISOString()}] Running email job...`)

  try {
    // Run the email creation script
    const { stdout, stderr } = await execAsync('node email.js')

    if (stderr) {
      console.error('Email creation stderr:', stderr)
    }

    console.log('Email creation output:', stdout)

    // Check if email was created
    const emailPath = './dist/email.html'
    if (existsSync(emailPath)) {
      console.log('Email HTML file created, sending email...')

      // Get email configuration from environment
      const emailConfig = getEmailConfigFromEnv()

      // Send the email
      await sendEmail(emailConfig, emailPath)

      console.log('Email sent successfully!')
    } else {
      console.log('No email file created (likely no new items)')
    }
  } catch (error) {
    console.error('Error in email job:', error)
  }
}

async function startScheduler() {
  console.log('Starting RSS-to-Email scheduler...')

  // Get schedule from environment variable or use default
  const schedule = process.env.SCHEDULE || '0 7 * * 1-5' // Default: Monday to Friday at 7 AM

  console.log(`Scheduled to run: ${schedule}`)

  // Validate cron expression
  if (!cron.validate(schedule)) {
    throw new Error(`Invalid cron schedule: ${schedule}`)
  }

  // Schedule the job
  cron.schedule(schedule, runEmailJob, {
    scheduled: true,
    timezone: process.env.TZ || 'UTC',
  })

  console.log('Scheduler started successfully!')

  // Run once immediately if requested
  if (process.env.RUN_IMMEDIATELY === 'true') {
    console.log('Running job immediately as requested...')
    await runEmailJob()
  }

  // Keep the process alive
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...')
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...')
    process.exit(0)
  })
}

// Start the scheduler
startScheduler().catch((error) => {
  console.error('Failed to start scheduler:', error)
  process.exit(1)
})
