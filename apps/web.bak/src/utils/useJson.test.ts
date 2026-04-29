import { describe, it, expect } from "vitest";
import { useJsonStream } from "./useJson";

describe("useJsonStreamHelper - 调试", () => {
  it("简单数组测试", () => {
    const collected: unknown[] = [];
    const stream = useJsonStream([{
      trigger: "items",
      onObject: (obj) => {
        console.log("EMIT:", JSON.stringify(obj));
        collected.push(obj);
      },
    }]);

    const content = '{"items": [{ "a": 1 }, { "b": 2 }]}';
    console.log("Processing:", content);
    stream.feed(content);
    console.log("Final collected:", collected);
    expect(collected).toHaveLength(1);
    expect(collected[0]).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("逐字符输入测试", () => {
    const collected: unknown[] = [];
    const stream = useJsonStream([{
      trigger: "items",
      onObject: (obj) => {
        collected.push(obj);
      },
    }]);

    const content = '{"items": [{ "a": 1 }, { "b": 2 }]}';
    for (const char of content) {
      stream.feed(char);
    }

    expect(collected).toHaveLength(1);
    expect(collected[0]).toEqual([{ a: 1 }, { b: 2 }]);
  });
});
