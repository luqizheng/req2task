import { describe, it, expect, vi, beforeEach } from "vitest";
import { useJsonStream } from "./useJson";

const FULL_TEXT = `'--------------------asdfjlajdfa
{
  "number":1,
  "string":"asdf",
  "keyElements": ["项目ID"],
  "questions": [
    { "question": "问题1", "purpose": "目的1" },
    { "question": "问题2", "purpose": "目的2" }
  ],
  "user": {
    "name": "张三",
    "email": "zhangsan@example.com"
  },
  "parameters":[1,"a","test"],
  "arrayArray":[
      {
        "user":"userName1",
        "roles":["asdf","adsf"]
      },
      {
        "user":"userName2",
        "roles":["asdf","adsf"]
      }
  ],
  "litters":{
      "user1":{
        "email":"aaa@aa.com",
        "name":"bbb@cc.com"
      },
      "user2":{
        "email":"aaa@aa.com",
        "name":"bbb@cc.com"
      }
  },
  "unitTests": [
    {
      "trigger": "number",
      "expected": 1
    }
  ]
}
阿发发打发---------------------------------------`;

function feedCharByChar(stream: ReturnType<typeof useJsonStream>, text: string) {
  for (let i = 0; i < text.length; i++) {
    stream.feed(text[i]);
  }
}

describe("useJsonStream 综合测试", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应触发 number 的 onObject", () => {
    const onObject = vi.fn();
    const stream = useJsonStream([{ trigger: "number", onObject }]);

    feedCharByChar(stream, FULL_TEXT);

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith(1);
  });

  it("应触发 string 的 onObject", () => {
    const onObject = vi.fn();
    const stream = useJsonStream([{ trigger: "string", onObject }]);

    feedCharByChar(stream, FULL_TEXT);

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith("asdf");
  });

  it("应触发 keyElements 的 onObject 和 onArrayItem", () => {
    const onObject = vi.fn();
    const onArrayItem = vi.fn();
    const stream = useJsonStream([
      { trigger: "keyElements", onObject, onArrayItem },
    ]);

    feedCharByChar(stream, FULL_TEXT);

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith(["项目ID"]);
    expect(onArrayItem).toHaveBeenCalledTimes(1);
    expect(onArrayItem).toHaveBeenCalledWith("项目ID", 0);
  });

  it("应触发 questions 的 onObject 和 onArrayItem", () => {
    const onObject = vi.fn();
    const onArrayItem = vi.fn();
    const stream = useJsonStream([
      { trigger: "questions", onObject, onArrayItem },
    ]);

    feedCharByChar(stream, FULL_TEXT);

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith([
      { question: "问题1", purpose: "目的1" },
      { question: "问题2", purpose: "目的2" },
    ]);
    expect(onArrayItem).toHaveBeenCalledTimes(2);
    expect(onArrayItem).toHaveBeenNthCalledWith(1, { question: "问题1", purpose: "目的1" }, 0);
    expect(onArrayItem).toHaveBeenNthCalledWith(2, { question: "问题2", purpose: "目的2" }, 1);
  });

  it("应触发 user.name 嵌套路径的 onObject", () => {
    const onObject = vi.fn();
    const stream = useJsonStream([{ trigger: "user.name", onObject }]);

    feedCharByChar(stream, FULL_TEXT);

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith("张三");
  });

  it("应触发 parameters 的 onObject 和 onArrayItem", () => {
    const onObject = vi.fn();
    const onArrayItem = vi.fn();
    const stream = useJsonStream([
      { trigger: "parameters", onObject, onArrayItem },
    ]);

    feedCharByChar(stream, FULL_TEXT);

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith([1, "a", "test"]);
    expect(onArrayItem).toHaveBeenCalledTimes(3);
    expect(onArrayItem).toHaveBeenNthCalledWith(1, 1, 0);
    expect(onArrayItem).toHaveBeenNthCalledWith(2, "a", 1);
    expect(onArrayItem).toHaveBeenNthCalledWith(3, "test", 2);
  });

  it("应触发 arrayArray 的 onObject 和 onArrayItem", () => {
    const onObject = vi.fn();
    const onArrayItem = vi.fn();
    const stream = useJsonStream([
      { trigger: "arrayArray", onObject, onArrayItem },
    ]);

    feedCharByChar(stream, FULL_TEXT);

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith([
      { user: "userName1", roles: ["asdf", "adsf"] },
      { user: "userName2", roles: ["asdf", "adsf"] },
    ]);
    expect(onArrayItem).toHaveBeenCalledTimes(2);
    expect(onArrayItem).toHaveBeenNthCalledWith(1, { user: "userName1", roles: ["asdf", "adsf"] }, 0);
    expect(onArrayItem).toHaveBeenNthCalledWith(2, { user: "userName2", roles: ["asdf", "adsf"] }, 1);
  });

  it("应触发 litters 的 onObject", () => {
    const onObject = vi.fn();
    const stream = useJsonStream([{ trigger: "litters", onObject }]);

    feedCharByChar(stream, FULL_TEXT);

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith({
      user1: { email: "aaa@aa.com", name: "bbb@cc.com" },
      user2: { email: "aaa@aa.com", name: "bbb@cc.com" },
    });
  });

  it("应触发 unitTests 的 onObject 和 onArrayItem", () => {
    const onObject = vi.fn();
    const onArrayItem = vi.fn();
    const stream = useJsonStream([
      { trigger: "unitTests", onObject, onArrayItem },
    ]);

    feedCharByChar(stream, FULL_TEXT);

    expect(onObject).toHaveBeenCalledTimes(1);
    expect(onObject).toHaveBeenCalledWith([{ trigger: "number", expected: 1 }]);
    expect(onArrayItem).toHaveBeenCalledTimes(1);
    expect(onArrayItem).toHaveBeenNthCalledWith(1, { trigger: "number", expected: 1 }, 0);
  });

  it("所有触发器同时工作 - 逐字符输入", () => {
    const numberObj = vi.fn();
    const stringObj = vi.fn();
    const keyElementsObj = vi.fn();
    const keyElementsItem = vi.fn();
    const questionsObj = vi.fn();
    const questionsItem = vi.fn();
    const userNameObj = vi.fn();
    const parametersObj = vi.fn();
    const parametersItem = vi.fn();
    const arrayArrayObj = vi.fn();
    const arrayArrayItem = vi.fn();
    const littersObj = vi.fn();
    const unitTestsObj = vi.fn();
    const unitTestsItem = vi.fn();

    const stream = useJsonStream([
      { trigger: "number", onObject: numberObj },
      { trigger: "string", onObject: stringObj },
      { trigger: "keyElements", onObject: keyElementsObj, onArrayItem: keyElementsItem },
      { trigger: "questions", onObject: questionsObj, onArrayItem: questionsItem },
      { trigger: "user.name", onObject: userNameObj },
      { trigger: "parameters", onObject: parametersObj, onArrayItem: parametersItem },
      { trigger: "arrayArray", onObject: arrayArrayObj, onArrayItem: arrayArrayItem },
      { trigger: "litters", onObject: littersObj },
      { trigger: "unitTests", onObject: unitTestsObj, onArrayItem: unitTestsItem },
    ]);

    feedCharByChar(stream, FULL_TEXT);

    expect(numberObj).toHaveBeenCalledWith(1);
    expect(stringObj).toHaveBeenCalledWith("asdf");
    expect(keyElementsObj).toHaveBeenCalledWith(["项目ID"]);
    expect(keyElementsItem).toHaveBeenCalledWith("项目ID", 0);
    expect(questionsObj).toHaveBeenCalledWith([
      { question: "问题1", purpose: "目的1" },
      { question: "问题2", purpose: "目的2" },
    ]);
    expect(questionsItem).toHaveBeenCalledTimes(2);
    expect(userNameObj).toHaveBeenCalledWith("张三");
    expect(parametersObj).toHaveBeenCalledWith([1, "a", "test"]);
    expect(parametersItem).toHaveBeenCalledTimes(3);
    expect(arrayArrayObj).toHaveBeenCalledWith([
      { user: "userName1", roles: ["asdf", "adsf"] },
      { user: "userName2", roles: ["asdf", "adsf"] },
    ]);
    expect(arrayArrayItem).toHaveBeenCalledTimes(2);
    expect(littersObj).toHaveBeenCalledWith({
      user1: { email: "aaa@aa.com", name: "bbb@cc.com" },
      user2: { email: "aaa@aa.com", name: "bbb@cc.com" },
    });
    expect(unitTestsObj).toHaveBeenCalledWith([{ trigger: "number", expected: 1 }]);
    expect(unitTestsItem).toHaveBeenCalledTimes(1);
  });

  it("getBuffer 应返回当前缓冲区内容", () => {
    const stream = useJsonStream([{ trigger: "test", onObject: vi.fn() }]);

    stream.feed('{"test":');
    expect(stream.getBuffer()).toBe('{"test":');

    stream.feed(' 1}');
    expect(stream.getBuffer()).toBe('{"test": 1}');
  });

  it("reset 后 getBuffer 应为空", () => {
    const stream = useJsonStream([{ trigger: "test", onObject: vi.fn() }]);

    stream.feed('{"test": 1}');
    expect(stream.getBuffer()).toBe('{"test": 1}');

    stream.reset();
    expect(stream.getBuffer()).toBe('');
  });
});
