# RSS to Email

Stay on top of your favorite RSS feeds with automated email notifications. This self-hosted solution uses Docker Compose to track RSS feeds and send you emails when new items are published.

Say goodbye to constantly checking for updates, and hello to staying informed on your own schedule.

## Features

- 📧 Automated email notifications for new RSS items
- 🗄️ SQLite database prevents duplicate notifications
- 🐳 Easy deployment with Docker Compose
- ⏰ Configurable scheduling with cron expressions
- 🔧 Built-in management tools
- 📊 Preview interface for development

## Quick Start

```bash
# Clone the repository
git clone <your-repo>
cd rss-to-email

# Run the setup script
./setup.sh
```

👉 **[See complete setup guide](README-DOCKER.md)** for detailed instructions.

## How does it work

- Container runs with configurable cron schedule
- SQLite database tracks previously seen RSS items
- Email notifications sent via SMTP when new items are detected
- Persistent storage prevents duplicate notifications

## Getting started

1. Update [feeds.ts](src/feeds.ts) with your favorite RSS feed(s)
2. Configure your environment variables in `.env`
3. Run `./setup.sh` or `npm run docker:run`
4. Done :muscle:

## Pros and cons

:fire: your data stays in your own infrastructure

:snowflake: fully customizable email

:date: receive the updates when and where you want

:poop: might have to do some tweaking

## Cron schedule

Use [crontab guru](https://crontab.guru/) to play around with the cron schedule that works best for you.

Some example schedules:

| cron             | description                                     |
| ---------------- | ----------------------------------------------- |
| 0 6 \* \* \*     | every day at 06:00                              |
| 0 9-18 \* \* 1-5 | monday to friday every hour from 09:00 to 18:00 |
| 0 10 \* \* 6     | saturday at 10:00                               |
| 0/15 \* \* \* \* | every 15 minutes                                |

The application tracks previously seen RSS items in a SQLite database, so you can stop and restart the container without losing track of what's been sent. There might be a limit to the amount of posts in a single RSS feed.

## Screenshot

Below is a screenshot of how the [Daring Fireball](https://daringfireball.net/) updates use custom styling and my own blog has a generic style.

![Example of the email](screenshot.png)

## Local dev server

This project includes a local dev server to view and modify the email template based on your RSS feeds.

Start the dev server:

```bash
npm install
npm run dev
```

## How does it work

Rendering the email starts in the [`renderEmail`](src/renderEmail.tsx) function. It will retrieve and parse the feeds, and trigger rendering the email with the [`Email`](src/email/Email.tsx) component.

## Build on top of

- [react-email](https://github.com/resendlabs/react-email)\
  This project is what triggered me to create this repo. It is still very beta, but if we can ditch all the clunky specialized tools for creating email layouts and replace them with a React / Typescript based solution :heart:
- [vite](https://vitejs.dev/)\
  For rendering and the dev server. Had to do some hacking to get it working well with HMR and my cache implementation is :poop:. But Vite itself is :fire:
- [dawidd6/action-send-mail](https://github.com/dawidd6/action-send-mail)\
  Github Action to send out emails, just bring your own SMTP provider
