// app/api/generate-questions/route.js - Optimized for Edge Runtime
import { OpenAI } from 'openai';
import { parseCV } from '@/lib/parser';

// Enable Edge Runtime to avoid timeout issues
export const runtime = 'edge';

// Initialize OpenAI client with API key
const oak = process.env.OPENAI_API_KEY;
let openai;

try {
  if (oak && oak !== 'your_openai_api_key_here') {
    openai = new OpenAI({
      apiKey: oak,
    });
  }
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const jobDescription = formData.get('jobDescription');
    const cvFile = formData.get('cvFile');
    
    if (!jobDescription || !cvFile) {
      return Response.json(
        { error: 'Job description and CV file are required' },
        { status: 400 }
      );
    }
    
    try {
      // Parse the CV file
      const cvContent = await parseCV(cvFile);
      
      // If OpenAI isn't initialized or we're missing the API key, use mock data
      if (!openai || !oak || oak === 'your_openai_api_key_here') {
        return Response.json({
          questions: getMockQuestions(),
          cvContent,
          note: "Using mock data - OpenAI API key not configured"
        });
      }
      
      // Optimize the prompt for faster processing
      const prompt = `
        Generate 5 personalized interview questions based on this job description and CV.
        
        Job Description (summary):
        ${jobDescription.substring(0, 800)}...
        
        Candidate CV (summary):
        ${cvContent.substring(0, 800)}...
        
        Return ONLY a JSON array with objects having these properties:
        - id: number
        - question: string (the interview question)
        - category: string (technical, behavioral, or situational)
        - relevance: string (brief explanation why relevant)
      `;
      
      try {
        // Make the OpenAI API call with a shorter timeout
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 1024, // Limit token generation for faster response
        });
        
        // Parse the response to get questions
        const content = completion.choices[0].message.content;
        let questions;
        
        try {
          // Extract JSON from response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          questions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        } catch (parseError) {
          // Fallback to mock questions if parsing fails
          console.log(parseError);
          
          questions = getMockQuestions();
        }
        
        return Response.json({
          questions,
          cvContent
        });
        
      } catch (openaiError) {
        // Fallback to mock questions if OpenAI call fails
        return Response.json({
          questions: getMockQuestions(),
          cvContent,
          note: "Using mock data due to OpenAI API error: " + openaiError.message
        });
      }
      
    } catch (cvError) {
      // Return a more specific error with the actual error message
      return Response.json(
        { error: `CV processing error: ${cvError.message}` },
        { status: 500 }
      );
    }
    
  } catch (requestError) {
    return Response.json(
      { error: `Request processing error: ${requestError.message}` },
      { status: 500 }
    );
  }
}

// Function to generate mock questions
function getMockQuestions() {
  return [
    {
      id: 1,
      question: "Tell me about your experience with web development frameworks and technologies.",
      category: "technical",
      relevance: "Understanding the candidate's technical background"
    },
    {
      id: 2,
      question: "How have you integrated APIs or external services in your previous projects?",
      category: "technical",
      relevance: "Assessing experience with system integration"
    },
    {
      id: 3,
      question: "Describe a challenging project and how you overcame obstacles during development.",
      category: "behavioral",
      relevance: "Evaluating problem-solving abilities and perseverance"
    },
    {
      id: 4,
      question: "How do you prioritize tasks when working under tight deadlines?",
      category: "situational",
      relevance: "Assessing time management and work prioritization skills"
    },
    {
      id: 5,
      question: "How do you stay updated with the latest trends and technologies in your field?",
      category: "behavioral",
      relevance: "Gauging commitment to continuous learning and improvement"
    }
  ];
}