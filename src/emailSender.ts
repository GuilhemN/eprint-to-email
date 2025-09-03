import nodemailer from 'nodemailer'
import { readFileSync, existsSync } from 'fs'

interface EmailConfig {
  smtpServer: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  from: string
  to: string
  subject: string
}

export async function sendEmail(config: EmailConfig, htmlFilePath: string): Promise<void> {
  if (!existsSync(htmlFilePath)) {
    throw new Error(`Email HTML file not found: ${htmlFilePath}`)
  }

  const htmlContent = readFileSync(htmlFilePath, 'utf8')

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: config.smtpServer,
    port: config.smtpPort,
    secure: config.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: config.smtpUsername,
      pass: config.smtpPassword,
    },
  })

  // Send email
  const info = await transporter.sendMail({
    from: config.from,
    to: config.to,
    subject: config.subject,
    html: htmlContent,
  })

  console.log('Email sent successfully:', info.messageId)
}

export function getEmailConfigFromEnv(): EmailConfig {
  const requiredEnvVars = ['SMTP_SERVER', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD', 'MAIL_TO', 'FROM']

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }

  return {
    smtpServer: process.env.SMTP_SERVER!,
    smtpPort: parseInt(process.env.SMTP_PORT!),
    smtpUsername: process.env.SMTP_USERNAME!,
    smtpPassword: process.env.SMTP_PASSWORD!,
    from: process.env.FROM!,
    to: process.env.MAIL_TO!,
    subject: process.env.EMAIL_SUBJECT || 'RSS to Email',
  }
}
