import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { LLMService } from '../services/llm.service.js';
import { logger } from '../utils/logger.js';

const processTextSchema = z.object({
  text: z.string().min(1),
  task: z.enum(['transcription', 'summarize', 'extract', 'translate']).default('transcription'),
});

const taskPrompts: Record<string, { system: string; user: (text: string) => string }> = {
  transcription: {
    system: `You are an audio transcription processor. Your task is to:
1. Clean up and format the transcribed text
2. Fix obvious transcription errors
3. Add proper punctuation where appropriate
4. Preserve the original language and meaning
5. Return only the processed text without any additional comments

Keep the output natural and readable.`,
    user: (text: string) => `Please process and format the following audio transcription:\n\n${text}`,
  },
  summarize: {
    system: 'You are a text summarizer. Create a concise summary of the provided text while preserving key information.',
    user: (text: string) => `Summarize the following text:\n\n${text}`,
  },
  extract: {
    system: 'Extract key information from the text. Return structured data or key points.',
    user: (text: string) => `Extract key information from:\n\n${text}`,
  },
  translate: {
    system: 'Translate the text to the target language while preserving meaning and tone.',
    user: (text: string) => `Translate the following text:\n\n${text}`,
  },
};

export function createTextRoutes(llmService: LLMService): Router {
  const router = Router();

  router.post('/process', async (req: Request, res: Response) => {
    try {
      const validation = processTextSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ code: 1, message: validation.error.message });
      }

      const { text, task } = validation.data;
      const prompt = taskPrompts[task];

      const response = await llmService.complete([
        { role: 'system', content: prompt.system, id: '', createdAt: new Date() },
        { role: 'user', content: prompt.user(text), id: '', createdAt: new Date() },
      ]);

      logger.info({ task }, 'Text processed successfully');

      return res.json({
        code: 0,
        data: {
          result: response.content,
          task,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Text processing error');
      return res.status(500).json({ code: 1, message: 'Failed to process text' });
    }
  });

  return router;
}
