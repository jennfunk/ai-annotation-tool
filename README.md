# AI Chatbot Annotation Tool

A custom interface for annotating AI chatbot outputs, designed to facilitate data labeling for training and evaluation.

## Features

- **Thread List**: View all conversation threads with filtering options for annotated/unannotated threads
- **Conversation View**: Display the full context of a selected thread, including system messages, user messages, tool calls, and tool responses
- **Annotation Panel**: Rate conversations as good/bad, add detailed notes, and tag conversations with relevant labels

## Project Structure

```
ai-annotation-tool/
├── src/
│   ├── components/
│   │   ├── ThreadList.jsx        # Left panel with list of threads
│   │   ├── ConversationView.jsx  # Center panel with conversation
│   │   └── AnnotationPanel.jsx   # Right panel with annotation tools
│   ├── styles/
│   │   └── global.css            # Global styles
│   ├── utils/
│   │   ├── helpers.js            # Helper functions
│   │   └── mockData.js           # Mock data for testing
│   ├── App.jsx                   # Main application component
│   ├── index.js                  # Entry point
│   └── index.html                # HTML template
├── .babelrc                      # Babel configuration
├── package.json                  # Project dependencies
├── webpack.config.js             # Webpack configuration
└── README.md                     # This file
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Open http://localhost:8080 in your browser

## Usage

1. Select a thread from the left panel
2. Review the conversation in the center panel
3. Add annotations in the right panel:
   - Rate the conversation as good or bad
   - Add notes about any issues or interesting aspects
   - Add relevant tags
4. Click "Update Annotation" to save

## Integration

In a production environment, you would replace the mock data with real API calls to your data pipeline. The key integration points are:

- `fetchThreads()` - Get all conversation threads
- `fetchThread(id)` - Get a specific thread by ID
- `saveAnnotation(threadId, annotation)` - Save annotation data

## License

MIT 