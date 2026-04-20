import { Injectable } from '@nestjs/common';
import { RouteRule, RouteMatchResult } from './router.types';

@Injectable()
export class RouteMatcher {
  match(route: RouteRule, path: string, method: string): RouteMatchResult {
    if (!route.methods.includes('ALL') && !route.methods.includes(method.toUpperCase())) {
      return { matched: false };
    }

    let pattern: RegExp;
    if (route.isRegex) {
      try {
        pattern = new RegExp(route.pathPattern);
      } catch (error) {
        return { matched: false };
      }
    } else {
      pattern = this.pathToRegex(route.pathPattern);
    }

    const match = path.match(pattern);
    if (!match) {
      return { matched: false };
    }

    const params = this.extractParams(route.pathPattern, match);
    return { matched: true, rule: route, params };
  }

  private pathToRegex(pattern: string): RegExp {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\//g, '\\/');
    return new RegExp(`^${regexPattern}$`);
  }

  private extractParams(pattern: string, match: RegExpMatchArray): Record<string, string> {
    const params: Record<string, string> = {};
    const paramNames = (pattern.match(/:(\w+)/g) || []).map((p) => p.substring(1));
    
    paramNames.forEach((name, index) => {
      if (match[index + 1] !== undefined) {
        params[name] = match[index + 1];
      }
    });

    return params;
  }
}
