#!/usr/bin/env node

import express from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync, unlinkSync } from 'fs'
import { getEmailConfigFromEnv, sendEmail } from './dist/emailSender.js'

const execAsync = promisify(exec)
const app = express()
const port = process.env.WEBHOOK_PORT || 8080

// Get webhook secret from environment
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key'

// Middleware to parse JSON
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Email generation webhook
app.post('/trigger-email', async (req, res) => {
  try {
    // Check for secret key in query params or body
    const secret = req.query.key || req.body.key

    if (!secret || secret !== WEBHOOK_SECRET) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing secret key',
      })
    }

    console.log(`[${new Date().toISOString()}] Webhook triggered - generating email...`)

    // Run the email creation script
    const { stdout, stderr } = await execAsync('node email.js')

    if (stderr) {
      console.error('Email creation stderr:', stderr)
    }

    console.log('Email creation output:', stdout)

    // Check if email was created
    const emailPath = './dist/email.html'
    if (existsSync(emailPath)) {
      console.log('Email HTML file created')

      // Check if email configuration is available
      const hasEmailConfig = process.env.SMTP_SERVER && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD && process.env.MAIL_TO

      // Check if we should send the email (default: true if config is available, false otherwise)
      const shouldSend = hasEmailConfig && req.query.send !== 'false' && req.body.send !== false

      if (shouldSend) {
        console.log('Sending email...')

        try {
          // Get email configuration from environment
          const emailConfig = getEmailConfigFromEnv()

          // Send the email
          await sendEmail(emailConfig, emailPath)

          // Clean up the email file after sending
          try {
            unlinkSync(emailPath)
          } catch (e) {
            // Ignore if file does not exist or cannot be deleted
          }

          console.log('Email sent successfully!')

          res.json({
            success: true,
            message: 'Email generated and sent successfully',
            timestamp: new Date().toISOString(),
          })
        } catch (emailError) {
          console.error('Failed to send email:', emailError.message)

          // If email sending fails, still return success for generation
          res.json({
            success: true,
            message: `Email generated successfully but failed to send: ${emailError.message}`,
            warning: 'Email sending failed',
            timestamp: new Date().toISOString(),
          })
        }
      } else {
        const reason = !hasEmailConfig ? 'email configuration missing' : 'send=false'
        console.log(`Email generated but not sent (${reason})`)

        res.json({
          success: true,
          message: `Email generated successfully (not sent: ${reason})`,
          timestamp: new Date().toISOString(),
        })
      }
    } else {
      console.log('No email file created (likely no new items)')

      res.json({
        success: true,
        message: 'No new items found, email not generated',
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Error in webhook:', error)

    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    })
  }
})

// GET version for simple triggers
app.get('/trigger-email', async (req, res) => {
  // Redirect GET requests to POST handler
  req.method = 'POST'
  return app._router.handle(req, res)
})

// Start the webhook server
app.listen(port, '0.0.0.0', () => {
  console.log(`Webhook server started on port ${port}`)
  console.log(`Health check: http://localhost:${port}/health`)
  console.log(`Trigger endpoint: http://localhost:${port}/trigger-email?key=${WEBHOOK_SECRET}`)
  console.log(`Webhook secret: ${WEBHOOK_SECRET}`)
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down webhook server gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down webhook server gracefully...')
  process.exit(0)
})
