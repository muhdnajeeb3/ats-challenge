// lib/parser.ts
// Replace 'any' with a more specific type

export async function parseCV(file: File): Promise<string> {
  try {
    console.log('Starting CV parsing process');
    console.log('File type:', file.type);
    console.log('File name:', file.name);
    console.log('File size:', file.size, 'bytes');
    
    // Get file extension
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';
    console.log('Detected file extension:', fileType);
    
    // For now, we'll use a simplified approach for all file types
    // This should work for text files and provide fallback for others
    try {
      let text = '';
      
      if (file.type === 'text/plain' || fileType === 'txt') {
        console.log('Parsing as text file');
        text = await file.text();
        console.log('Text file parsed, content length:', text.length);
      } else {
        console.log('File is not plaintext, using mock CV data');
        // For now, just return mock data for non-text files
        text = getMockCV();
        console.log('Using mock CV data, length:', text.length);
      }
      
      // Clean the text
      const cleanedText = cleanText(text);
      console.log('Text cleaned, final length:', cleanedText.length);
      
      return cleanedText;
    } catch (readError) {
      console.error('Error reading file:', readError);
      console.log('Falling back to mock CV');
      return getMockCV();
    }
  } catch (error) {
    console.error('Error in parseCV function:', error);
    // Return mock data to allow the application to continue functioning
    return getMockCV();
  }
}

function cleanText(text: string | null | undefined): string {
  // Basic cleaning
  if (!text) {
    console.warn('Empty text received for cleaning');
    return '';
  }
  
  try {
    const cleaned = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n+/g, '\n')
      .replace(/\t+/g, ' ')
      .replace(/ +/g, ' ')
      .trim();
    
    return cleaned;
  } catch (error) {
    console.error('Error cleaning text:', error);
    return text; // Return original text if cleaning fails
  }
}

function getMockCV(): string {
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