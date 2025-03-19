// lib/parser.js
export async function parseCV(file : any) {
    try {
      // For development/testing, we'll use a simple text extraction
      // In production, you would use pdf-parse and mammoth libraries
      
      const text = await readFileAsText(file);
      
      // Return a cleaned version of the text
      return cleanText(text) || getMockCV();
      
    } catch (error) {
      console.error('Error parsing CV:', error);
      // Return mock CV data for testing
      return getMockCV();
    }
  }
  
  async function readFileAsText(file : File) {
    // Simple implementation to read text files
    // For PDFs and DOCXs, you would use the proper libraries
    try {
      if (file.type === 'text/plain') {
        return await file.text();
      }
      
      // Return mock data for non-text files during development
      return getMockCV();
    } catch (error) {
      console.error('Error reading file:', error);
      return '';
    }
  }
  
  function cleanText(text: string | null | undefined) {
    // Basic cleaning
    if (!text) return '';
    
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n+/g, '\n')
      .replace(/\t+/g, ' ')
      .replace(/ +/g, ' ')
      .trim();
  }
  
  function getMockCV() {
    return `John Doe
  Email: john@example.com
  Phone: (555) 123-4567
  
  SUMMARY
  Experienced web developer with expertise in Next.js, React, and TypeScript.
  
  EXPERIENCE
  Senior Frontend Developer - Tech Company
  2021 - Present
  - Developed responsive web applications using Next.js and React
  - Implemented user authentication and API integration
  - Optimized application performance and load times
  
  Web Developer - Digital Agency
  2018 - 2021
  - Built client websites and web applications
  - Collaborated with design team to implement UI/UX requirements
  - Managed project timelines and client expectations
  
  EDUCATION
  Bachelor of Computer Science, University of Technology (2018)
  
  SKILLS
  - JavaScript/TypeScript
  - Next.js/React
  - Node.js
  - API Integration
  - UI/UX Design`;
  }