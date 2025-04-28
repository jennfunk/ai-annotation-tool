// Generate mock data for testing the application
// In a real app, this would be replaced with actual API calls

// Helper to generate dates within the past few days
const getRandomDate = (daysAgo = 7) => {
  const date = new Date();
  const randomDays = Math.floor(Math.random() * daysAgo);
  date.setDate(date.getDate() - randomDays);
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date.toISOString();
};

// Mock thread data
export const mockThreads = [
  {
    id: "thread_TsRwBcxyRdgzJDnsuDiANSYt",
    createdAt: "2023-02-15T08:47:00Z",
    updatedAt: "2023-02-15T12:25:00Z",
    isAnnotated: false,
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant.",
        timestamp: "2023-02-15T08:47:00Z",
        type: "message"
      },
      {
        role: "human",
        content: "Could you please specify which link you used and what assistance you need? This will help me provide the right support for you.",
        timestamp: "2023-02-15T08:48:00Z",
        type: "message"
      },
      {
        role: "human",
        content: "Got it thank you",
        timestamp: "2023-02-15T08:48:30Z",
        type: "message"
      },
      {
        role: "ai",
        content: "You're welcome! If you have any more questions or need further assistance, feel free to reach out. Have a great day!",
        timestamp: "2023-02-15T08:49:00Z",
        type: "message"
      },
      {
        role: "human",
        content: "I have an appointment at 10:30 on Wednesday. But I don't know the address for union flats",
        timestamp: "2023-02-15T12:25:00Z",
        type: "message"
      },
      {
        role: "ai",
        type: "tool_call",
        timestamp: "2023-02-15T12:25:30Z",
        callId: "call_w/twoOPeOdqZ4Yuy48RpD2RS",
        toolName: "getCommunitiesInformation"
      }
    ],
    annotations: []
  },
  {
    id: "thread_VsYCZCNOZCBJBh7Axii4Q4iC",
    createdAt: "2023-02-15T08:38:00Z",
    updatedAt: "2023-02-15T08:41:00Z",
    isAnnotated: true,
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant.",
        timestamp: "2023-02-15T08:38:00Z",
        type: "message"
      },
      {
        role: "human",
        content: "How do I reset my password?",
        timestamp: "2023-02-15T08:38:30Z",
        type: "message"
      },
      {
        role: "ai",
        content: "To reset your password, please follow these steps:\n\n1. Go to the login page\n2. Click on the 'Forgot password' link\n3. Enter your email address\n4. Check your email for a password reset link\n5. Click the link and follow the instructions to create a new password\n\nIf you don't receive the email within a few minutes, please check your spam folder. Let me know if you need any further assistance!",
        timestamp: "2023-02-15T08:39:00Z",
        type: "message"
      },
      {
        role: "human",
        content: "Thanks, it worked!",
        timestamp: "2023-02-15T08:41:00Z",
        type: "message"
      }
    ],
    annotations: [
      {
        rating: "good",
        notes: "Clear and helpful instructions for password reset.",
        tags: ["password-reset", "account"],
        timestamp: "2023-02-16T10:15:00Z",
        reviewer: {
          id: "user_123",
          name: "John Doe"
        }
      }
    ]
  },
  {
    id: "thread_DZxJF34yKUxQOXbSvyZShDQ9",
    createdAt: "2023-02-15T08:51:00Z",
    updatedAt: "2023-02-15T17:00:00Z",
    isAnnotated: false,
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant.",
        timestamp: "2023-02-15T08:51:00Z",
        type: "message"
      },
      {
        role: "human",
        content: "I need to generate a report of all sales for Q1 2023",
        timestamp: "2023-02-15T08:52:00Z",
        type: "message"
      },
      {
        role: "ai",
        content: "I'd be happy to help you generate a sales report for Q1 2023. To provide you with the most accurate information, I'll need to access your sales data. Would you like me to:",
        timestamp: "2023-02-15T08:53:00Z",
        type: "message"
      },
      {
        role: "ai",
        type: "tool_call",
        timestamp: "2023-02-15T08:53:30Z",
        callId: "call_saRt5FGHjklQrS",
        toolName: "querySalesData",
        parameters: {
          "startDate": "2023-01-01",
          "endDate": "2023-03-31",
          "format": "summary"
        }
      },
      {
        role: "tool",
        type: "tool_response",
        timestamp: "2023-02-15T08:54:00Z",
        content: {
          "status": "success",
          "totalSales": 1245750.89,
          "topProducts": [
            {"name": "Product A", "revenue": 350000},
            {"name": "Product B", "revenue": 275000},
            {"name": "Product C", "revenue": 210000}
          ],
          "monthlySummary": {
            "Jan": 386500.45,
            "Feb": 425670.25,
            "Mar": 433580.19
          }
        }
      },
      {
        role: "ai",
        content: "I've generated a report of your Q1 2023 sales. Here's a summary:\n\n**Total Sales: $1,245,750.89**\n\n**Monthly Breakdown:**\n- January: $386,500.45\n- February: $425,670.25\n- March: $433,580.19\n\n**Top Performing Products:**\n1. Product A: $350,000\n2. Product B: $275,000\n3. Product C: $210,000\n\nWould you like me to provide this report in a specific format or would you like more detailed information on any of these areas?",
        timestamp: "2023-02-15T08:55:00Z",
        type: "message"
      }
    ],
    annotations: []
  },
  {
    id: "thread_4ixLpAAY9aXCbZc8OQ4NtuL",
    createdAt: "2023-02-14T16:51:00Z",
    updatedAt: "2023-02-14T16:54:00Z",
    isAnnotated: true,
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant.",
        timestamp: "2023-02-14T16:51:00Z",
        type: "message"
      },
      {
        role: "human",
        content: "What's the weather like today in New York?",
        timestamp: "2023-02-14T16:51:30Z",
        type: "message"
      },
      {
        role: "ai",
        type: "tool_call",
        timestamp: "2023-02-14T16:51:45Z",
        callId: "call_WeatherLookup123",
        toolName: "getCurrentWeather",
        parameters: {
          "location": "New York, NY",
          "unit": "fahrenheit"
        }
      },
      {
        role: "tool",
        type: "tool_response",
        timestamp: "2023-02-14T16:52:00Z",
        content: {
          "temperature": 45,
          "condition": "Partly Cloudy",
          "humidity": 65,
          "windSpeed": 12,
          "forecast": "Slight chance of rain in the evening"
        }
      },
      {
        role: "ai",
        content: "Currently in New York, it's 45°F and partly cloudy with 65% humidity. Wind speed is around 12 mph. There's a slight chance of rain in the evening.",
        timestamp: "2023-02-14T16:52:30Z",
        type: "message"
      },
      {
        role: "human",
        content: "Thanks, should I bring an umbrella?",
        timestamp: "2023-02-14T16:53:00Z",
        type: "message"
      },
      {
        role: "ai",
        content: "Since there's a slight chance of rain in the evening, it would be a good idea to bring an umbrella, especially if you'll be out later in the day. Better safe than sorry!",
        timestamp: "2023-02-14T16:54:00Z",
        type: "message"
      }
    ],
    annotations: [
      {
        rating: "good",
        notes: "Accurate weather information and helpful advice about the umbrella.",
        tags: ["weather", "practical-advice"],
        timestamp: "2023-02-15T09:30:00Z",
        reviewer: {
          id: "user_456",
          name: "Jane Smith"
        }
      },
      {
        rating: "good",
        notes: "Appropriate use of weather tool and clear presentation of data.",
        tags: ["tool-use", "data-presentation"],
        timestamp: "2023-02-15T11:45:00Z",
        reviewer: {
          id: "user_789",
          name: "Alex Johnson"
        }
      }
    ]
  },
  {
    id: "thread_wh4RXwsyN9OC4lrTuKfLuR",
    createdAt: "2023-02-14T15:21:00Z",
    updatedAt: "2023-02-14T15:33:00Z",
    isAnnotated: false,
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant.",
        timestamp: "2023-02-14T15:21:00Z",
        type: "message"
      },
      {
        role: "human",
        content: "Can you recommend some good documentaries on space exploration?",
        timestamp: "2023-02-14T15:22:00Z",
        type: "message"
      },
      {
        role: "ai",
        content: "I'd be happy to recommend some well-regarded documentaries on space exploration! Here are several excellent options:\n\n1. **For All Mankind** (1989) - Uses actual NASA footage to tell the story of the Apollo missions\n\n2. **In the Shadow of the Moon** (2007) - Features interviews with Apollo astronauts\n\n3. **The Farthest** (2017) - About the Voyager mission\n\n4. **Apollo 11** (2019) - Stunning restored footage of the first Moon landing\n\n5. **13 Minutes to the Moon** - BBC podcast series with immersive audio\n\n6. **When We Left Earth: The NASA Missions** - Discovery Channel series covering the entire space program\n\n7. **Cosmos** (both the original with Carl Sagan and the Neil deGrasse Tyson version)\n\n8. **A Beautiful Planet** (2016) - IMAX documentary filmed by astronauts aboard the ISS\n\nDo any of these interest you in particular? I can provide more details about any of them.",
        timestamp: "2023-02-14T15:25:00Z",
        type: "message"
      },
      {
        role: "human",
        content: "Apollo 11 sounds interesting. Is it available on any streaming platforms?",
        timestamp: "2023-02-14T15:28:00Z",
        type: "message"
      },
      {
        role: "ai",
        type: "tool_call",
        timestamp: "2023-02-14T15:28:30Z",
        callId: "call_StreamingCheck456",
        toolName: "checkStreamingAvailability",
        parameters: {
          "title": "Apollo 11",
          "year": 2019,
          "type": "documentary"
        }
      },
      {
        role: "tool",
        type: "tool_response",
        timestamp: "2023-02-14T15:29:00Z",
        content: {
          "available": true,
          "platforms": [
            {"name": "Hulu", "subscription": true},
            {"name": "Amazon Prime", "subscription": true},
            {"name": "Apple TV", "rental": true, "price": 3.99},
            {"name": "Google Play", "rental": true, "price": 3.99}
          ]
        }
      },
      {
        role: "ai",
        content: "Yes, \"Apollo 11\" (2019) is currently available on several streaming platforms:\n\n- It's included with subscriptions to Hulu and Amazon Prime\n- You can rent it for $3.99 on Apple TV and Google Play\n\nThe documentary is definitely worth watching - it features stunning restored footage from the mission with no narration or interviews, allowing the visuals and audio recordings to tell the story. The restoration quality is remarkable, and it really gives you the feeling of being there during this historic moment.",
        timestamp: "2023-02-14T15:33:00Z",
        type: "message"
      }
    ],
    annotations: []
  }
];

// Export functions to simulate API calls
export const fetchThreads = () => {
  return Promise.resolve(mockThreads);
};

export const fetchThread = (id) => {
  const thread = mockThreads.find(thread => thread.id === id);
  return Promise.resolve(thread || null);
};

export const saveAnnotation = (threadId, annotation) => {
  return Promise.resolve({
    success: true,
    threadId,
    annotation
  });
};