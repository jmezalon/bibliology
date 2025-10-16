## PowerPoint Import Architecture

### High-Level Flow

┌─────────────────────────────────────────────────────────────────────┐
│ PowerPoint Import Pipeline │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ 1. UPLOAD │
│ User uploads .pptx file │
│ ↓ │
│ 2. VALIDATION │
│ Check file type, size, structure │
│ ↓ │
│ 3. EXTRACTION │
│ Parse .pptx (ZIP archive) │
│ Extract slides, images, text, formatting │
│ ↓ │
│ 4. ANALYSIS │
│ Analyze slide layouts │
│ Detect content types (text, images, shapes, tables) │
│ Identify patterns (titles, bullets, verses, etc.) │
│ ↓ │
│ 5. TRANSFORMATION │
│ Convert PowerPoint elements → Content Blocks │
│ Map layouts → Slide layouts │
│ Preserve formatting where possible │
│ ↓ │
│ 6. PREVIEW & ADJUSTMENT │
│ Show teacher preview of converted slides │
│ Allow manual adjustments before final import │
│ ↓ │
│ 7. IMPORT │
│ Create lesson in database │
│ Upload images to storage │
│ Create slides and content blocks │
│ ↓ │
│ 8. POST-PROCESSING │
│ Extract vocabulary terms │
│ Detect Bible verses │
│ Generate lesson metadata │
│ │
└─────────────────────────────────────────────────────────────────────┘

### Technology Stack for Import

### Backend Libraries (Node.js)

// Primary library for parsing .pptx files
import \* as PPTX from 'pptxgenjs'; // For generation
import PptxParser from 'pptx-parser'; // For parsing existing files

// Alternative: More robust parsing
import mammoth from 'mammoth'; // Works with PPTX XML
import JSZip from 'jszip'; // Direct ZIP manipulation

// Image processing
import sharp from 'sharp'; // Resize, optimize images
import { v4 as uuidv4 } from 'uuid';

// Text processing
import natural from 'natural'; // NLP for detecting patterns
import he from 'he'; // HTML entity encoding/decoding

// Storage
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

```

### PowerPoint Structure (OOXML Format)
```

PowerPoint (.pptx) is a ZIP archive containing:

my-presentation.pptx (ZIP)
├── [Content_Types].xml # File type definitions
├── \_rels/ # Relationships
│ └── .rels
├── ppt/
│ ├── presentation.xml # Main presentation metadata
│ ├── slides/
│ │ ├── slide1.xml # Slide 1 content
│ │ ├── slide2.xml # Slide 2 content
│ │ └── \_rels/
│ │ ├── slide1.xml.rels # Relationships (images, etc.)
│ │ └── slide2.xml.rels
│ ├── slideLayouts/ # Layout templates
│ ├── slideMasters/ # Master slides
│ ├── media/ # Images, videos
│ │ ├── image1.png
│ │ ├── image2.jpg
│ │ └── ...
│ ├── notesMaster/
│ └── theme/
└── docProps/ # Document properties
├── app.xml
└── core.xml

### Implementation: PowerPoint Parser

### Core Parser Class

// src/services/powerpoint-parser.ts

import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';
import sharp from 'sharp';

interface ParsedSlide {
slideNumber: number;
layout: string;
title?: string;
contentBlocks: ContentBlock[];
notes?: string;
images: ImageInfo[];
}

interface ContentBlock {
type: 'text' | 'heading' | 'image' | 'list' | 'shape';
order: number;
content: any;
formatting?: FormatInfo;
}

interface ImageInfo {
id: string;
filename: string;
buffer: Buffer;
width: number;
height: number;
position: { x: number; y: number };
}

interface FormatInfo {
fontSize?: number;
fontFamily?: string;
bold?: boolean;
italic?: boolean;
underline?: boolean;
color?: string;
alignment?: 'left' | 'center' | 'right';
}

export class PowerPointParser {
private zip: JSZip;
private slides: any[] = [];
private images: Map<string, Buffer> = new Map();
private relationships: Map<string, any> = new Map();

/\*\*

- Main entry point: Parse a PowerPoint file
  \*/
  async parse(fileBuffer: Buffer): Promise<ParsedSlide[]> {
  // Step 1: Load ZIP archive
  this.zip = await JSZip.loadAsync(fileBuffer);

  // Step 2: Extract all images
  await this.extractImages();

  // Step 3: Parse relationships
  await this.parseRelationships();

  // Step 4: Parse all slides
  const slideFiles = Object.keys(this.zip.files)
  .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
  .sort((a, b) => this.getSlideNumber(a) - this.getSlideNumber(b));

  const parsedSlides: ParsedSlide[] = [];

  for (const slideFile of slideFiles) {
  const slideNumber = this.getSlideNumber(slideFile);
  const parsedSlide = await this.parseSlide(slideFile, slideNumber);
  parsedSlides.push(parsedSlide);
  }

  return parsedSlides;

}

/\*\*

- Extract all images from the PowerPoint
  \*/
  private async extractImages(): Promise<void> {
  const mediaFolder = 'ppt/media/';

  for (const [filename, file] of Object.entries(this.zip.files)) {
  if (filename.startsWith(mediaFolder) && !file.dir) {
  const imageBuffer = await file.async('nodebuffer');
  const imageName = filename.replace(mediaFolder, '');
  this.images.set(imageName, imageBuffer);
  }
  }

  console.log(`Extracted ${this.images.size} images`);

}

/\*\*

- Parse relationship files to map image IDs to filenames
  \*/
  private async parseRelationships(): Promise<void> {
  const relsFolder = 'ppt/slides/\_rels/';

  for (const [filename, file] of Object.entries(this.zip.files)) {
  if (filename.startsWith(relsFolder) && filename.endsWith('.rels')) {
  const content = await file.async('string');
  const parsed = await parseStringPromise(content);

        const slideNumber = this.getSlideNumber(filename.replace('.rels', ''));
        const relationships: any = {};

        if (parsed.Relationships?.Relationship) {
          for (const rel of parsed.Relationships.Relationship) {
            const attrs = rel.$;
            relationships[attrs.Id] = {
              type: attrs.Type,
              target: attrs.Target
            };
          }
        }

        this.relationships.set(`slide${slideNumber}`, relationships);
      }

  }

}

/\*\*

- Parse a single slide
  \*/
  private async parseSlide(slideFile: string, slideNumber: number): Promise<ParsedSlide> {
  const content = await this.zip.files[slideFile].async('string');
  const parsed = await parseStringPromise(content);

  const slide: ParsedSlide = {
  slideNumber,
  layout: this.detectLayout(parsed),
  contentBlocks: [],
  images: []
  };

  // Extract shapes (text boxes, titles, content)
  const shapes = this.extractShapes(parsed);

  for (const shape of shapes) {
  if (shape.type === 'text') {
  const block = this.createTextBlock(shape);
  slide.contentBlocks.push(block);
  } else if (shape.type === 'image') {
  const imageInfo = await this.processImage(shape, slideNumber);
  if (imageInfo) {
  slide.images.push(imageInfo);
  slide.contentBlocks.push({
  type: 'image',
  order: shape.order,
  content: {
  imageId: imageInfo.id,
  alt: shape.alt || 'Slide image'
  }
  });
  }
  }
  }

  // Sort content blocks by vertical position
  slide.contentBlocks.sort((a, b) => a.order - b.order);

  // Extract notes if present
  slide.notes = await this.extractNotes(slideNumber);

  return slide;

}

/\*\*

- Extract all shapes from slide XML
  \*/
  private extractShapes(slideXml: any): any[] {
  const shapes: any[] = [];
  const spTree = slideXml['p:sld']?.[0]?.['p:cSld']?.[0]?.['p:spTree']?.[0];

  if (!spTree) return shapes;

  // Extract text shapes (sp)
  if (spTree['p:sp']) {
  for (const sp of spTree['p:sp']) {
  const shape = this.parseTextShape(sp);
  if (shape) shapes.push(shape);
  }
  }

  // Extract pictures (pic)
  if (spTree['p:pic']) {
  for (const pic of spTree['p:pic']) {
  const imageShape = this.parsePictureShape(pic);
  if (imageShape) shapes.push(imageShape);
  }
  }

  return shapes;

}

/\*\*

- Parse a text shape
  \*/
  private parseTextShape(sp: any): any | null {
  const txBody = sp['p:txBody']?.[0];
  if (!txBody) return null;

  const paragraphs = txBody['a:p'] || [];
  let fullText = '';
  let formatting: FormatInfo = {};
  let isTitle = false;

  // Check if this is a title shape
  const nvSpPr = sp['p:nvSpPr']?.[0];
  const phType = nvSpPr?.['p:nvPr']?.[0]?.['p:ph']?.[0]?.$?.type;
  isTitle = phType === 'title' || phType === 'ctrTitle';

  // Extract text from all paragraphs
  for (const para of paragraphs) {
  const runs = para['a:r'] || [];
  for (const run of runs) {
  const text = run['a:t']?.[0] || '';
  fullText += text;

        // Extract formatting from first run
        if (Object.keys(formatting).length === 0) {
          formatting = this.extractFormatting(run);
        }
      }
      fullText += '\n';

  }

  fullText = fullText.trim();

  if (!fullText) return null;

  // Get position for ordering
  const xfrm = sp['p:spPr']?.[0]?.['a:xfrm']?.[0];
  const y = parseInt(xfrm?.['a:off']?.[0]?.$?.y || '0');

  return {
  type: 'text',
  text: fullText,
  isTitle,
  formatting,
  order: y // Use Y position for ordering
  };

}

/\*\*

- Parse a picture shape
  \*/
  private parsePictureShape(pic: any): any | null {
  const blipFill = pic['p:blipFill']?.[0];
  const blip = blipFill?.['a:blip']?.[0];
  const embed = blip?.$?.['r:embed'];

  if (!embed) return null;

  // Get position and size
  const xfrm = pic['p:spPr']?.[0]?.['a:xfrm']?.[0];
  const x = parseInt(xfrm?.['a:off']?.[0]?.$?.x || '0');
    const y = parseInt(xfrm?.['a:off']?.[0]?.$?.y || '0');
  const cx = parseInt(xfrm?.['a:ext']?.[0]?.$?.cx || '0');
    const cy = parseInt(xfrm?.['a:ext']?.[0]?.$?.cy || '0');

  // Get alt text
  const nvPicPr = pic['p:nvPicPr']?.[0];
  const cNvPr = nvPicPr?.['p:cNvPr']?.[0];
  const alt = cNvPr?.$?.descr || '';

  return {
  type: 'image',
  relationshipId: embed,
  position: { x, y },
  size: { width: cx, height: cy },
  alt,
  order: y
  };

}

/\*\*

- Extract text formatting
  \*/
  private extractFormatting(run: any): FormatInfo {
  const rPr = run['a:rPr']?.[0];
  if (!rPr) return {};

  const formatting: FormatInfo = {};

  // Font size (in hundredths of a point)
  if (rPr.$?.sz) {
      formatting.fontSize = parseInt(rPr.$.sz) / 100;
  }

  // Bold
  formatting.bold = rPr.$?.b === '1';

  // Italic
  formatting.italic = rPr.$?.i === '1';

  // Underline
  formatting.underline = rPr.$?.u === 'sng';

  // Font family
  const latin = rPr['a:latin']?.[0];
  if (latin?.$?.typeface) {
      formatting.fontFamily = latin.$.typeface;
  }

  // Color
  const solidFill = rPr['a:solidFill']?.[0];
  const srgbClr = solidFill?.['a:srgbClr']?.[0];
  if (srgbClr?.$?.val) {
      formatting.color = '#' + srgbClr.$.val;
  }

  return formatting;

}

/\*\*

- Process and optimize an image
  \*/
  private async processImage(shape: any, slideNumber: number): Promise<ImageInfo | null> {
  const slideRels = this.relationships.get(`slide${slideNumber}`);
  if (!slideRels) return null;

  const rel = slideRels[shape.relationshipId];
  if (!rel) return null;

  const imagePath = rel.target.replace('../', '');
  const imageName = imagePath.split('/').pop();
  const imageBuffer = this.images.get(imageName);

  if (!imageBuffer) return null;

  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata();

  // Optimize image (resize if too large, convert to webp)
  let optimizedBuffer = imageBuffer;
  const maxWidth = 1920;
  const maxHeight = 1080;

  if (metadata.width && metadata.width > maxWidth) {
  optimizedBuffer = await sharp(imageBuffer)
  .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 85 })
  .toBuffer();
  }

  return {
  id: uuidv4(),
  filename: imageName.replace(/\.[^.]+$/, '.webp'),
  buffer: optimizedBuffer,
  width: metadata.width || 0,
  height: metadata.height || 0,
  position: shape.position
  };

}

/\*\*

- Extract notes from notes slide
  \*/
  private async extractNotes(slideNumber: number): Promise<string | undefined> {
  const notesFile = `ppt/notesSlides/notesSlide${slideNumber}.xml`;

  if (!this.zip.files[notesFile]) return undefined;

  try {
  const content = await this.zip.files[notesFile].async('string');
  const parsed = await parseStringPromise(content);

      const shapes = this.extractShapes(parsed);
      const textShapes = shapes.filter(s => s.type === 'text' && !s.isTitle);

      return textShapes.map(s => s.text).join('\n\n');

  } catch (error) {
  console.error(`Error extracting notes for slide ${slideNumber}:`, error);
  return undefined;
  }

}

/\*\*

- Detect slide layout based on content
  \*/
  private detectLayout(slideXml: any): string {
  // This is a heuristic - could be improved
  const spTree = slideXml['p:sld']?.[0]?.['p:cSld']?.[0]?.['p:spTree']?.[0];

  if (!spTree) return 'content';

  const hasTitle = spTree['p:sp']?.some((sp: any) => {
  const phType = sp['p:nvSpPr']?.[0]?.['p:nvPr']?.[0]?.['p:ph']?.[0]?.$?.type;
  return phType === 'title' || phType === 'ctrTitle';
  });

  const hasPicture = spTree['p:pic']?.length > 0;
  const textShapeCount = spTree['p:sp']?.length || 0;

  if (hasTitle && textShapeCount === 1) return 'title';
  if (hasPicture && textShapeCount <= 2) return 'image_focus';
  if (textShapeCount >= 2) return 'two_column';

  return 'content';

}

/\*\*

- Helper: Extract slide number from filename
  \*/
  private getSlideNumber(filename: string): number {
  const match = filename.match(/slide(\d+)/);
  return match ? parseInt(match[1]) : 0;
  }

/\*\*

- Create a text content block
  \*/
  private createTextBlock(shape: any): ContentBlock {
  const blockType = shape.isTitle ? 'heading' :
  this.detectTextType(shape.text);

  return {
  type: blockType,
  order: shape.order,
  content: {
  text: shape.text,
  formatting: shape.formatting
  }
  };

}

/\*\*

- Detect special text types (verse, vocabulary, etc.)
  \*/
  private detectTextType(text: string): 'text' | 'heading' | 'list' {
  // Check for Bible verse pattern
  const versePattern = /^(?:[1-3]\s)?[A-Z][a-z]+\s\d+:\d+/;
  if (versePattern.test(text.trim())) {
  return 'verse' as any; // Would need to add to ContentBlock type
  }

  // Check for list items
  if (text.includes('•') || text.match(/^\d+\./m)) {
  return 'list';
  }

  // Check for large text (heading)
  // This would use formatting info

  return 'text';

}
}

### Content Analysis & Pattern Detection

### Intelligent Content Detection

// src/services/content-analyzer.ts

export class ContentAnalyzer {

/\*\*

- Analyze parsed slides and enhance with detected patterns
  \*/
  analyze(slides: ParsedSlide[]): EnhancedSlide[] {
  return slides.map(slide => this.analyzeSlide(slide));
  }

/\*\*

- Analyze a single slide
  \*/
  private analyzeSlide(slide: ParsedSlide): EnhancedSlide {
  const enhanced: EnhancedSlide = { ...slide, contentBlocks: [] };

  for (const block of slide.contentBlocks) {
  if (block.type === 'text' || block.type === 'heading') {
  const analyzedBlocks = this.analyzeTextBlock(block);
  enhanced.contentBlocks.push(...analyzedBlocks);
  } else {
  enhanced.contentBlocks.push(block);
  }
  }

  return enhanced;

}

/\*\*

- Analyze text block and split into specialized blocks
  \*/
  private analyzeTextBlock(block: ContentBlock): ContentBlock[] {
  const text = block.content.text;
  const blocks: ContentBlock[] = [];

  // 1. Check for Bible verses
  const verseBlocks = this.extractVerses(text, block.order);
  if (verseBlocks.length > 0) {
  blocks.push(...verseBlocks);
  }

  // 2. Check for vocabulary terms
  const vocabBlocks = this.extractVocabulary(text, block.order);
  if (vocabBlocks.length > 0) {
  blocks.push(...vocabBlocks);
  }

  // 3. Check for callouts/highlighted text
  const calloutBlocks = this.extractCallouts(text, block.order);
  if (calloutBlocks.length > 0) {
  blocks.push(...calloutBlocks);
  }

  // 4. If no special patterns detected, return original block
  if (blocks.length === 0) {
  blocks.push(block);
  }

  return blocks;

}

/\*\*

- Extract Bible verses from text
  \*/
  private extractVerses(text: string, baseOrder: number): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  // Pattern: Book Chapter:Verse or Book Chapter:Verse-Verse
  const verseRegex = /(?:[1-3]\s)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s(\d+):(\d+)(?:-(\d+))?/g;

  let match;
  while ((match = verseRegex.exec(text)) !== null) {
  const [fullMatch, book, chapter, startVerse, endVerse] = match;

      blocks.push({
        type: 'verse' as any,
        order: baseOrder,
        content: {
          reference: fullMatch,
          book,
          chapter: parseInt(chapter),
          startVerse: parseInt(startVerse),
          endVerse: endVerse ? parseInt(endVerse) : undefined,
          text: this.extractVerseText(text, match.index)
        }
      });

  }

  return blocks;

}

/\*\*

- Extract verse text following reference
  \*/
  private extractVerseText(fullText: string, refIndex: number): string {
  // Look for text in quotes or parentheses after reference
  const afterRef = fullText.substring(refIndex);

  // Try to find quoted text
  const quoteMatch = afterRef.match(/[""]([^"""]+)[""]/) ||
  afterRef.match(/"([^"]+)"/);

  if (quoteMatch) {
  return quoteMatch[1];
  }

  // Try to find text in parentheses
  const parenMatch = afterRef.match(/\(([^)]+)\)/);
  if (parenMatch) {
  return parenMatch[1];
  }

  return '';

}

/\*\*

- Extract vocabulary definitions
  \*/
  private extractVocabulary(text: string, baseOrder: number): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  // Pattern 1: Term (language): definition
  // Example: "Ruach (Hebrew): wind, breath, spirit"
  const pattern1 = /([A-Za-zÀ-ÿ]+)\s*\(([^)]+)\)\s*:?\s\*([^\n.]+)/g;

  let match;
  while ((match = pattern1.exec(text)) !== null) {
  const [, term, language, definition] = match;

      // Check if this looks like a vocabulary term
      if (this.isLikelyVocabTerm(term, definition)) {
        blocks.push({
          type: 'vocabulary' as any,
          order: baseOrder,
          content: {
            term,
            language: language.trim(),
            definition: definition.trim()
          }
        });
      }

  }

  // Pattern 2: Bold term followed by definition
  // Would need formatting info from PowerPoint

  return blocks;

}

/\*\*

- Check if term/definition pair looks like vocabulary
  \*/
  private isLikelyVocabTerm(term: string, definition: string): boolean {
  // Heuristics:
  // - Term is 1-3 words
  // - Definition is at least 3 words
  // - Term is capitalized or contains special characters

  const termWords = term.split(/\s+/);
  const defWords = definition.split(/\s+/);

  return termWords.length <= 3 &&
  defWords.length >= 3 &&
  (term[0] === term[0].toUpperCase() || /[À-ÿ]/.test(term));

}

/\*\*

- Extract callout boxes
  \*/
  private extractCallouts(text: string, baseOrder: number): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  // Look for text preceded by indicators like:
  // - "Important:", "Note:", "Remember:", etc.
  // - Text in all caps
  // - Text with special formatting (would need formatting info)

  const calloutIndicators = /^(Important|Note|Remember|Key Point|Warning|Tip):\s\*(.+)/gim;

  let match;
  while ((match = calloutIndicators.exec(text)) !== null) {
  const [, indicator, content] = match;

      blocks.push({
        type: 'callout' as any,
        order: baseOrder,
        content: {
          type: indicator.toLowerCase(),
          text: content.trim()
        }
      });

  }

  return blocks;

}

/\*\*

- Detect if slide contains a quiz question
  \*/
  detectQuizQuestion(slide: ParsedSlide): QuizQuestion | null {
  const textBlocks = slide.contentBlocks.filter(b =>
  b.type === 'text' || b.type === 'heading'
  );

  if (textBlocks.length === 0) return null;

  const allText = textBlocks.map(b => b.content.text).join('\n');

  // Look for question patterns
  const questionIndicators = [
  /^(Question|Q\d+)[:.]?\s\*(.+\?)/im,
  /^What\s+/i,
  /^How\s+/i,
  /^Why\s+/i,
  /^When\s+/i,
  /^Where\s+/i,
  /^Who\s+/i,
  /\?$/m
  ];

  for (const pattern of questionIndicators) {
  if (pattern.test(allText)) {
  return this.extractQuizQuestion(allText);
  }
  }

  return null;

}

/\*\*

- Extract quiz question and answers
  \*/
  private extractQuizQuestion(text: string): QuizQuestion | null {
  // Find question (ends with ?)
  const questionMatch = text.match(/^(.+\?)/m);
  if (!questionMatch) return null;

  const question = questionMatch[1].trim();

  // Find answer options
  // Pattern: A. answer, B. answer, etc.
  // or: - answer, - answer
  // or: 1. answer, 2. answer

  const optionPatterns = [
  /^([A-D])[.)]\s*(.+?)$/gm,
  /^[-•]\s*(.+?)$/gm,
      /^(\d+)[.)]\s*(.+?)$/gm
  ];

  for (const pattern of optionPatterns) {
  const options: string[] = [];
  let match;

      while ((match = pattern.exec(text)) !== null) {
        options.push(match[match.length - 1].trim());
      }

      if (options.length >= 2) {
        return {
          question,
          options,
          type: 'multiple_choice'
        };
      }

  }

  // If no options found, might be short answer
  return {
  question,
  type: 'short_answer',
  options: []
  };

}
}

interface QuizQuestion {
question: string;
type: 'multiple_choice' | 'short_answer' | 'true_false';
options: string[];
correctAnswer?: string;
}

### Transformation: PowerPoint → Database

### Transformer Service

// src/services/pptx-transformer.ts

export class PowerPointTransformer {

/\*\*

- Transform parsed slides into database-ready format
  \*/
  async transform(
  parsedSlides: ParsedSlide[],
  lessonMetadata: LessonMetadata,
  teacherId: string
  ): Promise<LessonImportData> {

  const lessonId = uuidv4();
  const lesson: LessonData = {
  id: lessonId,
  course_id: lessonMetadata.courseId,
  title_en: lessonMetadata.titleEn,
  title_fr: lessonMetadata.titleFr,
  lesson_order: lessonMetadata.order,
  status: 'draft',
  imported_from_pptx: true,
  original_filename: lessonMetadata.filename
  };

  const slides: SlideData[] = [];
  const contentBlocks: ContentBlockData[] = [];
  const images: ImageUpload[] = [];

  for (let i = 0; i < parsedSlides.length; i++) {
  const parsedSlide = parsedSlides[i];
  const slideId = uuidv4();

      // Create slide
      const slide: SlideData = {
        id: slideId,
        lesson_id: lessonId,
        slide_order: i + 1,
        layout: this.mapLayout(parsedSlide.layout),
        title_en: this.extractSlideTitle(parsedSlide),
        notes_en: parsedSlide.notes
      };

      slides.push(slide);

      // Create content blocks
      for (let j = 0; j < parsedSlide.contentBlocks.length; j++) {
        const block = parsedSlide.contentBlocks[j];
        const blockId = uuidv4();

        const contentBlock: ContentBlockData = {
          id: blockId,
          slide_id: slideId,
          block_type: this.mapBlockType(block.type),
          block_order: j,
          content_en: this.transformBlockContent(block),
          style_config: this.transformBlockStyle(block)
        };

        contentBlocks.push(contentBlock);
      }

      // Process images
      for (const imageInfo of parsedSlide.images) {
        images.push({
          id: imageInfo.id,
          slideId,
          filename: imageInfo.filename,
          buffer: imageInfo.buffer,
          metadata: {
            width: imageInfo.width,
            height: imageInfo.height,
            position: imageInfo.position
          }
        });
      }

  }

  return {
  lesson,
  slides,
  contentBlocks,
  images
  };

}

/\*\*

- Map PowerPoint layout to our layout enum
  \*/
  private mapLayout(pptxLayout: string): string {
  const layoutMap: Record<string, string> = {
  'title': 'title',
  'two_column': 'two_column',
  'image_focus': 'image_focus',
  'content': 'content'
  };

  return layoutMap[pptxLayout] || 'content';

}

/\*\*

- Map content block type
  \*/
  private mapBlockType(type: string): string {
  const typeMap: Record<string, string> = {
  'heading': 'heading',
  'text': 'text',
  'image': 'image',
  'list': 'list',
  'verse': 'verse',
  'vocabulary': 'vocabulary',
  'callout': 'callout'
  };

  return typeMap[type] || 'text';

}

/\*\*

- Transform block content to JSONB format
  \*/
  private transformBlockContent(block: ContentBlock): any {
  switch (block.type) {
  case 'text':
  case 'heading':
  return {
  html: this.textToHtml(block.content.text, block.content.formatting),
  plainText: block.content.text
  };
  case 'image':
  return {
  imageId: block.content.imageId,
  alt: block.content.alt,
  caption: block.content.caption
  };

      case 'verse':
        return {
          reference: block.content.reference,
          text: block.content.text,
          book: block.content.book,
          chapter: block.content.chapter,
          startVerse: block.content.startVerse,
          endVerse: block.content.endVerse
        };

      case 'vocabulary':
        return {
          term: block.content.term,
          definition: block.content.definition,
          language: block.content.language
        };

      case 'list':
        return {
          listType: block.content.ordered ? 'ordered' : 'unordered',
          items: block.content.items
        };

      case 'callout':
        return {
          type: block.content.type,
          text: block.content.text
        };

      default:
        return block.content;

  }
  }

/\*\*

- Transform block style to JSONB format
  \*/
  private transformBlockStyle(block: ContentBlock): any {
  if (!block.formatting) return null;

  return {
  fontSize: block.formatting.fontSize,
  fontFamily: block.formatting.fontFamily,
  bold: block.formatting.bold,
  italic: block.formatting.italic,
  underline: block.formatting.underline,
  color: block.formatting.color,
  alignment: block.formatting.alignment
  };

}

/\*\*

- Convert plain text + formatting to HTML
  \*/
  private textToHtml(text: string, formatting?: FormatInfo): string {
  let html = text;

  // Escape HTML
  html = html
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

  // Convert newlines to <br>
  html = html.replace(/\n/g, '<br>');

  // Apply formatting
  if (formatting) {
  let style = '';

      if (formatting.fontSize) {
        style += `font-size: ${formatting.fontSize}px;`;
      }
      if (formatting.fontFamily) {
        style += `font-family: ${formatting.fontFamily};`;
      }
      if (formatting.color) {
        style += `color: ${formatting.color};`;
      }
      if (formatting.alignment) {
        style += `text-align: ${formatting.alignment};`;
      }

      html = `<span style="${style}">${html}</span>`;

      if (formatting.bold) {
        html = `<strong>${html}</strong>`;
      }
      if (formatting.italic) {
        html = `<em>${html}</em>`;
      }
      if (formatting.underline) {
        html = `<u>${html}</u>`;
      }

  }

  return `<p>${html}</p>`;

}

/\*\*

- Extract title from slide
  \*/
  private extractSlideTitle(slide: ParsedSlide): string | undefined {
  const titleBlock = slide.contentBlocks.find(b =>
  b.type === 'heading' ||
  (b.type === 'text' && b.content.formatting?.fontSize && b.content.formatting.fontSize > 20)
  );

  return titleBlock?.content.text;

}
}

interface LessonMetadata {
courseId: string;
titleEn: string;
titleFr?: string;
order: number;
filename: string;
}

interface LessonImportData {
lesson: LessonData;
slides: SlideData[];
contentBlocks: ContentBlockData[];
images: ImageUpload[];
}

### API Endpoints

### Import Controller

// src/controllers/import.controller.ts

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PowerPointParser } from '../services/powerpoint-parser';
import { ContentAnalyzer } from '../services/content-analyzer';
import { PowerPointTransformer } from '../services/pptx-transformer';
import { ImportService } from '../services/import.service';

const router = Router();
const upload = multer({
storage: multer.memoryStorage(),
limits: { fileSize: 50 _ 1024 _ 1024 }, // 50MB
fileFilter: (req, file, cb) => {
if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
cb(null, true);
} else {
cb(new Error('Only .pptx files are allowed'));
}
}
});

/\*\*

- POST /api/import/parse
- Parse PowerPoint file and return preview
  \*/
  router.post('/parse', upload.single('file'), async (req: Request, res: Response) => {
  try {
  if (!req.file) {
  return res.status(400).json({ error: 'No file uploaded' });
  }
  // Step 1: Parse PowerPoint
  const parser = new PowerPointParser();
  const parsedSlides = await parser.parse(req.file.buffer);

      // Step 2: Analyze content
      const analyzer = new ContentAnalyzer();
      const analyzedSlides = analyzer.analyze(parsedSlides);

      // Step 3: Return preview (don't save to database yet)
      return res.json({
        success: true,
        preview: {
          filename: req.file.originalname,
          slideCount: analyzedSlides.length,
          slides: analyzedSlides.map((slide, index) => ({
            slideNumber: index + 1,
            layout: slide.layout,
            title: slide.title,
            contentBlockCount: slide.contentBlocks.length,
            imageCount: slide.images.length,
            hasNotes: !!slide.notes,
            preview: this.generateSlidePreview(slide)
          }))
        },
        importId: uuidv4() // Store parsed data temporarily with this ID
      });

} catch (error) {
console.error('Error parsing PowerPoint:', error);
return res.status(500).json({
error: 'Failed to parse PowerPoint file',
details: error.message
});
}
});

/\*\*

- POST /api/import/confirm
- Confirm import and save to database
  \*/
  router.post('/confirm', async (req: Request, res: Response) => {
  try {
  const { importId, lessonMetadata, adjustments } = req.body;
  const teacherId = req.user.id; // From auth middleware
  // Retrieve parsed data from temporary storage (Redis/memory)
  const parsedData = await ImportService.getTemporaryImport(importId);
  if (!parsedData) {
  return res.status(404).json({ error: 'Import data not found or expired' });
  }

      // Apply any manual adjustments made in preview
      const adjustedData = ImportService.applyAdjustments(parsedData, adjustments);

      // Transform to database format
      const transformer = new PowerPointTransformer();
      const importData = await transformer.transform(
        adjustedData,
        lessonMetadata,
        teacherId
      );

      // Save to database
      const lessonId = await ImportService.saveImport(importData);

      // Clean up temporary storage
      await ImportService.deleteTemporaryImport(importId);

      return res.json({
        success: true,
        lessonId,
        message: 'Lesson imported successfully'
      });

} catch (error) {
console.error('Error confirming import:', error);
return res.status(500).json({
error: 'Failed to import lesson',
details: error.message
});
}
});

/\*\*

- Helper: Generate slide preview text
  \*/
  function generateSlidePreview(slide: any): string {
  const textBlocks = slide.contentBlocks
  .filter((b: any) => b.type === 'text' || b.type === 'heading')
  .slice(0, 2);

return textBlocks
.map((b: any) => b.content.text.substring(0, 100))
.join(' ... ');
}

export default router;

```

---

## Import Wizard UI Flow

### Step-by-Step Wizard
```

┌─────────────────────────────────────────────────────────────────────────────┐
│ Import PowerPoint Lesson [× Close] │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ Step 1 of 4: Upload File │
│ ═══════════════════════ │
│ │
│ ┌───────────────────────────────────────────────────────────────────────┐ │
│ │ │ │
│ │ 📎 Drag & Drop │ │
│ │ PowerPoint File Here │ │
│ │ │ │
│ │ or │ │
│ │ │ │
│ │ [📁 Choose File] │ │
│ │ │ │
│ │ Supported format: .pptx (Max 50MB) │ │
│ │ │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│ │
│ Recent Imports: │
│ • The Holy Spirit - Definition.pptx (Oct 10, 2025) │
│ • Gifts of the Spirit.pptx (Oct 8, 2025) │
│ │
│ [Cancel] [Next: Upload →] │
└───────────────────────────────────────────────────────────────────────────────┘

```

```

┌─────────────────────────────────────────────────────────────────────────────┐
│ Import PowerPoint Lesson [× Close] │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ Step 2 of 4: Processing │
│ ═══════════════════════ │
│ │
│ ┌───────────────────────────────────────────────────────────────────────┐ │
│ │ │ │
│ │ 📄 Analyzing: The_Holy_Spirit.pptx │ │
│ │ │ │
│ │ [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░] 65% │ │
│ │ │ │
│ │ ✓ Extracting slides (15 found) │ │
│ │ ✓ Processing images (8 found) │ │
│ │ ⟳ Analyzing content... │ │
│ │ ⏳ Detecting patterns... │ │
│ │ │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│ │
│ │
│ Please wait... │
└───────────────────────────────────────────────────────────────────────────────┘

```

```

┌─────────────────────────────────────────────────────────────────────────────┐
│ Import PowerPoint Lesson [× Close] │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ Step 3 of 4: Preview & Adjust │
│ ══════════════════════════════ │
│ │
│ ✓ Successfully parsed 15 slides │
│ │
│ Detected Content: │
│ • 3 Bible verse references │
│ • 5 vocabulary terms │
│ • 2 inline quizzes │
│ • 8 images │
│ │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ Slide Preview [View All]│ │
│ │ │ │
│ │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │ │
│ │ │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ ... │ │
│ │ │Title│ │Text│ │Verse│ │Image│ │Quiz│ │ │
│ │ └────┘ └────┘ └────┘ └────┘ └────┘ │ │
│ │ ▲ Selected │ │
│ │ │ │
│ │ Slide 1 - Title [Edit Layout ▾]│ │
│ │ ┌──────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Le Mot Esprit - DEFINITION en Hébreux et Grec │ │ │
│ │ │ │ │ │
│ │ │ Content Blocks: │ │ │
│ │ │ 1. Heading: "Le Mot Esprit - DEFINITION..." [✓ Correct] │ │ │
│ │ │ 2. Image: Diagram (800x600) [✓ Correct] │ │ │
│ │ │ 3. Text: "L'image du souffle évoque..." [✓ Correct] │ │ │
│ │ │ │ │ │
│ │ │ [Edit Slide] │ │ │
│ │ └──────────────────────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ⚠️ Issues Found: │
│ • Slide 7: Unable to detect quiz answer options (needs manual review) │
│ • Slide 12: Image quality low, may need replacement │
│ │
│ [◀ Back] [Next: Finalize →] │
└───────────────────────────────────────────────────────────────────────────────┘

```

```

┌─────────────────────────────────────────────────────────────────────────────┐
│ Import PowerPoint Lesson [× Close] │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ Step 4 of 4: Lesson Details │
│ ═══════════════════════ │
│ │
│ Course: [Introduction to Pneumatology ▾] │
│ │
│ Lesson Title (EN): [The Holy Spirit - Definition ] │
│ Lesson Title (FR): [Le Saint Esprit - Définition ] │
│ │
│ Description (EN): │
│ [An exploration of the biblical terms for the Holy Spirit, including...] │
│ │
│ Description (FR): │
│ [Une exploration des termes bibliques pour le Saint-Esprit...] │
│ │
│ Lesson Order: [3] (in course) │
│ Estimated Duration: [45] minutes │
│ │
│ Status: ◉ Save as Draft ○ Publish Immediately │
│ │
│ ☑ Preserve original PowerPoint file │
│ ☑ Create vocabulary glossary from detected terms │
│ ☑ Enable student notes │
│ │
│ [◀ Back] [🎉 Import Lesson] │
└───────────────────────────────────────────────────────────────────────────────┘

### Testing Strategy

### Test Cases

// tests/powerpoint-parser.test.ts

describe('PowerPointParser', () => {
let parser: PowerPointParser;

beforeEach(() => {
parser = new PowerPointParser();
});

describe('parse()', () => {
it('should parse a simple PowerPoint with text slides', async () => {
const fileBuffer = await readFile('test-files/simple.pptx');
const slides = await parser.parse(fileBuffer);

      expect(slides).toHaveLength(3);
      expect(slides[0].slideNumber).toBe(1);
      expect(slides[0].contentBlocks).toBeTruthy();
    });

    it('should extract images from slides', async () => {
      const fileBuffer = await readFile('test-files/with-images.pptx');
      const slides = await parser.parse(fileBuffer);

      const slideWithImage = slides.find(s => s.images.length > 0);
      expect(slideWithImage).toBeTruthy();
      expect(slideWithImage?.images[0].buffer).toBeInstanceOf(Buffer);
    });

    it('should preserve text formatting', async () => {
      const fileBuffer = await readFile('test-files/formatted-text.pptx');
      const slides = await parser.parse(fileBuffer);

      const textBlock = slides[0].contentBlocks.find(b => b.type === 'text');
      expect(textBlock?.content.formatting).toBeTruthy();
      expect(textBlock?.content.formatting?.bold).toBeDefined();
    });

    it('should extract speaker notes', async () => {
      const fileBuffer = await readFile('test-files/with-notes.pptx');
      const slides = await parser.parse(fileBuffer);

      const slideWithNotes = slides.find(s => s.notes);
      expect(slideWithNotes?.notes).toBeTruthy();
    });

    it('should handle slides with multiple content types', async () => {
      const fileBuffer = await readFile('test-files/complex-slide.pptx');
      const slides = await parser.parse(fileBuffer);

      const complexSlide = slides[0];
      const hasText = complexSlide.contentBlocks.some(b => b.type === 'text');
      const hasImage = complexSlide.images.length > 0;

      expect(hasText && hasImage).toBe(true);
    });

});

describe('detectLayout()', () => {
it('should detect title slide layout', async () => {
const fileBuffer = await readFile('test-files/title-slide.pptx');
const slides = await parser.parse(fileBuffer);

      expect(slides[0].layout).toBe('title');
    });

    it('should detect two-column layout', async () => {
      const fileBuffer = await readFile('test-files/two-column.pptx');
      const slides = await parser.parse(fileBuffer);

      expect(slides[0].layout).toBe('two_column');
    });

});
});

describe('ContentAnalyzer', () => {
let analyzer: ContentAnalyzer;

beforeEach(() => {
analyzer = new ContentAnalyzer();
});

describe('extractVerses()', () => {
it('should detect Bible verse references', () => {
const text = 'As John 3:16 says, "For God so loved the world..."';
const blocks = analyzer['extractVerses'](text, 0);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].content.reference).toBe('John 3:16');
      expect(blocks[0].content.book).toBe('John');
      expect(blocks[0].content.chapter).toBe(3);
    });

    it('should handle verse ranges', () => {
      const text = 'Romans 8:28-30 tells us...';
      const blocks = analyzer['extractVerses'](text, 0);

      expect(blocks[0].content.startVerse).toBe(28);
      expect(blocks[0].content.endVerse).toBe(30);
    });

});

describe('extractVocabulary()', () => {
it('should detect vocabulary terms', () => {
const text = 'Pneuma (Greek): spirit, breath, or wind';
const blocks = analyzer['extractVocabulary'](text, 0);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].content.term).toBe('Pneuma');
      expect(blocks[0].content.language).toBe('Greek');
      expect(blocks[0].content.definition).toContain('spirit');
    });

});

describe('detectQuizQuestion()', () => {
it('should detect multiple choice questions', () => {
const slide = {
contentBlocks: [{
type: 'text',
content: {
text: 'What does Pneuma mean?\nA. Spirit\nB. Water\nC. Fire'
}
}]
};

      const question = analyzer.detectQuizQuestion(slide as any);

      expect(question).toBeTruthy();
      expect(question?.type).toBe('multiple_choice');
      expect(question?.options).toHaveLength(3);
    });

});
});

### Error Handling & Edge Cases

### Common Issues & Solutions

// src/services/import-error-handler.ts

export class ImportErrorHandler {

/\*\*

- Handle and provide user-friendly error messages
  \*/
  static handleError(error: Error): ImportError {
  // File format errors
  if (error.message.includes('Invalid ZIP')) {
  return {
  type: 'INVALID_FORMAT',
  message: 'The file is not a valid PowerPoint presentation',
  suggestion: 'Please ensure you\'re uploading a .pptx file (not .ppt or other formats)',
  recoverable: false
  };
  }

  // Corrupted file
  if (error.message.includes('corrupt') || error.message.includes('parse')) {
  return {
  type: 'CORRUPTED_FILE',
  message: 'The PowerPoint file appears to be corrupted',
  suggestion: 'Try opening and re-saving the file in PowerPoint, then upload again',
  recoverable: false
  };
  }

  // File too large
  if (error.message.includes('size') || error.message.includes('limit')) {
  return {
  type: 'FILE_TOO_LARGE',
  message: 'The PowerPoint file is too large',
  suggestion: 'Please compress images or split into multiple lessons (max 50MB)',
  recoverable: false
  };
  }

  // Unsupported features
  if (error.message.includes('unsupported')) {
  return {
  type: 'UNSUPPORTED_CONTENT',
  message: 'The PowerPoint contains unsupported content',
  suggestion: 'Some advanced PowerPoint features (animations, embedded videos) are not supported. The lesson will import without these features.',
  recoverable: true
  };
  }

  // Network errors
  if (error.message.includes('network') || error.message.includes('timeout')) {
  return {
  type: 'NETWORK_ERROR',
  message: 'Upload failed due to network issues',
  suggestion: 'Please check your internet connection and try again',
  recoverable: true
  };
  }

  // Generic error
  return {
  type: 'UNKNOWN_ERROR',
  message: 'An unexpected error occurred during import',
  suggestion: 'Please try again. If the problem persists, contact support.',
  recoverable: true,
  details: error.message
  };

}
}

interface ImportError {
type: string;
message: string;
suggestion: string;
recoverable: boolean;
details?: string;
}

### Performance Optimization

### Large File Handling

// src/services/large-file-handler.ts

export class LargeFileHandler {

/\*\*

- Process large PowerPoint files in chunks
  _/
  async processLargeFile(fileBuffer: Buffer): Promise<ParsedSlide[]> {
  const fileSize = fileBuffer.length;
  const CHUNK_THRESHOLD = 20 _ 1024 \* 1024; // 20MB

  if (fileSize < CHUNK_THRESHOLD) {
  // Process normally
  return await new PowerPointParser().parse(fileBuffer);
  }

  // For large files, process slides in batches
  const parser = new PowerPointParser();
  const zip = await JSZip.loadAsync(fileBuffer);

  // First, get list of all slides
  const slideFiles = Object.keys(zip.files)
  .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
  .sort();

  // Process in batches of 5 slides
  const BATCH_SIZE = 5;
  const allSlides: ParsedSlide[] = [];

  for (let i = 0; i < slideFiles.length; i += BATCH_SIZE) {
  const batch = slideFiles.slice(i, i + BATCH_SIZE);
  const batchSlides = await Promise.all(
  batch.map(file => parser['parseSlide'](file, i + 1))
  );

      allSlides.push(...batchSlides);

      // Allow event loop to process other tasks
      await new Promise(resolve => setImmediate(resolve));

  }

  return allSlides;

}

/\*\*

- Optimize images during import
  _/
  async optimizeImages(images: ImageInfo[]): Promise<ImageInfo[]> {
  return await Promise.all(
  images.map(async (image) => {
  // Skip if already small
  if (image.buffer.length < 500 _ 1024) { // 500KB
  return image;
  }
  // Resize and compress
  const optimized = await sharp(image.buffer)
  .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 80 })
  .toBuffer();

          return {
            ...image,
            buffer: optimized,
            filename: image.filename.replace(/\.[^.]+$/, '.webp')
          };
        })
      );

  }
  }
