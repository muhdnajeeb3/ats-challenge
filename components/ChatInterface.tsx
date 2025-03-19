// components/ChatInterface.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Define message type
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

// Define question type
type Question = {
  id: number;
  question: string;
  category: string;
  relevance: string;
};

type InterviewData = {
  jobDescription: string;
  candidateName: string;
  questions: Question[];
  cvContent: string;
};

export default function ChatInterface() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);
  const [responseTimeData, setResponseTimeData] = useState<Record<number, number>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load interview data from localStorage
  useEffect(() => {
    try {
      const data = localStorage.getItem('interviewData');
      if (data) {
        setInterviewData(JSON.parse(data));
      } else {
        // Redirect if no interview data found
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading interview data:', error);
      router.push('/');
    }
  }, [router]);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Start interview with introduction
  const startInterview = () => {
    if (!interviewData) return;
    
    setInterviewStarted(true);
    
    // Add welcome message
    addMessage({
      id: 'intro',
      role: 'assistant',
      content: `Hello ${interviewData.candidateName}! I'll be conducting your interview today. I'll ask you several questions to understand your qualifications better. Let's begin with the first question.`,
      timestamp: Date.now(),
    });
    
    // Send first question after a short delay
    setTimeout(() => {
      if (interviewData.questions && interviewData.questions.length > 0) {
        sendQuestion(0);
      }
    }, 1000);
  };
  
  // Function to send a question
  const sendQuestion = (index: number) => {
    if (!interviewData || !interviewData.questions || index >= interviewData.questions.length) {
      finishInterview();
      return;
    }
    
    const question = interviewData.questions[index];
    
    addMessage({
      id: `q-${question.id}`,
      role: 'assistant',
      content: question.question,
      timestamp: Date.now(),
    });
    
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now());
  };
  
  // Function to add a message to the chat
  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };
  
  // Handle sending a user response
  const handleSendResponse = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    // Calculate response time
    if (questionStartTime) {
      const responseTime = Date.now() - questionStartTime;
      setResponseTimeData((prev) => ({
        ...prev,
        [currentQuestionIndex]: responseTime
      }));
    }
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
    };
    
    addMessage(userMessage);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Simple delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Move to next question
      const nextIndex = currentQuestionIndex + 1;
      if (interviewData?.questions && nextIndex < interviewData.questions.length) {
        sendQuestion(nextIndex);
        setCurrentQuestionIndex(nextIndex);
      } else {
        finishInterview();
      }
      
    } catch (error) {
      console.error('Error processing response:', error);
    } finally {
      setIsLoading(false);
      setQuestionStartTime(null);
    }
  };
  
  // Finish the interview and prepare for scoring
  const finishInterview = () => {
    setInterviewFinished(true);
    
    addMessage({
      id: 'finish',
      role: 'assistant',
      content: 'Thank you for participating in this interview. Ill now analyze your responses to provide feedback. Please wait a moment...',
      timestamp: Date.now(),
    });
    
    // Save interview data for scoring
    localStorage.setItem('interviewResults', JSON.stringify({
      messages,
      responseTimeData,
      jobDescription: interviewData?.jobDescription,
      cvContent: interviewData?.cvContent
    }));
    
    // Redirect to results page after a short delay
    setTimeout(() => {
      router.push('/results');
    }, 3000);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendResponse();
    }
  };
  
  // If no interview data, show loading state
  if (!interviewData) {
    return <div className="p-6 text-center">Loading interview data...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col p-4">
      <div className="bg-white rounded-lg shadow-md flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-blue-50">
          <h1 className="text-xl font-bold">Interview Session</h1>
          <p className="text-sm text-gray-500">
            {interviewStarted 
              ? `Question ${currentQuestionIndex + 1} of ${interviewData.questions.length}`
              : 'Click Start to begin the interview'
            }
          </p>
        </div>
        
        {/* Chat messages area */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {messages.length === 0 && !interviewStarted ? (
            <div className="text-center p-6">
              <p className="mb-4">Welcome to your AI interview session.</p>
              <button
                onClick={startInterview}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Start Interview
              </button>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 ${
                    message.role === 'assistant' ? 'text-left' : 'text-right'
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg max-w-3/4 ${
                      message.role === 'assistant'
                        ? 'bg-blue-100'
                        : 'bg-green-100 text-left'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left mb-4">
                  <div className="inline-block p-3 rounded-lg bg-blue-100">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Input area */}
        {interviewStarted && !interviewFinished && (
          <div className="p-4 border-t">
            <div className="flex">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer..."
                className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || interviewFinished}
              />
              <button
                onClick={handleSendResponse}
                disabled={isLoading || !inputMessage.trim() || interviewFinished}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}