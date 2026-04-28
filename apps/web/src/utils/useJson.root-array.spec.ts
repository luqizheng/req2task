import { describe, it, expect, vi } from "vitest";
import { useJsonStream } from "./useJson";

function feedCharByChar(stream: ReturnType<typeof useJsonStream>, text: string) {
  for (let i = 0; i < text.length; i++) {
    stream.feed(text[i]);
  }
}

describe("useJsonStream - 根级别数组支持", () => {
  it("应支持根级别数组中对象的 requirements 字段", () => {
    const onArrayItem = vi.fn();
    const onObject = vi.fn();
    const stream = useJsonStream([
      { trigger: "requirements", onArrayItem, onObject },
    ]);

    const json = `[
      {
        "projectId": "c7f0953f-82ba-4560-a632-f711ce03d9ab",
        "keyElements": [],
        "requirements": [
          {
            "title": "导出文档功能",
            "description": "支持导出需求文档",
            "priority": "high"
          }
        ]
      }
    ]`;

    feedCharByChar(stream, json);

    expect(onArrayItem).toHaveBeenCalledTimes(1);
    expect(onArrayItem).toHaveBeenCalledWith(
      {
        title: "导出文档功能",
        description: "支持导出需求文档",
        priority: "high",
      },
      0
    );
  });

  it("应支持根级别数组中多个对象的 requirements 字段", () => {
    const onArrayItem = vi.fn();
    const stream = useJsonStream([
      { trigger: "requirements", onArrayItem },
    ]);

    const json = `[
      {
        "projectId": "p1",
        "requirements": [
          { "title": "需求1" },
          { "title": "需求2" }
        ]
      },
      {
        "projectId": "p2",
        "requirements": [
          { "title": "需求3" }
        ]
      }
    ]`;

    feedCharByChar(stream, json);

    expect(onArrayItem).toHaveBeenCalledTimes(3);
    expect(onArrayItem).toHaveBeenNthCalledWith(1, { title: "需求1" }, 0);
    expect(onArrayItem).toHaveBeenNthCalledWith(2, { title: "需求2" }, 1);
    expect(onArrayItem).toHaveBeenNthCalledWith(3, { title: "需求3" }, 2);
  });

  it("应支持流式输入根级别数组", () => {
    const onArrayItem = vi.fn();
    const stream = useJsonStream([
      { trigger: "requirements", onArrayItem },
    ]);

    const chunks = [
      '[{',
      '"projectId":"p1",',
      '"requirements":[',
      '{"title":"需求1"},',
      '{"title":"需求2"}',
      ']}',
      ']'
    ];

    for (const chunk of chunks) {
      stream.feed(chunk);
    }

    expect(onArrayItem).toHaveBeenCalledTimes(2);
    expect(onArrayItem).toHaveBeenNthCalledWith(1, { title: "需求1" }, 0);
    expect(onArrayItem).toHaveBeenNthCalledWith(2, { title: "需求2" }, 1);
  });

  it("应支持根级别数组中对象的 onObject 回调", () => {
    const onObject = vi.fn();
    const stream = useJsonStream([
      { trigger: "requirements", onObject },
    ]);

    const json = `[
      {
        "projectId": "p1",
        "requirements": [
          { "title": "需求1" },
          { "title": "需求2" }
        ]
      }
    ]`;

    feedCharByChar(stream, json);

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith([
      { title: "需求1" },
      { title: "需求2" }
    ]);
  });

  it("应支持根级别数组中对象的 onValue 回调", () => {
    const onValue = vi.fn();
    const stream = useJsonStream([
      { trigger: "projectId", onValue },
    ]);

    const json = `[
      {
        "projectId": "p1",
        "requirements": []
      },
      {
        "projectId": "p2",
        "requirements": []
      }
    ]`;

    feedCharByChar(stream, json);

    expect(onValue).toHaveBeenCalledTimes(2);
    expect(onValue).toHaveBeenNthCalledWith(1, "p1");
    expect(onValue).toHaveBeenNthCalledWith(2, "p2");
  });

  it("应支持混合根级别数组和嵌套对象", () => {
    const onProjectId = vi.fn();
    const onRequirementsItem = vi.fn();
    const stream = useJsonStream([
      { trigger: "projectId", onValue: onProjectId },
      { trigger: "requirements", onArrayItem: onRequirementsItem },
    ]);

    const json = `[
      {
        "projectId": "p1",
        "requirements": [{ "title": "R1" }]
      },
      {
        "projectId": "p2",
        "requirements": [{ "title": "R2" }, { "title": "R3" }]
      }
    ]`;

    feedCharByChar(stream, json);

    expect(onProjectId).toHaveBeenCalledTimes(2);
    expect(onProjectId).toHaveBeenNthCalledWith(1, "p1");
    expect(onProjectId).toHaveBeenNthCalledWith(2, "p2");

    expect(onRequirementsItem).toHaveBeenCalledTimes(3);
    expect(onRequirementsItem).toHaveBeenNthCalledWith(1, { title: "R1" }, 0);
    expect(onRequirementsItem).toHaveBeenNthCalledWith(2, { title: "R2" }, 1);
    expect(onRequirementsItem).toHaveBeenNthCalledWith(3, { title: "R3" }, 2);
  });
});
