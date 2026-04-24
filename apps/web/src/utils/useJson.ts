export type PathTrigger = {
  trigger: string;
  onArrayItem?: (item: any, index: number) => void;
  onObject?: (obj: any) => void;
  onValue?: (value: any) => void;
};

export function useJsonStream(triggers: PathTrigger[]) {
  let buffer = '';
  const triggeredArrays = new Map<PathTrigger, Set<number>>();
  const triggeredObjects = new Set<PathTrigger>();
  const triggeredValues = new Set<PathTrigger>();

  function extractAfterPath(text: string, path: string): { start: number, afterPath: string } | null {
    const segments = path.split('.');
    let remaining = text;

    for (let s = 0; s < segments.length; s++) {
      const seg = segments[s].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`"${seg}"\\s*:\\s*`);
      const match = regex.exec(remaining);

      if (!match) return null;

      remaining = remaining.slice(match.index + match[0].length);

      if (s < segments.length - 1) {
        if (remaining[0] !== '{') return null;
        remaining = remaining.slice(1);
      }
    }

    return { start: -1, afterPath: remaining };
  }

  function extractCompleteValue(text: string): { value: string, end: number } | null {
    if (!text) return null;

    const firstChar = text[0];

    if (firstChar === '"' ) {
      let i = 1;
      while (i < text.length) {
        if (text[i] === '\\') {
          i += 2;
          continue;
        }
        if (text[i] === '"') {
          return { value: text.slice(0, i + 1), end: i + 1 };
        }
        i++;
      }
      return null;
    }

    if (firstChar === '{' || firstChar === '[') {
      const stack: string[] = [firstChar];
      let inStr = false;
      let esc = false;
      let i = 1;

      while (i < text.length) {
        const ch = text[i];
        if (esc) { esc = false; i++; continue; }
        if (ch === '\\') { esc = true; i++; continue; }
        if (ch === '"') { inStr = !inStr; i++; continue; }
        if (!inStr) {
          if (ch === '{' || ch === '[') {
            stack.push(ch);
          } else if (ch === '}' || ch === ']') {
            const last = stack[stack.length - 1];
            if ((last === '{' && ch === '}') || (last === '[' && ch === ']')) {
              stack.pop();
              if (stack.length === 0) {
                return { value: text.slice(0, i + 1), end: i + 1 };
              }
            }
          }
        }
        i++;
      }
      return null;
    }

    const simpleMatch = /^(true|false|null|\d+(?:\.\d+)?)/.exec(text);
    if (simpleMatch) {
      return { value: simpleMatch[1], end: simpleMatch[1].length };
    }

    return null;
  }

  function feed(chunk: string) {
    buffer += chunk;

    for (const trigger of triggers) {
      if (!trigger.onArrayItem) continue;

      const path = trigger.trigger;
      const extractResult = extractAfterPath(buffer, path);

      if (!extractResult) continue;

      const arrayContent = extractResult.afterPath;
      let depth = 0;
      let inArray = false;
      let inString = false;
      let escape = false;
      let elementStart = 0;
      let elementIndex = 0;
      let i = 0;

      while (i < arrayContent.length) {
        const char = arrayContent[i];

        if (escape) {
          escape = false;
          i++;
          continue;
        }

        if (char === '\\') {
          escape = true;
          i++;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          i++;
          continue;
        }

        if (!inString) {
          if (char === '[' && !inArray) {
            inArray = true;
            depth = 1;
            elementStart = i + 1;
            i++;
            continue;
          }

          if (inArray) {
            if (char === '[') {
              depth++;
            } else if (char === ']') {
              depth--;
              if (depth === 0) {
                const element = arrayContent.slice(elementStart, i);
                if (element.trim()) {
                  try {
                    const parsed = JSON.parse(element);
                    const triggered = triggeredArrays.get(trigger) || new Set();
                    if (!triggered.has(elementIndex)) {
                      triggered.add(elementIndex);
                      triggeredArrays.set(trigger, triggered);
                      trigger.onArrayItem!(parsed, elementIndex);
                    }
                  } catch (e) {
                    // 元素可能不完整
                  }
                }
                break;
              }
            } else if (char === ',' && depth === 1) {
              const element = arrayContent.slice(elementStart, i);
              if (element.trim()) {
                try {
                  const parsed = JSON.parse(element);
                  const triggered = triggeredArrays.get(trigger) || new Set();
                  if (!triggered.has(elementIndex)) {
                    triggered.add(elementIndex);
                    triggeredArrays.set(trigger, triggered);
                    trigger.onArrayItem!(parsed, elementIndex);
                  }
                  elementIndex++;
                  elementStart = i + 1;
                } catch (e) {
                  // 元素可能不完整，等待更多数据
                }
              }
            }
          }
        }

        i++;
      }
    }

    for (const trigger of triggers) {
      if (!trigger.onObject) continue;

      const path = trigger.trigger;
      const extractResult = extractAfterPath(buffer, path);

      if (!extractResult) continue;

      const afterPath = extractResult.afterPath;
      const result = extractCompleteValue(afterPath);
      if (result) {
        try {
          const parsed = JSON.parse(result.value);
          if (!triggeredObjects.has(trigger)) {
            triggeredObjects.add(trigger);
            trigger.onObject(parsed);
          }
        } catch (e) {
          // 值可能不完整
        }
      }
    }

    for (const trigger of triggers) {
      if (!trigger.onValue) continue;

      const path = trigger.trigger;
      const extractResult = extractAfterPath(buffer, path);

      if (!extractResult) continue;

      const afterPath = extractResult.afterPath;
      const simpleValueMatch = /^("(?:[^"\\]|\\.)*"|true|false|null|\d+(?:\.\d+)?)/.exec(afterPath);
      if (simpleValueMatch) {
        let value: any;
        const valueStr = simpleValueMatch[1];

        if (valueStr.startsWith('"')) {
          value = JSON.parse(valueStr);
        } else if (valueStr === 'true') {
          value = true;
        } else if (valueStr === 'false') {
          value = false;
        } else if (valueStr === 'null') {
          value = null;
        } else {
          value = parseFloat(valueStr);
        }

        if (!triggeredValues.has(trigger)) {
          triggeredValues.add(trigger);
          trigger.onValue(value);
        }
      }
    }
  }

  function getBuffer() {
    return buffer;
  }

  function reset() {
    buffer = '';
    triggeredArrays.clear();
    triggeredObjects.clear();
    triggeredValues.clear();
  }

  return { feed, reset, getBuffer };
}
