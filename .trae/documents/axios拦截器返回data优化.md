# axios 拦截器返回 data 优化

## 目标

修改 `axios.ts` 响应拦截器，让成功响应直接返回 `apiResponse.data`（业务数据），而非完整的 `response`（AxiosResponse）。

## 收益

- 前端调用更简洁：`const data = await api.get()` 即可获取业务数据
- 消除双重解构：`const { data } = await api...` → `const data = await api...`
- 消除 `response.data.data` 模式

## 修改清单

### 1. `apps/web/src/api/axios.ts`
- 第 38 行：`return response;` → `return apiResponse.data;`

### 2. 使用 `{ data }` 解构的文件（改为直接使用）

| 文件 | 行数 | 修改内容 |
|------|------|----------|
| `views/LoginView.vue` | 36 | `const { data }` → `const data` |
| `stores/task.ts` | 30,41,51,61,101,112,122,133 | `const { data }` → `const data` |
| `stores/requirement.ts` | 35,46,88,98,112,131,141 | `const { data }` → `const data` |
| `views/ProjectDetailView.vue` | 60 | `const { data }` → `const data` |
| `stores/project.ts` | 21,32 | `const { data }` → `const data` |
| `stores/userManage.ts` | 23,34 | `const { data }` → `const data` |

### 3. 使用 `response.data.data` 的文件（改为 `response.data`）

| 文件 | 行数 | 修改内容 |
|------|------|----------|
| `stores/ai.ts` | 18,36,52 | `response.data.data` → `response.data` |
| `views/AiRequirementGenView.vue` | 67,103,128 | `response.data.data` → `response.data` |

## 执行顺序

1. 修改 `axios.ts` 拦截器
2. 修改所有 `{ data }` 解构为直接使用
3. 修改所有 `response.data.data` 为 `response.data`
4. 运行 lint 和类型检查验证
