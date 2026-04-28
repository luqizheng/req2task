export type PathTrigger = {
  trigger: string;
  onArrayItem?: (item: any, index: number) => void;
  onObject?: (obj: any) => void;
  onValue?: (value: any) => void;
};

function parsePath(path: string): Array<{ key: string; index?: number }> {
  return path.split('.').map(seg => {
    const match = seg.match(/^(.+?)(?:\[(\d+)\])?$/);
    if (!match) throw new Error(`Invalid path segment: ${seg}`);
    const key = match[1];
    const index = match[2] !== undefined ? parseInt(match[2], 10) : undefined;
    return { key, index };
  });
}

function stackToPath(stack: Array<{ type: 'object' | 'array'; key?: string; index?: number }>, currentKey: string | null): string {
  const parts: string[] = [];
  for (const frame of stack) {
    if (frame.type === 'object' && frame.key !== undefined) {
      parts.push(frame.key);
    } else if (frame.type === 'array' && frame.key !== undefined) {
      parts.push(frame.key);
    }
  }
  if (currentKey !== null) parts.push(currentKey);
  return parts.join('.');
}

export function useJsonStream(triggers: PathTrigger[]) {
  const triggerInfos = triggers.map(tr => ({
    trigger: tr,
    segments: parsePath(tr.trigger),
    triggeredArrayItems: new Set<number>(),
    triggeredObject: false,
    triggeredValue: false,
  }));

  let buffer = '';
  let pos = 0;
  let inString = false;
  let escape = false;
  let stack: Array<{
    type: 'object' | 'array';
    key?: string;
    index?: number;       // 下一个元素的索引
    startPos?: number;
  }> = [];
  let currentKey: string | null = null;
  let expectingValue = false;

  function checkAndTrigger(value: any, valuePath: string) {
    for (const info of triggerInfos) {
      const triggerPath = info.segments.map(seg => seg.index !== undefined ? `${seg.key}[${seg.index}]` : seg.key).join('.');
      if (valuePath !== triggerPath) continue;
      if (info.trigger.onObject && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (!info.triggeredObject && !info.triggeredValue) {
          info.triggeredObject = true;
          info.trigger.onObject(value);
        }
      } else if (info.trigger.onValue && !info.triggeredObject && !info.triggeredValue) {
        info.triggeredValue = true;
        info.trigger.onValue(value);
      }
    }
  }

  function triggerArrayItem(item: any, arrayPath: string, index: number) {
    for (const info of triggerInfos) {
      const triggerPath = info.segments.map(seg => seg.index !== undefined ? `${seg.key}[${seg.index}]` : seg.key).join('.');
      if (triggerPath !== arrayPath) continue;
      if (!info.trigger.onArrayItem) continue;
      if (!info.triggeredArrayItems.has(index)) {
        info.triggeredArrayItems.add(index);
        info.trigger.onArrayItem(item, index);
      }
    }
  }

  // 通用值完成处理：根据上下文决定触发 onArrayItem 还是 checkAndTrigger
  function onValueCompleted(value: any, _startPos: number, endPos: number) {
    // 检查当前栈中是否有数组帧，并且该值属于该数组的下一个元素
    // 如果栈顶是对象帧，且对象帧的 key 为 null（表示匿名对象，在数组内），或者上一个帧是数组
    let isArrayElement = false;
    let arrayFrameIndex = -1;
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].type === 'array') {
        arrayFrameIndex = i;
        isArrayElement = true;
        break;
      }
      // 如果遇到对象且 key 存在（即普通对象属性），则跳出，不属于数组元素
      if (stack[i].type === 'object' && stack[i].key !== undefined) break;
    }

    if (isArrayElement && arrayFrameIndex !== -1) {
      const arrFrame = stack[arrayFrameIndex];
      const idx = arrFrame.index ?? 0;
      // 构建数组路径（父栈 + 数组的 key）
      const parentStack = stack.slice(0, arrayFrameIndex);
      const arrayPath = stackToPath(parentStack, arrFrame.key ?? null);
      triggerArrayItem(value, arrayPath, idx);
      // 递增数组索引，准备下一个元素
      arrFrame.index = idx + 1;
    } else {
      // 普通对象属性或根值
      const path = stackToPath(stack, currentKey);
      checkAndTrigger(value, path);
    }
    // 重要：值完成后，重置 expectingValue 和 currentKey
    expectingValue = false;
    currentKey = null;
    pos = endPos;
  }

  function tryParseValue(start: number): { value: any; end: number } | null {
    if (start >= buffer.length) return null;
    const ch = buffer[start];

    if (ch === '"') {
      let i = start + 1;
      while (i < buffer.length) {
        if (buffer[i] === '\\') { i += 2; continue; }
        if (buffer[i] === '"') {
          const raw = buffer.slice(start, i + 1);
          return { value: JSON.parse(raw), end: i + 1 };
        }
        i++;
      }
      return null;
    }

    const literalMatch = /^(true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(buffer.slice(start));
    if (literalMatch) {
      const raw = literalMatch[1];
      let value: any;
      if (raw === 'true') value = true;
      else if (raw === 'false') value = false;
      else if (raw === 'null') value = null;
      else value = parseFloat(raw);
      return { value, end: start + raw.length };
    }

    if (ch === '{' || ch === '[') {
      let i = start + 1;
      let depth = 1;
      let inStr = false;
      let esc = false;
      while (i < buffer.length) {
        const c = buffer[i];
        if (esc) { esc = false; i++; continue; }
        if (c === '\\') { esc = true; i++; continue; }
        if (c === '"') { inStr = !inStr; i++; continue; }
        if (!inStr) {
          if (c === '{' || c === '[') depth++;
          else if (c === '}' || c === ']') {
            depth--;
            if (depth === 0) {
              const raw = buffer.slice(start, i + 1);
              try {
                const value = JSON.parse(raw);
                return { value, end: i + 1 };
              } catch { return null; }
            }
          }
        }
        i++;
      }
      return null;
    }
    return null;
  }

  function feed(chunk: string) {
    buffer += chunk;

    while (pos < buffer.length) {
      const ch = buffer[pos];

      if (inString) {
        if (escape) escape = false;
        else if (ch === '\\') escape = true;
        else if (ch === '"') inString = false;
        pos++;
        continue;
      }

      // 跳过空白字符
      if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') {
        pos++;
        continue;
      }

      // 对象开始
      if (ch === '{') {
        stack.push({ type: 'object', key: currentKey ?? undefined, startPos: pos });
        currentKey = null;
        expectingValue = false;
        pos++;
        continue;
      }

      // 数组开始
      if (ch === '[') {
        stack.push({ type: 'array', key: currentKey ?? undefined, index: 0, startPos: pos });
        currentKey = null;
        expectingValue = true;   // 数组开始后立刻期待第一个元素
        pos++;
        continue;
      }

      // 对象结束
      if (ch === '}') {
        if (stack.length > 0 && stack[stack.length - 1].type === 'object') {
          const objStart = stack[stack.length - 1].startPos!;
          const parsed = tryParseValue(objStart);
          if (parsed) {
            // 对象值已完成，通知完成处理
            onValueCompleted(parsed.value, objStart, parsed.end);
            stack.pop();
            continue;
          }
        }
        // 如果解析失败，跳过此字符
        pos++;
        continue;
      }

      // 数组结束
      if (ch === ']') {
        if (stack.length > 0 && stack[stack.length - 1].type === 'array') {
          const arrStart = stack[stack.length - 1].startPos!;
          const parsed = tryParseValue(arrStart);
          if (parsed) {
            // 数组整体作为一个值，通知完成处理
            onValueCompleted(parsed.value, arrStart, parsed.end);
            stack.pop();
            continue;
          }
        }
        pos++;
        continue;
      }

      // 读取对象键名
      if (!expectingValue && stack.length > 0 && stack[stack.length - 1].type === 'object' && currentKey === null) {
        if (ch === '"') {
          const keyStart = pos;
          let i = pos + 1;
          while (i < buffer.length) {
            if (buffer[i] === '\\') i += 2;
            else if (buffer[i] === '"') break;
            else i++;
          }
          if (i < buffer.length && buffer[i] === '"') {
            const rawKey = buffer.slice(keyStart, i + 1);
            currentKey = JSON.parse(rawKey);
            pos = i + 1;
            continue;
          } else {
            break; // 键名不完整
          }
        } else {
          pos++;
          continue;
        }
      }

      // 冒号
      if (ch === ':') {
        expectingValue = true;
        pos++;
        continue;
      }

      // 逗号
      if (ch === ',') {
        if (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (top.type === 'object') {
            currentKey = null;
            expectingValue = false;
          } else if (top.type === 'array') {
            // 逗号表示下一个元素即将出现
            expectingValue = true;
          }
        }
        pos++;
        continue;
      }

      // 期望一个值（简单值、对象或数组）
      if (expectingValue) {
        const parsed = tryParseValue(pos);
        if (parsed) {
          onValueCompleted(parsed.value, pos, parsed.end);
          continue; // onValueCompleted 已经更新 pos
        } else {
          // 值不完整，等待更多数据
          break;
        }
      }

      // 其他字符（垃圾数据）跳过
      pos++;
    }
  }

  function getBuffer() { return buffer; }
  function reset() {
    buffer = '';
    pos = 0;
    inString = false;
    escape = false;
    stack = [];
    currentKey = null;
    expectingValue = false;
    for (const info of triggerInfos) {
      info.triggeredArrayItems.clear();
      info.triggeredObject = false;
      info.triggeredValue = false;
    }
  }

  return { feed, reset, getBuffer };
}