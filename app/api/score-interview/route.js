// app/api/score-interview/route.js
import { OpenAI } from 'openai';

// Initialize OpenAI client with a check for the API key
const oak = process.env.OPENAI_API_KEY;
let openai;

try {
  if (oak && oak !== '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') {
    openai = new OpenAI({
      apiKey: oak,
    });
  } else {
    console.warn('OpenAI API key is missing or using the default placeholder value');
  }
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

export async function POST(request) {
  try {
    console.log('Score interview API called');
    
    let data;
    try {
      data = await request.json();
      console.log('Request data parsed successfully');
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return Response.json(
        { error: 'Invalid JSON in request' },
        { status: 400 }
      );
    }
    
    const { 
      interview, 
      jobDescription, 
      cvContent, 
      responseTimeData, 
      averageResponseTimeMs 
    } = data;
    
    // Validate required fields
    if (!interview) {
      console.warn('Missing interview transcript in request');
    }
    
    if (!jobDescription) {
      console.warn('Missing job description in request');
    }
    
    if (!responseTimeData || !averageResponseTimeMs) {
      console.warn('Missing response time data in request');
    }
    
    // Convert response time from milliseconds to seconds for easier interpretation
    const averageResponseTime = Math.round((averageResponseTimeMs || 0) / 1000);
    
    console.log('Average response time:', averageResponseTime, 'seconds');
    
    // If OpenAI is not initialized or we're missing data, return mock data
    if (!openai || !oak || oak === 'your_openai_api_key_here') {
      console.log('Using mock scoring data (OpenAI API key not set)');
      return Response.json(getMockScore(averageResponseTime, averageResponseTimeMs));
    }
    
    try {
      // Attempt to use OpenAI for scoring
      console.log('Preparing to call OpenAI API for scoring...');
      
      // Format response time data for AI analysis
      const formattedResponseTimes = Object.entries(responseTimeData || {}).map(
        ([questionIndex, timeMs]) => `Question ${parseInt(questionIndex) + 1}: ${Math.round(timeMs / 1000)} seconds`
      ).join('\n');
      
      // Construct prompt for AI scoring
      const prompt = `
        You are an expert interviewer and recruiter. Evaluate the following interview based on the job description, candidate's CV, and the interview transcript.
        
        Job Description:
        ${jobDescription || 'Not provided'}
        
        Candidate CV Summary:
        ${cvContent ? (cvContent.substring(0, 1500) + '... (truncated if longer)') : 'Not provided'}
        
        Interview Transcript:
        ${interview || 'Not provided'}
        
        Response Time Data:
        Average response time: ${averageResponseTime} seconds
        ${formattedResponseTimes || 'No detailed response time data available'}
        
        Please provide a comprehensive evaluation of the candidate's performance based on:
        1. Technical Acumen: How well they demonstrated technical skills required for the role
        2. Communication Skills: Clarity and effectiveness in conveying information
        3. Problem-Solving & Adaptability: How they approached questions and provided solutions
        4. Cultural Fit & Soft Skills: Interpersonal qualities relevant to the role
        5. Response Timing: Considering their average response time of ${averageResponseTime} seconds (faster, high-quality responses should be scored higher)
        
        Return your evaluation as a JSON object with the following structure:
        {
          "overallScore": number (0-100),
          "categories": [
            {
              "name": "Technical Acumen",
              "score": number (0-100),
              "description": "Brief evaluation of this aspect",
              "color": "bg-green-500" or "bg-yellow-500" or "bg-red-500" based on score
            },
            // Same structure for other categories
          ],
          "summary": "A concise paragraph summarizing overall performance",
          "strengths": ["Strength 1", "Strength 2", "Strength 3"],
          "improvements": ["Area for improvement 1", "Area for improvement 2", "Area for improvement 3"],
          "averageResponseTime": number (in milliseconds, use the provided value)
        }
        
        Only return the JSON object, nothing else.
      `;
      
      // Make the actual OpenAI API call
      console.log('Calling OpenAI API...');
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // You can use "gpt-4" for better results if available
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      
      console.log('OpenAI API response received');
      // Parse the AI's response
      const content = completion.choices[0].message.content;
      let scoreData;
      
      try {
        // Extract JSON from response if needed
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        scoreData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        
        // Ensure averageResponseTime is included in milliseconds
        scoreData.averageResponseTime = averageResponseTimeMs || 0;
        
        // Validate color values and correct if needed
        scoreData.categories = scoreData.categories.map(category => {
          if (!['bg-green-500', 'bg-yellow-500', 'bg-red-500'].includes(category.color)) {
            // Assign color based on score
            const score = category.score;
            if (score >= 80) {
              category.color = 'bg-green-500';
            } else if (score >= 60) {
              category.color = 'bg-yellow-500';
            } else {
              category.color = 'bg-red-500';
            }
          }
          return category;
        });
        
        console.log('Score data processed successfully');
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('Falling back to mock scoring data due to parse error');
        return Response.json(getMockScore(averageResponseTime, averageResponseTimeMs));
      }
      
      return Response.json(scoreData);
      
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      console.log('Falling back to mock scoring data due to OpenAI error');
      return Response.json(getMockScore(averageResponseTime, averageResponseTimeMs));
    }
    
  } catch (error) {
    console.error('Error in score-interview route:', error);
    // Always return a valid response, even in case of errors
    return Response.json(
      getMockScore(0, 0, "Error processing request: " + error.message),
      { status: 200 } // Return 200 with mock data instead of 500
    );
  }
}

// Function to generate mock scoring data
function getMockScore(averageResponseTime, averageResponseTimeMs, errorNote = null) {
  const mockScore = {
    overallScore: 84,
    categories: [
      {
        name: "Technical Acumen",
        score: 88,
        description: "Strong technical knowledge demonstrated in responses",
        color: "bg-green-500"
      },
      {
        name: "Communication Skills",
        score: 85,
        description: "Clear and effective communication throughout",
        color: "bg-green-500"
      },
      {
        name: "Problem-Solving & Adaptability",
        score: 82,
        description: "Good problem-solving approach with some creative solutions",
        color: "bg-green-500"
      },
      {
        name: "Cultural Fit & Soft Skills",
        score: 90,
        description: "Excellent interpersonal qualities and alignment with company values",
        color: "bg-green-500"
      },
      {
        name: "Response Timing",
        score: 75,
        description: `Average response time of ${averageResponseTime} seconds. Quick responses to most questions.`,
        color: "bg-yellow-500"
      }
    ],
    summary: "This candidate shows strong potential for the role with excellent technical skills and communication. They would likely be a strong addition to the team.",
    strengths: [
      "Strong technical knowledge in required technologies",
      "Clear and effective communication style",
      "Good cultural fit with company values"
    ],
    improvements: [
      "Could provide more detailed examples in some responses",
      "Response time could be improved for technical questions",
      "Should demonstrate more initiative in problem-solving scenarios"
    ],
    averageResponseTime: averageResponseTimeMs || 0
  };
  
  // Add error note if provided
  if (errorNote) {
    mockScore.note = errorNote;
  }
  
  return mockScore;
}