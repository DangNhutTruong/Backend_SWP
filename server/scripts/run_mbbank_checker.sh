#!/bin/bash
# MBBank Real Checker Setup and Run Script

echo "🚀 Setting up MBBank Real Transaction Checker..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Check if .env.mbbank exists
if [ ! -f ".env.mbbank" ]; then
    echo "⚠️ Creating .env.mbbank file from example..."
    cp .env.mbbank.example .env.mbbank
    echo "📝 Please edit .env.mbbank file and add your MBBank credentials before running the checker."
    echo "🔐 Required: MBBANK_USERNAME, MBBANK_PASSWORD"
    exit 1
fi

# Load environment variables
if [ -f ".env.mbbank" ]; then
    export $(cat .env.mbbank | xargs)
fi

# Check if required environment variables are set
if [ -z "$MBBANK_USERNAME" ] || [ -z "$MBBANK_PASSWORD" ]; then
    echo "❌ MBBank credentials not found in .env.mbbank file"
    echo "📝 Please edit .env.mbbank and set MBBANK_USERNAME and MBBANK_PASSWORD"
    exit 1
fi

echo "✅ Setup complete!"
echo "🚀 Starting MBBank Real Transaction Checker..."
python3 mbbank_real_checker.py
