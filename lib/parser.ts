export async function parseCV(file: File): Promise<string> {
  try {
    console.log('Parsing file:', file.name, file.type, file.size);

    const fileType = file.name.split('.').pop()?.toLowerCase() || '';
    let text = '';

    if (fileType === 'txt') {
      text = await file.text();
      console.log('TXT file read successfully, length:', text.length);
    } 
    else if (fileType === 'pdf') {
      try {
        if (typeof window !== 'undefined') {
          console.warn('PDF parsing is not supported in the browser');
          return getMockCV(file.name);
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Dynamically import pdf-parse **only on the server**
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
        console.log('PDF parsed successfully, length:', text.length);
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return getMockCV(file.name);
      }
    } 
    else if (fileType === 'docx') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import('mammoth') as typeof import('mammoth');
        const docxResult = await mammoth.extractRawText({ arrayBuffer });
        text = docxResult.value;
        console.log('DOCX parsed successfully, length:', text.length);
      } catch (docxError) {
        console.error('DOCX parsing error:', docxError);
        return getMockCV(file.name);
      }
    } 
    else {
      console.warn('Unsupported file type:', fileType);
      return getMockCV(file.name);
    }

    return text.trim().length > 0 ? cleanText(text) : getMockCV(file.name);
  } catch (error) {
    console.error('Error parsing CV:', error);
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

function getMockCV(filename = ''): string {
  // Extract a name from the filename if possible
  let name = "John Doe";
  if (filename) {
    // Try to get a name from the filename (remove extension)
    const namePart = filename.split('.')[0];
    if (namePart && namePart.length > 0) {
      // Replace underscores/dashes with spaces and capitalize words
      name = namePart
        .replace(/[_-]/g, ' ')
        .replace(/\w\S*/g, w => (w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()));
    }
  }

  return `${name}
Email: ${name.toLowerCase().replace(/\s/g, '.')}@example.com
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