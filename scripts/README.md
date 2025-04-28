# OpenAI Thread Exporter

This script exports your OpenAI threads to a JSON format that can be imported into the LLM Grader.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   You can optionally set a limit for the number of threads to export:
   ```
   THREAD_LIMIT=50
   ```

## Usage

Run the script:

```bash
npm run export
```

This will:
1. Fetch all threads from your OpenAI account
2. Fetch all messages for each thread
3. Fetch all runs and tool calls for each thread
4. Transform the data into the format expected by the LLM Grader
5. Save the exported data to `../exports/openai-threads-[timestamp].json`

## Importing into LLM Grader

1. Run the export script to generate the JSON file
2. Open the LLM Grader application
3. Click "Import Threads" in the header
4. Select the exported JSON file
5. Click "Import"

## Data Format

The exported data follows this format:

```json
[
  {
    "id": "thread_abc123",
    "createdAt": "2023-04-26T12:34:56Z",
    "updatedAt": "2023-04-26T12:45:67Z",
    "isAnnotated": false,
    "messages": [
      {
        "role": "human",
        "content": "Hello, can you help me?",
        "timestamp": "2023-04-26T12:34:56Z",
        "type": "message"
      },
      {
        "role": "ai",
        "content": "Of course! What can I help you with?",
        "timestamp": "2023-04-26T12:35:00Z",
        "type": "message"
      }
    ],
    "annotations": []
  }
]
```

## Troubleshooting

- **API Key Issues**: Make sure your OpenAI API key is correctly set in the `.env` file
- **Rate Limiting**: If you hit rate limits, try setting a lower `THREAD_LIMIT` value
- **Large Datasets**: For very large thread collections, the script may take some time to run

## License

MIT 