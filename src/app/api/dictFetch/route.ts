import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { DictType } from '@/app/types/types';

export async function GET(request: NextRequest) {
  try {
    // Get the exam type from the URL
    const searchParams = request.nextUrl.searchParams;
    const examType = searchParams.get('type')?.toLocaleUpperCase();
    
    // Validate the exam type
    if (!examType || !(examType in DictType)) {
      return NextResponse.json(
        { error: 'Invalid exam type' },
        { status: 400 }
      );
    }

    // Construct the file path
    const filePath = path.join(process.cwd(), `public/dicts/${examType}_T.json`);
    
    try {
      // Read the dictionary file
      const fileData = await fs.readFile(filePath, 'utf-8');
      const dictionaryData = JSON.parse(fileData);
      
      return NextResponse.json({ 
        dictionary: dictionaryData,
        count: dictionaryData.length
      });
    } catch (err) {
      console.error('Error reading dictionary file:', err);
      return NextResponse.json(
        { error: `Dictionary for ${examType} not found` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in dictFetch API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dictionary data' },
      { status: 500 }
    );
  }
}
