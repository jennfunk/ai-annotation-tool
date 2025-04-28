#!/bin/bash

echo "🔒 Securing repository to remove API keys and sensitive data..."

# Remove existing .env files
echo "Removing existing .env files..."
rm -f scripts/.env

# Create .env.example files
echo "Creating example environment files..."

# Create main example env file
cat > .env.example << EOL
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id_here
EOL

# Create scripts example env file
mkdir -p scripts
cat > scripts/.env.example << EOL
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here
EOL

echo "✅ Example environment files created"

# Create a new empty .env file for scripts
touch scripts/.env
echo "# Add your API key here - this file is git ignored" > scripts/.env
echo "OPENAI_API_KEY=" >> scripts/.env

echo ""
echo "🔑 Now add your actual OpenAI API key to scripts/.env by running:"
echo "echo 'OPENAI_API_KEY=your_new_api_key_here' > scripts/.env"
echo ""

# Commit changes but exclude .env files
echo "Preparing files for a clean Git commit..."
git rm --cached scripts/.env 2>/dev/null || true

echo ""
echo "🚀 Done! Repository is now ready for secure deployment."
echo "You can now run the following commands to commit and push:"
echo ""
echo "  git add ."
echo "  git commit -m 'Remove API keys and add environment templates'"
echo "  git push -u origin main"
echo ""
echo "Remember to configure these environment variables in your Vercel project settings!" 