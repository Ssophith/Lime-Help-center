#!/bin/bash
# Script to download and setup TinyMCE for self-hosting

echo "Setting up TinyMCE self-hosted..."

# Create directory
mkdir -p public/tinymce

# Download TinyMCE (you'll need to download manually or use npm)
echo "Installing TinyMCE via npm..."
npm install tinymce --save

# Copy TinyMCE files to public directory
echo "Copying TinyMCE files to public/tinymce..."
cp -r node_modules/tinymce/* public/tinymce/

echo "✅ TinyMCE setup complete!"
echo ""
echo "Alternative: Get a free API key from https://www.tiny.cloud/"
echo "Then add to .env: NEXT_PUBLIC_TINYMCE_API_KEY=your-key-here"
