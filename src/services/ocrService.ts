import { extractTextFromImage } from 'expo-text-extractor';
import { OCRResult } from '../types';

export class OCRService {
  /**
   * Extract text from image using ML Kit OCR
   */
  static async extractText(imageUri: string): Promise<OCRResult> {
    try {

      const result = await extractTextFromImage(imageUri);
      const extractedText = (result as any).text || '';

      // Parse the extracted text to identify CME-relevant data
      const parsedData = this.parseCMEData(extractedText);
      
      return {
        text: extractedText,
        confidence: 0.85, // expo-text-extractor doesn't return confidence, use default
        extractedData: parsedData,
      };
    } catch (error) {
      __DEV__ && console.error('[ERROR] OCRService: Text extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Parse extracted text to identify CME-relevant information
   */
  private static parseCMEData(text: string) {

    const lowerText = text.toLowerCase();
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    const extractedData: any = {};

    // Extract title - usually the longest line near the top
    const titleCandidate = this.extractTitle(lines);
    if (titleCandidate) {
      extractedData.title = titleCandidate;
    }

    // Extract provider/organization
    const providerCandidate = this.extractProvider(lines, lowerText);
    if (providerCandidate) {
      extractedData.provider = providerCandidate;
    }

    // Extract date
    const dateCandidate = this.extractDate(text);
    if (dateCandidate) {
      extractedData.date = dateCandidate;
    }

    // Extract credits/hours
    const creditsCandidate = this.extractCredits(lowerText);
    if (creditsCandidate) {
      extractedData.credits = creditsCandidate;
    }

    // Extract category
    const categoryCandidate = this.extractCategory(lowerText);
    if (categoryCandidate) {
      extractedData.category = categoryCandidate;
    }

    return extractedData;
  }

  /**
   * Extract title from lines (usually prominent text near the top)
   */
  private static extractTitle(lines: string[]): string | null {
    // Look for the longest line in the first few lines (likely the title)
    const topLines = lines.slice(0, Math.min(5, lines.length));
    let longestLine = '';
    
    for (const line of topLines) {
      if (line.length > longestLine.length && line.length > 10) {
        longestLine = line.trim();
      }
    }

    // Filter out lines that look like dates or short codes
    if (longestLine && !this.looksLikeDate(longestLine) && !this.looksLikeCode(longestLine)) {
      return longestLine;
    }

    return null;
  }

  /**
   * Extract provider/organization name
   */
  private static extractProvider(lines: string[], lowerText: string): string | null {
    // Common provider keywords
    const providerKeywords = [
      'medical', 'hospital', 'university', 'college', 'institute', 'academy',
      'association', 'society', 'foundation', 'center', 'clinic', 'health',
      'education', 'learning', 'training', 'board', 'accredited'
    ];

    // Look for lines containing provider keywords
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (providerKeywords.some(keyword => lowerLine.includes(keyword))) {
        return line.trim();
      }
    }

    // Look for "Sponsored by", "Provided by", etc.
    const sponsorMatch = lowerText.match(/(?:sponsored by|provided by|presented by)\s*:?\s*([^\n]+)/i);
    if (sponsorMatch) {
      return sponsorMatch[1].trim();
    }

    return null;
  }

  /**
   * Extract date from text
   */
  private static extractDate(text: string): string | null {
    // Common date patterns
    const datePatterns = [
      /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/,           // MM/DD/YYYY
      /\b(\d{1,2}-\d{1,2}-\d{4})\b/,            // MM-DD-YYYY
      /\b(\d{4}-\d{1,2}-\d{1,2})\b/,            // YYYY-MM-DD
      /\b([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})\b/, // Month DD, YYYY
      /\b(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b/,  // DD Month YYYY
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract credit hours/points
   */
  private static extractCredits(lowerText: string): number | null {
    // Common credit patterns
    const creditPatterns = [
      /(\d+(?:\.\d+)?)\s*(?:cme|credit|credits|hours?|points?|units?)/,
      /(?:cme|credit|credits|hours?|points?|units?)\s*:?\s*(\d+(?:\.\d+)?)/,
      /(\d+(?:\.\d+)?)\s*(?:continuing\s+education|ce)/,
    ];

    for (const pattern of creditPatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        const credits = parseFloat(match[1]);
        if (credits > 0 && credits <= 50) { // Reasonable range
          return credits;
        }
      }
    }

    return null;
  }

  /**
   * Extract category/specialty
   */
  private static extractCategory(lowerText: string): string | null {
    // Common CME categories
    const categories = [
      'internal medicine', 'surgery', 'pediatrics', 'cardiology', 'neurology',
      'oncology', 'radiology', 'pathology', 'anesthesiology', 'emergency medicine',
      'family medicine', 'psychiatry', 'dermatology', 'ophthalmology', 'orthopedics',
      'nursing', 'pharmacy', 'clinical', 'medical', 'patient safety', 'quality improvement'
    ];

    for (const category of categories) {
      if (lowerText.includes(category)) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }

    return null;
  }

  /**
   * Check if text looks like a date
   */
  private static looksLikeDate(text: string): boolean {
    return /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text) || 
           /\b[A-Za-z]{3,9}\s+\d{1,2}/.test(text);
  }

  /**
   * Check if text looks like a code (short alphanumeric)
   */
  private static looksLikeCode(text: string): boolean {
    return text.length < 8 && /^[A-Z0-9\-]+$/.test(text);
  }
}