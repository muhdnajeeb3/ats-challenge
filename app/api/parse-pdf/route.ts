// app/api/parse-pdf/route.ts
import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(request: Request) {
  try {
    // Read the file from the request body
    const arrayBuffer = await request.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Parse the PDF
    const pdfData = await pdf(buffer);
    return NextResponse.json({ text: pdfData.text });
  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}