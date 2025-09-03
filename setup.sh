#!/bin/bash

echo "🚀 RSS-to-Email Docker Setup"
echo "=============================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your email settings before continuing!"
    echo "   Required settings:"
    echo "   - SMTP_SERVER (e.g., smtp.gmail.com)"
    echo "   - SMTP_PORT (e.g., 587)"
    echo "   - SMTP_USERNAME (your email)"
    echo "   - SMTP_PASSWORD (your app password)"
    echo "   - MAIL_TO (recipient email)"
    echo "   - FROM (sender email)"
    echo ""
    read -p "Press Enter after you've configured .env file..."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔧 Installing dependencies..."
npm install

echo ""
echo "🐳 Building Docker containers..."
docker-compose build

echo ""
echo "🎯 Starting services..."
docker-compose up -d

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Services running:"
echo "   - RSS Email Scheduler: Running in background"
echo "   - Preview Server: http://localhost:3000"
echo ""
echo "📋 Useful commands:"
echo "   npm run docker:logs    - View logs"
echo "   npm run docker:stop    - Stop services"
echo "   npm run manage stats   - Check database stats"
echo "   npm run manage test-email - Test email generation"
echo ""
echo "🔍 View logs with: npm run docker:logs"
