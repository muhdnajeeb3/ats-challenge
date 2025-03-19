// components/ResultCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ScoreCategory = {
  name: string;
  score: number;
  description: string;
  color: string;
};

type InterviewScore = {
  overallScore: number;
  categories: ScoreCategory[];
  summary: string;
  strengths: string[];
  improvements: string[];
  averageResponseTime: number;
  note?: string; // Optional field for messages
};

export default function ResultCard() {
  const router = useRouter();
  const [score, setScore] = useState<InterviewScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchResults = async () => {
      try {
        console.log('Fetching interview results...');
        // Get interview data from localStorage
        const interviewResultsData = localStorage.getItem('interviewResults');
        
        if (!interviewResultsData) {
          console.error('No interview data found in localStorage');
          setError('No interview data found. Please complete an interview first.');
          setIsLoading(false);
          return;
        }
        
        let interviewResults;
        try {
          interviewResults = JSON.parse(interviewResultsData);
          console.log('Interview data parsed successfully');
        } catch (parseError) {
          console.error('Error parsing interview data:', parseError);
          setError('Invalid interview data. Please try again.');
          setIsLoading(false);
          return;
        }
        
        // Ensure we have the required fields
        if (!interviewResults.messages) {
          console.warn('No messages found in interview data');
        }
        
        // Process response times
        const responseTimesMs = Object.values(interviewResults.responseTimeData || {}) as number[];
        const averageResponseTime = responseTimesMs.length > 0
          ? responseTimesMs.reduce((sum, time) => sum + time, 0) / responseTimesMs.length
          : 0;
        
        console.log('Average response time:', averageResponseTime, 'ms');
        
        // Format messages for API analysis
        const formattedMessages = interviewResults.messages
          ? interviewResults.messages
          .map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`)
              .join('\n\n')
          : 'No interview transcript available';
        
        // Prepare payload for API
        const payload = {
          interview: formattedMessages,
          jobDescription: interviewResults.jobDescription || 'Not provided',
          cvContent: interviewResults.cvContent || 'Not provided',
          responseTimeData: interviewResults.responseTimeData || {},
          averageResponseTimeMs: averageResponseTime,
        };
        
        console.log('Sending scoring request to API...');
        
        try {
          // Call API for scoring
          const response = await fetch('/api/score-interview', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to score interview: ${response.status} ${errorText}`);
          }
          
          const scoreData = await response.json();
          console.log('Score data received:', scoreData);
          
          // Check if the score data has expected structure
          if (!scoreData || typeof scoreData.overallScore !== 'number') {
            console.warn('Invalid score data structure:', scoreData);
            // Continue anyway, the UI will handle missing fields
          }
          
          setScore(scoreData);
          
        } catch (apiError) {
          console.error('Error calling scoring API:', apiError);
          // Create a fallback score
          setScore(getFallbackScore(averageResponseTime));
          setError('Could not connect to scoring service. Showing estimated results.');
        }
        
      } catch (err) {
        console.error('Error in fetchResults:', err);
        setError('Failed to generate interview results. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [router]);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const formatTime = (timeMs: number) => {
    const seconds = Math.floor(timeMs / 1000);
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg">Analyzing interview performance...</p>
        </div>
      </div>
    );
  }
  
  // Show error but with an option to continue if we have fallback score data
  if (error && !score) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="bg-red-100 p-4 rounded-lg">
          <h2 className="text-xl font-bold text-red-700">Error</h2>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  if (!score) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <p>No score data available.</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Return to Home
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Interview Assessment Results</h1>
      
      {/* Notes/Warnings */}
      {(error || score.note) && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700">{error || score.note}</p>
        </div>
      )}
      
      {/* Overall Score */}
      <div className="mb-8 flex items-center">
        <div className={`text-4xl font-bold text-white w-24 h-24 rounded-full flex items-center justify-center mr-4 ${getScoreColor(score.overallScore)}`}>
          {score.overallScore}%
        </div>
        <div>
          <h2 className="text-xl font-semibold">Overall Score</h2>
          <p className="text-gray-700">{score.summary}</p>
        </div>
      </div>
      
      {/* Response Time */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Average Response Time</h2>
        <p className="text-xl">{formatTime(score.averageResponseTime)}</p>
      </div>
      
      {/* Score Categories */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Performance Breakdown</h2>
        {score.categories.map((category, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">{category.name}</span>
              <span className="font-medium">{category.score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${category.color}`} 
                style={{ width: `${category.score}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
          </div>
        ))}
      </div>
      
      {/* Strengths & Areas for Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-green-700">Key Strengths</h2>
          <ul className="list-disc pl-5 space-y-1">
            {score.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-yellow-700">Areas for Improvement</h2>
          <ul className="list-disc pl-5 space-y-1">
            {score.improvements.map((improvement, index) => (
              <li key={index}>{improvement}</li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-center mt-6">
        <button 
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 mr-4"
        >
          Start New Interview
        </button>
        <button 
          onClick={() => window.print()}
          className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
        >
          Print Results
        </button>
      </div>
    </div>
  );
}

// Fallback score in case the API fails
function getFallbackScore(averageResponseTimeMs: number): InterviewScore {
  return {
    overallScore: 80,
    categories: [
      {
        name: "Technical Acumen",
        score: 80,
        description: "Demonstrated technical knowledge in responses",
        color: "bg-green-500"
      },
      {
        name: "Communication Skills",
        score: 82,
        description: "Clear communication throughout the interview",
        color: "bg-green-500"
      },
      {
        name: "Problem-Solving & Adaptability",
        score: 78,
        description: "Showed good problem-solving abilities",
        color: "bg-yellow-500"
      },
      {
        name: "Cultural Fit & Soft Skills",
        score: 85,
        description: "Good interpersonal qualities demonstrated",
        color: "bg-green-500"
      },
      {
        name: "Response Timing",
        score: 75,
        description: `Average response time was acceptable`,
        color: "bg-yellow-500"
      }
    ],
    summary: "This candidate shows good potential for the role with solid technical skills and communication abilities.",
    strengths: [
      "Good technical knowledge",
      "Clear communication style",
      "Positive attitude"
    ],
    improvements: [
      "Could provide more detailed examples",
      "Response time could be improved for some questions",
      "Should demonstrate more initiative"
    ],
    averageResponseTime: averageResponseTimeMs,
    note: "These results are estimated as we couldn't connect to the scoring service."
  };
}