// components/UploadForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

interface FormInputs {
  candidateName: string;
  jobDescription: string;
  cvFile: FileList;
}

export default function UploadForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [apiError, setApiError] = useState('');
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<FormInputs>();
  
  const onSubmit = async (data: FormInputs) => {
    setIsLoading(true);
    setFileError('');
    setApiError('');
    
    // Validate file
    const file = data.cvFile[0];
    if (!file) {
      setFileError('Please upload a CV file');
      setIsLoading(false);
      return;
    }
    
    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'docx', 'txt'].includes(fileType)) {
      setFileError('File must be PDF, DOCX, or TXT');
      setIsLoading(false);
      return;
    }
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('jobDescription', data.jobDescription);
      formData.append('cvFile', file);
      
      // Create a timeout controller for the fetch request
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 15000); // 15 second timeout
      
      try {
        // Send to backend API with timeout
        const response = await fetch('/api/generate-questions', {
          method: 'POST',
          body: formData,
          signal: timeoutController.signal
        });
        
        // Clear the timeout since the request completed
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to generate questions: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        
        // Store data in localStorage for use in interview page
        localStorage.setItem('interviewData', JSON.stringify({
          jobDescription: data.jobDescription,
          candidateName: data.candidateName,
          questions: result.questions,
          cvContent: result.cvContent
        }));
        
        // Navigate to interview page
        router.push('/interview');
      } catch (fetchError) {
        // Handle timeout or other fetch errors
        console.error('Fetch error:', fetchError);
        
        if (fetchError.name === 'AbortError') {
          console.log('Request timed out, using mock data');
          
          // Use mock data if request times out
          const mockQuestions = [
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
          
          // Create mock CV content - simplified for brevity
          const mockCV = `${data.candidateName}\nExperienced professional with skills in web development.`;
          
          // Store mock data and continue with the flow
          localStorage.setItem('interviewData', JSON.stringify({
            jobDescription: data.jobDescription,
            candidateName: data.candidateName,
            questions: mockQuestions,
            cvContent: mockCV
          }));
          
          setApiError('Request timed out. Using mock data to continue.');
          
          // Show message briefly before redirecting
          setTimeout(() => {
            router.push('/interview');
          }, 2000);
          
          return;
        }
        
        // Handle other errors
        setApiError(`Request failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating interview questions:', error);
      setApiError(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">AI Interview Assistant</h1>
      
      {apiError && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
          <p>{apiError}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block mb-2 font-medium">Candidate Name</label>
          <input
            {...register('candidateName', { required: 'Candidate name is required' })}
            className="w-full p-2 border rounded-md"
            placeholder="Enter candidate name"
          />
          {errors.candidateName && (
            <p className="text-red-500 mt-1">{errors.candidateName.message}</p>
          )}
        </div>
        
        <div>
          <label className="block mb-2 font-medium">Job Description</label>
          <textarea
            {...register('jobDescription', { 
              required: 'Job description is required',
              minLength: { value: 100, message: 'Please provide a detailed job description (min 100 characters)' }
            })}
            className="w-full p-2 border rounded-md h-40"
            placeholder="Enter or paste detailed job description here..."
          />
          {errors.jobDescription && (
            <p className="text-red-500 mt-1">{errors.jobDescription.message}</p>
          )}
        </div>
        
        <div>
          <label className="block mb-2 font-medium">Upload Candidate CV</label>
          <input
            type="file"
            {...register('cvFile', { required: 'CV file is required' })}
            className="w-full p-2 border rounded-md"
            accept=".pdf,.docx,.txt"
          />
          {(errors.cvFile || fileError) && (
            <p className="text-red-500 mt-1">{errors.cvFile?.message?.toString() || fileError}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">Accepted formats: PDF, DOCX, TXT</p>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isLoading ? 'Processing...' : 'Generate Interview Questions'}
        </button>
      </form>
    </div>
  );
}