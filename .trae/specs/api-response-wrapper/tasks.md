# Tasks

- [x] Task 1: 更新 packages/dto 中的 ApiResponseDto 接口定义
  - [x] SubTask 1.1: 修改 api-response.dto.ts，添加 time、url、method、body 字段
  - [x] SubTask 1.2: 重新构建 dto 包

- [x] Task 2: 后端 NestJS 添加全局响应拦截器
  - [x] SubTask 2.1: 创建响应拦截器文件 common/interceptors/api-response.interceptor.ts
  - [x] SubTask 2.2: 在 app.module.ts 中全局注册拦截器
  - [x] SubTask 2.3: 更新 main.ts 启用 TransformInterceptor

- [x] Task 3: 前端 axios 响应拦截器适配
  - [x] SubTask 3.1: 修改 axios.ts 响应拦截器，提取 response.data
  - [x] SubTask 3.2: 处理错误响应，提取 message 信息