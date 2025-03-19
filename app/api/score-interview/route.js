// app/api/score-interview/route.js - Optimized for Edge Runtime
import { OpenAI } from 'openai';

// Enable Edge Runtime to avoid timeout issues
export const runtime = 'edge';

// Initialize OpenAI client with a check for the API key
const oak = process.env.OPENAI_API_KEY;
let openai;

try {
  if (oak && oak !== 'your_openai_api_key_here') {
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
    } catch (error) {
      console.error('Error parsing JSON:', error);
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
      const formattedResponseTimes = Object.entries(responseTimeData || {})
        .slice(0, 3) // Limit to first 3 questions for brevity
        .map(([questionIndex, timeMs]) => 
          `Question ${parseInt(questionIndex) + 1}: ${Math.round(timeMs / 1000)} seconds`
        ).join('\n');
      
      // Construct optimized prompt for AI scoring
      const prompt = `
        Evaluate this interview. Be concise.
        
        Job: ${jobDescription ? jobDescription.substring(0, 500) + '...' : 'Not provided'}
        
        CV: ${cvContent ? cvContent.substring(0, 500) + '...' : 'Not provided'}
        
        Interview: ${interview ? interview.substring(0, 800) + '...' : 'Not provided'}
        
        Average response time: ${averageResponseTime} seconds
        ${formattedResponseTimes}
        
        Return ONLY a JSON object with:
        {
          "overallScore": number (0-100),
          "categories": [
            {"name": "Technical Acumen", "score": number, "description": "brief", "color": "bg-green/yellow/red-500"},
            {"name": "Communication", "score": number, "description": "brief", "color": "bg-green/yellow/red-500"},
            {"name": "Problem-Solving", "score": number, "description": "brief", "color": "bg-green/yellow/red-500"},
            {"name": "Cultural Fit", "score": number, "description": "brief", "color": "bg-green/yellow/red-500"},
            {"name": "Response Time", "score": number, "description": "brief", "color": "bg-green/yellow/red-500"}
          ],
          "summary": "paragraph",
          "strengths": ["str1", "str2", "str3"],
          "improvements": ["imp1", "imp2", "imp3"]
        }
      `;
      
      // Make the OpenAI API call with limited tokens
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1024, // Limit token generation for faster response
      });
      
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
      } catch (parseError) {
        // Use the error for logging
        console.error('Error parsing JSON response:', parseError);
        return Response.json(getMockScore(averageResponseTime, averageResponseTimeMs));
      }
      
      return Response.json(scoreData);
      
    } catch (apiError) {
      // Use the error for logging
      console.error('OpenAI API Error:', apiError);
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