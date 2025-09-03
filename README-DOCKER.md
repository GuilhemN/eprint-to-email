# RSS-to-Email with Docker Compose

A Node.js application that parses RSS feeds and sends email notifications about new items. Now containerized with Docker Compose and includes a SQLite database to track previously seen items.

## Features

- 📧 Automatically sends emails when new RSS items are detected
- 🗄️ SQLite database to track seen items and prevent duplicates
- 🐳 Docker Compose for easy deployment
- ⏰ Configurable cron schedule
- 🔧 Management tools for database maintenance
- 📊 Preview interface for development

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd rss-to-email
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your email settings
```

Required environment variables:

- `SMTP_SERVER` - Your SMTP server (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP port (e.g., 587)
- `SMTP_USERNAME` - Your email username
- `SMTP_PASSWORD` - Your email password (use app passwords for Gmail)
- `MAIL_TO` - Recipient email address
- `FROM` - Sender email address
- `SCHEDULE` - Cron schedule (default: "0 7 \* \* 1-5" - weekdays at 7 AM)

### 3. Run with Docker Compose

```bash
# Build and start the services
npm run docker:run

# View logs
npm run docker:logs

# Stop services
npm run docker:stop
```

## Services

The Docker Compose setup includes:

1. **rss-email** - Main application with scheduler
2. **rss-preview** - Development preview server (port 3000)

## Configuration

### RSS Feeds

Edit `src/feeds.ts` to configure which RSS feeds to monitor:

```typescript
export const feeds = ['https://example.com/rss.xml', 'https://another-feed.com/feed.xml']
```

### Schedule

Set the `SCHEDULE` environment variable using cron syntax:

- `0 7 * * 1-5` - Weekdays at 7 AM (default)
- `0 */6 * * *` - Every 6 hours
- `0 9,17 * * 1-5` - 9 AM and 5 PM on weekdays

## Management Commands

```bash
# Show database statistics
npm run manage stats

# Clean up old items (older than 30 days)
npm run manage cleanup

# Test email generation
npm run manage test-email

# Generate email manually (without sending)
npm run email
```

Note: These commands automatically build the TypeScript files before running.

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server with preview
npm run dev
```

The preview server will be available at http://localhost:3000

### Manual Email Generation

```bash
# Generate email without sending
npm run email

# The generated email will be in dist/email.html
```

## Database

The application uses SQLite to store:

- **seen_items** - RSS items that have been processed
- **last_runs** - History of email generation runs

The database file is stored in the `data/` directory and persisted via Docker volumes.

## Email Templates

The email templates are in `src/email/` and use React Email components. You can customize:

- `Email.tsx` - Main email layout
- `GenericFeed.tsx` - Generic RSS feed formatting
- `daringfireball/` - Custom formatting for specific feeds

## Troubleshooting

### Check Logs

```bash
npm run docker:logs
```

### Database Issues

```bash
# Check database stats
npm run manage stats

# Clean up if needed
npm run manage cleanup 30
```

### Email Not Sending

1. Verify SMTP settings in `.env`
2. For Gmail, use App Passwords instead of your regular password
3. Check if email HTML file is generated: `dist/email.html`

### No New Items

- The app only sends emails when new items are found
- Check database to see what items have been seen: `npm run manage stats`
- Items are marked as "seen" based on their GUID/ID

## Architecture

```
├── src/
│   ├── database.ts          # SQLite database management
│   ├── emailSender.ts       # Email sending functionality
│   ├── filterItems.ts       # RSS item filtering with database
│   ├── parseFeeds.ts        # RSS feed parsing
│   └── renderEmail.tsx      # Email template rendering
├── email.js                 # Email generation script
├── scheduler.js             # Cron scheduler
├── manage.js               # Database management CLI
├── docker-compose.yml      # Container orchestration
└── Dockerfile             # Container definition
```

## Security Notes

- Never commit `.env` file to version control
- Use app-specific passwords for email providers
- Keep your Docker images updated
- Consider using Docker secrets for production deployments

## License

Same as original project - check LICENSE file.
