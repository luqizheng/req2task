export type PathTrigger = {
  trigger: string;
  onArrayItem?: (item: any, index: number) => void;
  onValue?: (value: any) => void;
};

export function useJsonStream(triggers: PathTrigger[]) {
  let buffer = '';
  const triggeredArrays = new Map<string, Set<number>>();
  
  // 提取目标路径后的内容
  function extractAfterPath(text: string, path: string): { start: number, afterPath: string } | null {
    const pathPattern = path.replace(/\./g, '\\.');
    const regex = new RegExp(`"${pathPattern}"\\s*:\\s*`, 'g');
    const match = regex.exec(text);
    
    if (!match) return null;
    
    return {
      start: match.index + match[0].length,
      afterPath: text.slice(match.index + match[0].length)
    };
  }
  
  // 流式提取数组元素
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
      
      // 找到数组开始
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
                // 数组结束，处理最后一个元素
                const element = arrayContent.slice(elementStart, i);
                if (element.trim()) {
                  try {
                    const parsed = JSON.parse(element);
                    const triggered = triggeredArrays.get(path) || new Set();
                    if (!triggered.has(elementIndex)) {
                      triggered.add(elementIndex);
                      triggeredArrays.set(path, triggered);
                      trigger.onArrayItem!(parsed, elementIndex);
                    }
                  } catch (e) {
                    // 元素可能不完整
                  }
                }
                break;
              }
            } else if (char === ',' && depth === 1) {
              // 完成一个元素
              const element = arrayContent.slice(elementStart, i);
              if (element.trim()) {
                try {
                  const parsed = JSON.parse(element);
                  const triggered = triggeredArrays.get(path) || new Set();
                  if (!triggered.has(elementIndex)) {
                    triggered.add(elementIndex);
                    triggeredArrays.set(path, triggered);
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
    
    // 处理普通值
    for (const trigger of triggers) {
      if (!trigger.onValue) continue;
      
      const path = trigger.trigger;
      const extractResult = extractAfterPath(buffer, path);
      
      if (!extractResult) continue;
      
      const afterPath = extractResult.afterPath;
      // 尝试提取简单值（非对象、非数组）
      const simpleValueMatch = /^(".*?"|true|false|null|\d+(?:\.\d+)?)/.exec(afterPath);
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
        
        // 简单值只触发一次
        const key = `value:${path}`;
        const triggered = triggeredArrays.get(key);
        if (!triggered) {
          triggeredArrays.set(key, new Set());
          trigger.onValue(value);
        }
      }
    }
  }
  
  function reset() {
    buffer = '';
    triggeredArrays.clear();
  }
  
  return { feed, reset };
}