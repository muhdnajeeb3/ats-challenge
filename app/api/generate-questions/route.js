// app/api/generate-questions/route.js
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { parseCV } from '@/lib/parser';

// Initialize OpenAI client with a check for the API key
const openaiApiKey = process.env.OPENAI_API_KEY;
let openai;

try {
  if (!openaiApiKey || openaiApiKey === 'your_openai_api_key_here') {
    console.warn('OpenAI API key is missing or using the default placeholder value');
    // We'll handle this in the route function
  } else {
    openai = new OpenAI({
      apiKey: openaiApiKey,
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
      console.log('Attempting to parse CV...');
      // Parse the CV file
      const cvContent = await parseCV(cvFile);
      console.log('CV parsed successfully. Length:', cvContent.length);
      
      // If OpenAI isn't initialized or we're missing the API key, use mock data
      if (!openai || !openaiApiKey || openaiApiKey === 'your_openai_api_key_here') {
        console.log('Using mock questions (OpenAI API key not set)');
        return Response.json({
          questions: getMockQuestions(jobDescription),
          cvContent,
          note: "Using mock data - OpenAI API key not configured"
        });
      }
      
      // Generate interview questions using OpenAI
      console.log('Preparing to call OpenAI API...');
      const prompt = `
        I need to generate personalized interview questions based on a job description and a candidate's CV.
        
        Job Description:
        ${jobDescription}
        
        Candidate CV:
        ${cvContent}
        
        Create 5-7 specific interview questions that:
        1. Evaluate the candidate's qualifications for this specific job
        2. Address potential gaps between the job requirements and candidate's experience
        3. Include a mix of technical, behavioral, and situational questions
        4. Are personalized to the candidate's background
        
        Format the questions as a JSON array of objects with the following properties:
        - id: A unique identifier (number)
        - question: The interview question text
        - category: The category of question (technical, behavioral, situational)
        - relevance: A brief note explaining why this question is relevant
        
        Only return the JSON array, nothing else.
      `;
      
      try {
        // Make the actual OpenAI API call
        console.log('Calling OpenAI API...');
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo", // You can use "gpt-4" for better results if available
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });
        
        console.log('OpenAI API response received');
        // Parse the response to get questions
        const content = completion.choices[0].message.content;
        let questions;
        
        try {
          // Extract JSON from response if needed
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          questions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
          console.log(`Successfully parsed ${questions.length} questions from OpenAI response`);
        } catch (parseError) {
          console.error('Error parsing OpenAI response:', parseError);
          console.log('Raw OpenAI response:', content);
          // Fallback to mock questions if parsing fails
          questions = getMockQuestions(jobDescription);
          console.log('Using mock questions due to parse error');
        }
        
        return Response.json({
          questions,
          cvContent
        });
        
      } catch (openaiError) {
        console.error('OpenAI API Error:', openaiError);
        // Fallback to mock questions if OpenAI call fails
        return Response.json({
          questions: getMockQuestions(jobDescription),
          cvContent,
          note: "Using mock data due to OpenAI API error: " + openaiError.message
        });
      }
      
    } catch (cvError) {
      console.error('Error processing CV:', cvError);
      // Return a more specific error with the actual error message
      return Response.json(
        { error: `CV processing error: ${cvError.message}` },
        { status: 500 }
      );
    }
    
  } catch (requestError) {
    console.error('Error processing request:', requestError);
    return Response.json(
      { error: `Request processing error: ${requestError.message}` },
      { status: 500 }
    );
  }
}

// Function to generate mock questions based on job description
function getMockQuestions(jobDescription) {
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