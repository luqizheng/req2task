import { describe, it, expect, vi, beforeEach } from "vitest";
import { useJsonStream } from "./useJson";

describe("useJsonStreamHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应检测触发字符串并调用 onObject", () => {
    const onObject = vi.fn();

    const stream = useJsonStream([
      {
        trigger: "questions",
        onObject,
      },
    ]);

    stream.feed('{"keyElements": [],"questions": [');
    stream.feed('{"question": "问题1", "purpose": "目的1"}');
    stream.feed("]");

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith([
      { question: "问题1", purpose: "目的1" },
    ]);
  });

  it("应处理跨 chunk 的 JSON 对象", () => {
    const onObject = vi.fn();

    const stream = useJsonStream([
      {
        trigger: "questions",
        onObject,
      },
    ]);

    stream.feed('{"keyElements": [],"questions": [');
    stream.feed('{"question": "这是跨chunk的');
    stream.feed('问题", "purpose": "测试"}');
    stream.feed("]");

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith([
      { question: "这是跨chunk的问题", purpose: "测试" },
    ]);
  });

  it("应处理多个 JSON 对象数组", () => {
    const onObject = vi.fn();

    const stream = useJsonStream([
      {
        trigger: "questions",
        onObject,
      },
    ]);

    stream.feed(
      '{"questions": [{"question": "Q1"}, {"question": "Q2"}, {"question": "Q3"}]}',
    );

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith([
      { question: "Q1" },
      { question: "Q2" },
      { question: "Q3" },
    ]);
  });

  it("应处理 Object 类型触发器", () => {
    const onObject = vi.fn();

    const stream = useJsonStream([
      {
        trigger: "data",
        onObject,
      },
    ]);

    stream.feed('{"data": {"id": 1, "name": "test"}}');

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith({ id: 1, name: "test" });
  });

  it("应处理字符串值中的转义引号", () => {
    const onObject = vi.fn();

    const stream = useJsonStream([
      {
        trigger: "questions",
        onObject,
      },
    ]);

    stream.feed(
      '{"questions": [{"question": "He said \\"hello\\"", "purpose": "test"}]}',
    );

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith([
      { question: 'He said "hello"', purpose: "test" },
    ]);
  });

  it("应使用 onArrayItem 增量触发数组元素", () => {
    const onArrayItem = vi.fn();

    const stream = useJsonStream([
      {
        trigger: "questions",
        onObject: vi.fn(),
        onArrayItem,
      },
    ]);

    stream.feed('{"questions": [{"question": "Q1"}, {"question": "Q2"}]}');

    expect(onArrayItem).toHaveBeenCalledTimes(2);
    expect(onArrayItem).toHaveBeenNthCalledWith(1, { question: "Q1" }, 0);
    expect(onArrayItem).toHaveBeenNthCalledWith(2, { question: "Q2" }, 1);
  });

  it("应正确解析用户提供的 JSON chunks（带 keyElements 和 questions）", () => {
    const onObject = vi.fn();

    const stream = useJsonStream([
      {
        trigger: "questions",
        onObject,
      },
    ]);

    stream.feed(
      '{"keyElements": ["项目ID", "项目背景", "原始需求"], "questions": [',
    );
    stream.feed(
      '{"question": "请提供详细的需求描述，包括具体的功能和预期效果。", "purpose": "明确需求的具体内容，以便准确理解和分析。"},',
    );
    stream.feed(
      '{"question": "这个需求的优先级是怎样的？是否有具体的优先级等级（如critical、high、medium、low）？", "purpose": "确定需求的优先级，以便在后续需求跟踪和项目规划中合理分配资源。"}]',
    );

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith([
      {
        question: "请提供详细的需求描述，包括具体的功能和预期效果。",
        purpose: "明确需求的具体内容，以便准确理解和分析。",
      },
      {
        question:
          "这个需求的优先级是怎样的？是否有具体的优先级等级（如critical、high、medium、low）？",
        purpose:
          "确定需求的优先级，以便在后续需求跟踪和项目规划中合理分配资源。",
      },
    ]);
  });

  it("应正确解析逐字符发送的 JSON chunks", () => {
    const onObject = vi.fn();

    const stream = useJsonStream([
      {
        trigger: "questions",
        onObject,
      },
    ]);

    const jsonStr =
      '{"keyElements": ["项目ID"], "questions": [{"question": "问题1", "purpose": "目的1"}, {"question": "问题2", "purpose": "目的2"}]}';

    let chunk = "";
    for (const char of jsonStr) {
      chunk += char;
      if (char === "}" || char === "]") {
        stream.feed(chunk);
        chunk = "";
      }
    }
    if (chunk) {
      stream.feed(chunk);
    }

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith([
      { question: "问题1", purpose: "目的1" },
      { question: "问题2", purpose: "目的2" },
    ]);
  });

  it("reset 应清空状态并重新开始", () => {
    const onObject = vi.fn();

    const stream = useJsonStream([
      {
        trigger: "questions",
        onObject,
      },
    ]);

    stream.feed('{"questions": [{"question": "Q1"}]}');
    expect(onObject).toHaveBeenCalledTimes(1);

    stream.reset();
    onObject.mockClear();

    stream.feed('{"questions": [{"question": "Q2"}]}');
    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith([{ question: "Q2" }]);
  });

  it("应支持多个触发器同时工作", () => {
    const onObject1 = vi.fn();
    const onObject2 = vi.fn();

    const stream = useJsonStream([
      { trigger: "questions", onObject: onObject1 },
      { trigger: "data", onObject: onObject2 },
    ]);

    stream.feed('{"questions": [{"q": "1"}], "data": {"id": 100}}');

    expect(onObject1).toHaveBeenCalledTimes(1);
    expect(onObject1).toHaveBeenCalledWith([{ q: "1" }]);
    expect(onObject2).toHaveBeenCalledTimes(1);
    expect(onObject2).toHaveBeenCalledWith({ id: 100 });
  });

  it("应处理嵌套路径", () => {
    const onObject = vi.fn();

    const stream = useJsonStream([
      {
        trigger: "nested.data.items",
        onObject,
      },
    ]);

    stream.feed('{"nested": {"data": {"items": [{"id": 1}, {"id": 2}]}}}');

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
  });
});
