import { Injectable } from '@nestjs/common';

@Injectable()
export class RenderService {
  render(content: string, params: Record<string, unknown>): string {
    let result = content;

    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(this.escapeRegex(placeholder), 'g');
      result = result.replace(regex, String(value ?? ''));
    }

    result = this.removeUnfilledPlaceholders(result);
    result = this.cleanExtraBlankLines(result);

    return result.trim();
  }

  renderHandlebars(content: string, params: Record<string, unknown>): string {
    let result = content;

    result = this.processConditionals(result, params);
    result = this.processEachLoops(result, params);
    result = this.processBasicVariables(result, params);

    result = this.removeUnfilledPlaceholders(result);
    result = this.cleanExtraBlankLines(result);

    return result.trim();
  }

  private processConditionals(
    content: string,
    params: Record<string, unknown>,
  ): string {
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return content.replace(conditionalRegex, (_, key, inner) => {
      const value = params[key];
      return value ? inner : '';
    });
  }

  private processEachLoops(
    content: string,
    params: Record<string, unknown>,
  ): string {
    const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return content.replace(eachRegex, (match, key, inner) => {
      const value = params[key];
      if (!Array.isArray(value)) return '';

      return value
        .map((item) => {
          let result = inner;
          for (const [k, v] of Object.entries(
            typeof item === 'object' ? item : {},
          )) {
            result = result.replace(new RegExp(`{{this\\.${k}}}`, 'g'), String(v));
          }
          return result;
        })
        .join('');
    });
  }

  private processBasicVariables(
    content: string,
    params: Record<string, unknown>,
  ): string {
    let result = content;

    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value ?? ''));
    }

    return result;
  }

  private removeUnfilledPlaceholders(content: string): string {
    return content.replace(/\{\{[^}]+\}\}/g, '');
  }

  private cleanExtraBlankLines(content: string): string {
    return content.replace(/\n{3,}/g, '\n\n');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}