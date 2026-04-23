import { computed, ref } from 'vue';
import { Marked } from 'marked';
import hljs from 'highlight.js';
import { parseThinkBlocks } from '../utils/think-parser';

const marked = new Marked({
  gfm: true,
  breaks: true,
});

marked.use({
  renderer: {
    code(code: string, language: string | undefined) {
      const validLang = language && hljs.getLanguage(language) ? language : 'plaintext';
      const highlighted = hljs.highlight(code, { language: validLang }).value;
      return `<pre><code class="hljs language-${validLang}">${highlighted}</code></pre>`;
    },
  },
});

export interface ParsedMarkdown {
  html: string;
  thinkingProcess: string;
  mainContent: string;
  rawContent: string;
}

export function useMarkdown() {
  const content = ref('');

  function render(markdown: string): ParsedMarkdown {
    const { thinkingProcess, mainContent } = parseThinkBlocks(markdown);
    const html = marked.parse(mainContent) as string;

    return {
      html,
      thinkingProcess,
      mainContent,
      rawContent: markdown,
    };
  }

  function renderToHtml(markdown: string): string {
    const { mainContent } = parseThinkBlocks(markdown);
    return marked.parse(mainContent) as string;
  }

  function renderWithThinking(markdown: string): {
    html: string;
    thinkingProcess: string;
  } {
    const { thinkingProcess, mainContent } = parseThinkBlocks(markdown);
    const html = marked.parse(mainContent) as string;

    return {
      html,
      thinkingProcess,
    };
  }

  const parsedContent = computed(() => {
    if (!content.value) {
      return {
        html: '',
        thinkingProcess: '',
        mainContent: '',
        rawContent: '',
      };
    }
    return render(content.value);
  });

  return {
    content,
    render,
    renderToHtml,
    renderWithThinking,
    parsedContent,
  };
}
