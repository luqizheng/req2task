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

function stackToPath(stack: Array<{ type: 'object' | 'array'; key?: string; index?: number; isArrayElement?: boolean }>, currentKey: string | null): string {
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
  console.log('[useJsonStream] init with triggers:', triggers.map(t => t.trigger));

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
    index?: number;
    startPos?: number;
    isArrayElement?: boolean;
  }> = [];
  let currentKey: string | null = null;
  let expectingValue = false;

  // 判断当前解析的简单值是否为数组的直接元素（不在数组元素对象内部）
  function isDirectArrayElement(): boolean {
    if (!expectingValue) return false;
    // 如果栈顶是对象且标记为数组元素，说明当前在数组元素对象内部，简单值不是数组元素
    if (stack.length > 0 && stack[stack.length-1].type === 'object' && stack[stack.length-1].isArrayElement === true) {
      console.log('[isDirectArrayElement] false: inside array element object');
      return false;
    }
    // 查找数组帧
    let arrayIndex = -1;
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].type === 'array') {
        arrayIndex = i;
        break;
      }
    }
    if (arrayIndex === -1) return false;
    // 检查数组上方到栈顶之间是否有带 key 的对象（非数组元素对象）
    for (let i = stack.length - 1; i > arrayIndex; i--) {
      const frame = stack[i];
      if (frame.type === 'object' && frame.key !== undefined && frame.isArrayElement !== true) {
        console.log(`[isDirectArrayElement] false: inside object property "${frame.key}"`);
        return false;
      }
    }
    console.log('[isDirectArrayElement] true: direct array element');
    return true;
  }

  function checkAndTrigger(value: any, valuePath: string) {
    console.log(`[checkAndTrigger] path="${valuePath}"`, value);
    for (const info of triggerInfos) {
      const triggerPath = info.segments.map(seg => seg.index !== undefined ? `${seg.key}[${seg.index}]` : seg.key).join('.');
      console.log(`  compare with trigger="${triggerPath}"`);
      if (valuePath !== triggerPath) continue;
      if (info.trigger.onObject && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (!info.triggeredObject && !info.triggeredValue) {
          console.log(`  ✅ triggering onObject`);
          info.triggeredObject = true;
          info.trigger.onObject(value);
        }
      } else if (info.trigger.onValue && !info.triggeredObject && !info.triggeredValue) {
        console.log(`  ✅ triggering onValue`);
        info.triggeredValue = true;
        info.trigger.onValue(value);
      }
    }
  }

  function triggerArrayItem(item: any, arrayPath: string, index: number) {
    console.log(`[triggerArrayItem] arrayPath="${arrayPath}", index=${index}`, item);
    for (const info of triggerInfos) {
      const triggerPath = info.segments.map(seg => seg.index !== undefined ? `${seg.key}[${seg.index}]` : seg.key).join('.');
      console.log(`  compare with trigger="${triggerPath}"`);
      if (triggerPath !== arrayPath) continue;
      if (!info.trigger.onArrayItem) continue;
      if (!info.triggeredArrayItems.has(index)) {
        console.log(`  ✅ triggering onArrayItem`);
        info.triggeredArrayItems.add(index);
        info.trigger.onArrayItem(item, index);
      } else {
        console.log(`  already triggered, skip`);
      }
    }
  }

  function tryParseValue(start: number): { value: any; end: number } | null {
    if (start >= buffer.length) return null;
    const ch = buffer[start];
    console.log(`[tryParseValue] start=${start}, char="${ch}"`);

    if (ch === '"') {
      let i = start + 1;
      while (i < buffer.length) {
        if (buffer[i] === '\\') { i += 2; continue; }
        if (buffer[i] === '"') {
          const raw = buffer.slice(start, i + 1);
          const value = JSON.parse(raw);
          console.log(`  parsed string: ${raw} -> ${value}`);
          return { value, end: i + 1 };
        }
        i++;
      }
      console.log(`  incomplete string`);
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
      console.log(`  parsed literal: ${raw} -> ${value}`);
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
                console.log(`  parsed object/array (len=${raw.length})`);
                return { value, end: i + 1 };
              } catch (e) {
                console.log(`  parse error`, e);
                return null;
              }
            }
          }
        }
        i++;
      }
      console.log(`  incomplete object/array`);
      return null;
    }
    console.log(`  unknown start char`);
    return null;
  }

  function feed(chunk: string) {
    console.log(`[feed] chunk:`, chunk);
    buffer += chunk;

    while (pos < buffer.length) {
      const ch = buffer[pos];
      console.log(`[feed] pos=${pos}, char="${ch}", expectingValue=${expectingValue}, stackDepth=${stack.length}, stack=${JSON.stringify(stack.map(f => ({ type: f.type, key: f.key, idx: f.index, isArrayElem: f.isArrayElement })))}`);

      if (inString) {
        if (escape) escape = false;
        else if (ch === '\\') escape = true;
        else if (ch === '"') inString = false;
        pos++;
        continue;
      }

      if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') {
        pos++;
        continue;
      }

      if (ch === '{') {
        const isArrayElem = (expectingValue && stack.length > 0 && stack[stack.length - 1].type === 'array');
        console.log(`[feed] push OBJECT, key=${currentKey ?? 'null'}, isArrayElement=${isArrayElem}`);
        stack.push({ type: 'object', key: currentKey ?? undefined, startPos: pos, isArrayElement: isArrayElem });
        currentKey = null;
        expectingValue = false;
        pos++;
        continue;
      }

      if (ch === '[') {
        console.log(`[feed] push ARRAY, key=${currentKey ?? 'null'}, index=0`);
        stack.push({ type: 'array', key: currentKey ?? undefined, index: 0, startPos: pos });
        currentKey = null;
        expectingValue = true;
        pos++;
        continue;
      }

      if (ch === '}') {
        if (stack.length > 0 && stack[stack.length - 1].type === 'object') {
          const objFrame = stack[stack.length - 1];
          const objStart = objFrame.startPos!;
          const parsed = tryParseValue(objStart);
          if (parsed) {
            const isArrayElem = objFrame.isArrayElement === true;
            console.log(`[feed] object completed, isArrayElem=${isArrayElem}, parsed value=`, parsed.value);
            if (isArrayElem) {
              // 该对象是数组元素，触发 onArrayItem
              let arrIdx = -1;
              for (let i = stack.length - 1; i >= 0; i--) {
                if (stack[i].type === 'array') { arrIdx = i; break; }
              }
              if (arrIdx !== -1) {
                const arrFrame = stack[arrIdx];
                const idx = arrFrame.index ?? 0;
                const parentStack = stack.slice(0, arrIdx);
                const arrayPath = stackToPath(parentStack, arrFrame.key);
                triggerArrayItem(parsed.value, arrayPath, idx);
                arrFrame.index = idx + 1;
              }
            } else {
              const path = stackToPath(stack.slice(0, -1), currentKey);
              console.log(`[feed] object path = "${path}"`);
              checkAndTrigger(parsed.value, path);
            }
            pos = parsed.end;
            stack.pop();
            currentKey = null;
            expectingValue = false;
            continue;
          }
        }
        pos++;
        continue;
      }

      if (ch === ']') {
        if (stack.length > 0 && stack[stack.length - 1].type === 'array') {
          const arrStart = stack[stack.length - 1].startPos!;
          const parsed = tryParseValue(arrStart);
          if (parsed) {
            console.log(`[feed] array completed, ignoring trigger`);
            pos = parsed.end;
            stack.pop();
            currentKey = null;
            expectingValue = false;
            continue;
          }
        }
        pos++;
        continue;
      }

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
            currentKey = JSON.parse(buffer.slice(keyStart, i + 1));
            console.log(`[feed] read object key: ${currentKey}`);
            pos = i + 1;
            continue;
          } else {
            console.log(`[feed] incomplete key, waiting`);
            break;
          }
        } else {
          pos++;
          continue;
        }
      }

      if (ch === ':') {
        expectingValue = true;
        console.log(`[feed] colon, expectingValue=true`);
        pos++;
        continue;
      }

      if (ch === ',') {
        if (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (top.type === 'object') {
            currentKey = null;
            expectingValue = false;
          } else if (top.type === 'array') {
            expectingValue = true;
          }
        }
        console.log(`[feed] comma, expectingValue=${expectingValue}`);
        pos++;
        continue;
      }

      if (expectingValue) {
        const parsed = tryParseValue(pos);
        if (parsed) {
          const isArrayElem = isDirectArrayElement();
          console.log(`[feed] value parsed, isArrayElem=${isArrayElem}, value=`, parsed.value);
          if (isArrayElem) {
            // 简单值或 null 作为数组元素
            let arrIdx = -1;
            for (let i = stack.length - 1; i >= 0; i--) {
              if (stack[i].type === 'array') { arrIdx = i; break; }
            }
            if (arrIdx !== -1) {
              const arrFrame = stack[arrIdx];
              const idx = arrFrame.index ?? 0;
              const parentStack = stack.slice(0, arrIdx);
              const arrayPath = stackToPath(parentStack, arrFrame.key);
              if (typeof parsed.value !== 'object' || parsed.value === null) {
                triggerArrayItem(parsed.value, arrayPath, idx);
                arrFrame.index = idx + 1;
              } else {
                console.log(`[feed] value is object/array, will be triggered in its own closing brace`);
              }
            }
          } else {
            const path = stackToPath(stack, currentKey);
            console.log(`[feed] value path = "${path}"`);
            checkAndTrigger(parsed.value, path);
          }
          pos = parsed.end;
          expectingValue = false;
          currentKey = null;
          continue;
        } else {
          console.log(`[feed] value incomplete, break`);
          break;
        }
      }

      console.log(`[feed] skipping unknown char: "${ch}"`);
      pos++;
    }
    console.log(`[feed] end while, pos=${pos}, bufferLen=${buffer.length}`);
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
    console.log('[reset]');
  }

  return { feed, reset, getBuffer };
}