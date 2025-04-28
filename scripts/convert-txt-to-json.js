#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Check arguments
if (process.argv.length < 3) {
  console.log('Usage: node convert-txt-to-json.js [input-txt-file] [output-json-file]');
  process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3] || path.join(
  path.dirname(inputFile), 
  `${path.basename(inputFile, path.extname(inputFile))}.json`
);

// Function to process the text file
async function processTextFile(inputFile) {
  // Create a thread object that matches the expected format
  const thread = {
    id: `thread_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    isAnnotated: false,
    messages: [],
    annotations: []
  };

  // Set up readline interface
  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentRole = 'user'; // Default to user
  let currentContent = '';
  let lineCount = 0;
  let timestamp = new Date();

  // Process each line
  for await (const line of rl) {
    lineCount++;
    
    // Try to detect role changes
    if (line.trim() === 'user:' || line.toLowerCase().startsWith('user:')) {
      // Save previous message if any
      if (currentContent.trim()) {
        addMessage(thread, currentRole, currentContent.trim(), new Date(timestamp));
      }
      currentRole = 'user';
      currentContent = '';
      timestamp = new Date(Date.now() - (30000 * thread.messages.length)); // Make timestamps sequential
      continue;
    } else if (line.trim() === 'assistant:' || line.toLowerCase().startsWith('assistant:') || 
               line.trim() === 'ai:' || line.toLowerCase().startsWith('ai:')) {
      // Save previous message if any
      if (currentContent.trim()) {
        addMessage(thread, currentRole, currentContent.trim(), new Date(timestamp));
      }
      currentRole = 'assistant';
      currentContent = '';
      timestamp = new Date(Date.now() - (30000 * thread.messages.length)); // Make timestamps sequential
      continue;
    }
    
    // Add line to current content
    if (currentContent) {
      currentContent += '\n';
    }
    currentContent += line;
  }
  
  // Add the last message
  if (currentContent.trim()) {
    addMessage(thread, currentRole, currentContent.trim(), new Date(timestamp));
  }
  
  // Return an array with the thread (to match the import format)
  return [thread];
}

function addMessage(thread, role, content, timestamp) {
  // Remove role prefix if it exists in the content
  if (content.startsWith(role + ':')) {
    content = content.substring(role.length + 1).trim();
  }
  
  thread.messages.push({
    role: role,
    content: content,
    timestamp: timestamp.toISOString(),
    type: "message"
  });
}

// Main function
async function main() {
  try {
    console.log(`Processing ${inputFile}...`);
    
    // Check if the input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: Input file ${inputFile} does not exist.`);
      process.exit(1);
    }
    
    // Process the text file
    const threadsArray = await processTextFile(inputFile);
    
    // Write the JSON file
    fs.writeFileSync(outputFile, JSON.stringify(threadsArray, null, 2));
    
    console.log(`Successfully created ${outputFile}`);
    console.log(`Thread contains ${threadsArray[0].messages.length} messages`);
  } catch (error) {
    console.error('Error processing file:', error);
    process.exit(1);
  }
}

main(); 