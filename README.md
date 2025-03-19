# AI-Powered Interview Assistant

An AI-powered interview assistant that generates personalized interview questions based on job descriptions, conducts dynamic interviews, and provides candidate scoring.

## Getting Started

Follow these steps to set up and test the project:

### 1. Clone the repository

```bash
git clone [repository-url]
cd ATS-CHALLENGE
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```
# Use the default setting to run with mock data
OPENAI_API_KEY=your_openai_api_key_here
```

**Note:** The application will use mock data by default. If you want to use real AI-generated questions and scores, replace `your_openai_api_key_here` with an actual OpenAI API key and add billing information to your OpenAI account.

### 4. Run the development server

```bash
npm run dev
```

Visit http://localhost:3000 to use the application.

## Testing the Features

### 1. Test the upload form:
- Go to the home page (http://localhost:3000)
- Enter a candidate name (e.g., "John Doe")
- Paste a job description (minimum 100 characters)
  - You can use the Java Developer job description provided in our discussions
- Upload a CV file (any .txt, .pdf, or .docx file will work)
- Click "Generate Interview Questions"

### 2. Test the interview process:
- Once redirected to the interview page, click "Start Interview"
- Answer each question in the chat interface
- Response times will be tracked automatically
- After answering all questions, you'll be automatically redirected to the results page

### 3. Test the scoring and results:
- View the overall candidate score
- Check the breakdown by different skill categories
- Review strengths and areas for improvement
- Test the "Print Results" and "Start New Interview" buttons

### Testing with real AI vs. mock data:

By default, the application uses mock data if:
- No OpenAI API key is provided
- The key is invalid or has exceeded quota limits

To test with real AI (requires billing information on your OpenAI account):
1. Get an OpenAI API key from https://platform.openai.com
2. Add billing information to your OpenAI account
3. Update the `.env.local` file with your actual API key
4. Restart the development server

## Known Issues & Limitations

- PDF and DOCX parsing is simplified; advanced parsing would require additional configuration
- Large files may cause memory issues in the browser
- The OpenAI integration requires active billing to function properly

## Technologies Used

- Next.js (App Router)
- React
- Tailwind CSS
- OpenAI API (optional)