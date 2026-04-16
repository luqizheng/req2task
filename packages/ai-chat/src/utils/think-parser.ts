export interface ParsedContent {
  thinkingProcess: string;
  mainContent: string;
}

export function parseThinkBlocks(content: string): ParsedContent {
  const result: ParsedContent = {
    thinkingProcess: '',
    mainContent: content,
  };

  const thinkingMatches: string[] = [];

  let remainingContent = content;

  const angleBracketRegex = /<think[\s\S]*?<\/think>/gi;
  let angleBracketMatch;
  const angleBracketRegexObj = new RegExp(angleBracketRegex.source, 'gi');
  while ((angleBracketMatch = angleBracketRegexObj.exec(content)) !== null) {
    const block = angleBracketMatch[0];
    const innerContent = block
      .replace(/<\/?think[^>]*>/gi, '')
      .trim();
    if (innerContent) {
      thinkingMatches.push(innerContent);
    }
  }
  remainingContent = remainingContent.replace(angleBracketRegex, '');
  remainingContent = remainingContent.replace(/<\/?think[^>]*>/gi, '');

  const squareBracketRegex = /\[Thinking:\s*([^\]]+)\]/gi;
  let squareBracketMatch;
  const squareBracketRegexObj = new RegExp(squareBracketRegex.source, 'gi');
  while ((squareBracketMatch = squareBracketRegexObj.exec(content)) !== null) {
    if (squareBracketMatch[1]) {
      const innerContent = squareBracketMatch[1].trim();
      if (innerContent) {
        thinkingMatches.push(innerContent);
      }
    }
  }
  remainingContent = remainingContent.replace(squareBracketRegex, '');

  remainingContent = remainingContent.trim();

  result.thinkingProcess = thinkingMatches.join('\n\n').trim();
  result.mainContent = remainingContent.trim();

  return result;
}

export function extractThinkingProcess(content: string): string {
  const { thinkingProcess } = parseThinkBlocks(content);
  return thinkingProcess;
}

export function removeThinkingBlocks(content: string): string {
  let result = content;
  
  const angleBracketRegex = /<think[\s\S]*?<\/think>/gi;
  result = result.replace(angleBracketRegex, '');
  result = result.replace(/<\/?think[^>]*>/gi, '');
  
  const squareBracketRegex = /\[Thinking:\s*([^\]]+)\]/gi;
  result = result.replace(squareBracketRegex, '');
  
  return result.trim();
}
