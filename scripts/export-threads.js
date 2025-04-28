#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to fetch a thread with all its messages
async function fetchThreadWithMessages(threadId) {
  try {
    // Fetch thread metadata
    const thread = await openai.beta.threads.retrieve(threadId);
    
    // Fetch messages for the thread
    const messagesResponse = await openai.beta.threads.messages.list(threadId, {
      limit: 100, // Adjust as needed
    });
    
    // Fetch runs for the thread to get tool calls and responses
    const runsResponse = await openai.beta.threads.runs.list(threadId, {
      limit: 100, // Adjust as needed
    });
    
    // Return thread with messages and runs
    return {
      id: thread.id,
      created_at: new Date(thread.created_at * 1000).toISOString(),
      updated_at: thread.last_message_created_at 
        ? new Date(thread.last_message_created_at * 1000).toISOString() 
        : null,
      messages: messagesResponse.data.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        created_at: new Date(msg.created_at * 1000).toISOString(),
        thread_id: msg.thread_id,
        type: "message"
      })),
      runs: runsResponse.data.map(run => ({
        id: run.id,
        status: run.status,
        created_at: new Date(run.created_at * 1000).toISOString(),
        completed_at: run.completed_at ? new Date(run.completed_at * 1000).toISOString() : null,
        tool_calls: run.required_action?.submit_tool_outputs?.tool_calls || []
      }))
    };
  } catch (error) {
    console.error(`Error fetching thread ${threadId}:`, error);
    return null;
  }
}

// Function to create a new thread with a test message
async function createThreadWithMessage() {
  try {
    console.log('Creating a new thread...');
    const thread = await openai.beta.threads.create();
    const threadId = thread.id;
    console.log(`Created thread with ID: ${threadId}`);
    
    console.log('Adding a test message to the thread...');
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: 'This is a test message for thread export',
    });
    
    console.log('Adding an assistant message to the thread...');
    // To get an AI response, we need to create a run with an assistant
    try {
      // List assistants to get a valid assistant ID
      const assistants = await openai.beta.assistants.list({ limit: 1 });
      if (assistants.data && assistants.data.length > 0) {
        const assistantId = assistants.data[0].id;
        console.log(`Using assistant: ${assistantId}`);
        
        // Create a run to get AI response
        const run = await openai.beta.threads.runs.create(threadId, {
          assistant_id: assistantId,
        });
        
        // Wait for the run to complete (simple polling)
        let runStatus = run.status;
        console.log(`Run created, status: ${runStatus}`);
        
        // Poll 10 times max with 1 second delay between polls
        for (let i = 0; i < 10 && runStatus !== 'completed'; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const runDetails = await openai.beta.threads.runs.retrieve(threadId, run.id);
          runStatus = runDetails.status;
          console.log(`Run status: ${runStatus}`);
          
          if (runStatus === 'failed' || runStatus === 'cancelled') {
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error getting assistant response:', error);
      // Continue even if we can't get an assistant response
    }
    
    return threadId;
  } catch (error) {
    console.error('Error creating thread with message:', error);
    return null;
  }
}

// Function to transform OpenAI data to our app format
function transformToAppFormat(threads) {
  return threads.map(thread => {
    // Extract messages and organize them chronologically
    const allMessages = [...thread.messages];
    
    // Add tool calls as special message types
    thread.runs.forEach(run => {
      if (run.tool_calls && run.tool_calls.length > 0) {
        run.tool_calls.forEach(toolCall => {
          allMessages.push({
            id: toolCall.id,
            role: "ai",
            type: "tool_call",
            callId: toolCall.id,
            toolName: toolCall.function.name,
            parameters: toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {},
            timestamp: run.created_at
          });
          
          // If there are tool outputs, add them too
          if (toolCall.output) {
            allMessages.push({
              id: `response-${toolCall.id}`,
              role: "tool",
              type: "tool_response",
              content: toolCall.output,
              timestamp: run.completed_at || run.created_at
            });
          }
        });
      }
    });
    
    // Sort messages by timestamp
    allMessages.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.created_at);
      const dateB = new Date(b.timestamp || b.created_at);
      return dateA - dateB;
    });
    
    return {
      id: thread.id,
      createdAt: thread.created_at,
      updatedAt: thread.updated_at,
      isAnnotated: false,
      messages: allMessages.map(msg => {
        // Transform message to our app format
        if (msg.type === "tool_call" || msg.type === "tool_response") {
          return msg;
        }
        
        return {
          role: msg.role,
          content: Array.isArray(msg.content) 
            ? msg.content[0]?.text?.value || "" 
            : msg.content,
          timestamp: msg.created_at,
          type: "message"
        };
      }),
      annotations: []
    };
  });
}

// Main export function
async function exportThreads() {
  try {
    console.log('Creating and exporting a test thread with messages');
    
    // Create a new thread with a test message
    const threadId = await createThreadWithMessage();
    
    if (!threadId) {
      console.error('Failed to create test thread');
      return null;
    }
    
    // Fetch complete data for the thread
    console.log('Fetching thread data...');
    const thread = await fetchThreadWithMessages(threadId);
    
    if (!thread) {
      console.error(`Could not retrieve thread with ID: ${threadId}`);
      return null;
    }
    
    const fullThreads = [thread];
    
    // Transform to our app format
    const appFormattedThreads = transformToAppFormat(fullThreads);
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(outputDir, `openai-threads-${timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(appFormattedThreads, null, 2));
    
    console.log(`Successfully exported thread to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error exporting threads:', error);
    throw error;
  }
}

// Run the script if it's called directly
if (require.main === module) {
  console.log('Starting OpenAI thread export...');
  exportThreads()
    .then(filePath => {
      if (filePath) {
        console.log('Export completed successfully!');
        console.log(`Exported file: ${filePath}`);
      } else {
        console.log('Export failed to generate a file.');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Export failed:', error);
      process.exit(1);
    });
} else {
  // Export as module
  module.exports = {
    exportThreads,
    fetchThreadWithMessages,
    createThreadWithMessage
  };
} 