import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { LlmService } from './llm.service';
// import { RequirementService } from './requirement.service';

/**
 * LlmController 类 - 处理与语言模型相关的API请求
 * 这个控制器负责处理 '/api/langchain' 路径下的所有请求
 */
@Controller('api/langchain')
export class LlmController {
  /**
   * 构造函数 - 依赖注入服务实例
   * @param llmService - 语言模型服务，提供语言模型相关的功能
   * @param requirementService - 需求服务，处理需求相关的业务逻辑（当前被注释）
   */
  constructor(
    private readonly llmService: LlmService,
    // private readonly requirementService: RequirementService,
  ) {}

  /**
   * 处理POST请求的端点，路径为'invoke'
   * 用于调用语言模型服务并返回结果
   */
  @Post('invoke')
  /**
   * 异步调用方法，用于处理传入的请求体并返回处理结果
   * @param body 包含输入参数的对象，其中input属性为字符串类型
   * @returns 返回一个包含result属性的对象，值为调用LLM服务后的结果
   */
  async invoke(@Body() body: { input: string }) {
    // 使用@Body装饰器获取请求体，并指定类型为包含input字符串属性的对象
    const result = await this.llmService.invokeDemo(body.input);
    return { result };
  }

  @Post('stream')
  /**
   * 处理流式响应请求的方法
   * @param body 包含输入参数的对象，input属性为输入的字符串
   * @param res Express.js的Response对象，用于发送响应
   */
  async stream(@Body() body: { input: string }, @Res() res: Response) {
    // 设置响应头，指定内容类型为Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    // 禁用缓存，确保实时性
    res.setHeader('Cache-Control', 'no-cache');
    // 保持连接活跃，支持长连接
    res.setHeader('Connection', 'keep-alive');

    // 调用LLM服务获取流式数据
    const stream = await this.llmService.streamDemo(body.input);

    // 遍历流式数据的每个块
    for await (const chunk of stream) {
      // 将每个块的内容写入响应流
      res.write(chunk.content);
    }

    // 完成响应，结束连接
    res.end();
  }

  @Post('batch')
  async batch(@Body() body: { inputs: string[] }) {
    const results = await this.llmService.batchDemo(body.inputs);
    return { results };
  }

  /**
   * 渲染提示词模板并返回结果，不调用大模型
   * @param body 包含输入参数的对象，其中input属性为字符串类型
   */
  @Post('prompt-preview')
  async promptPreview(@Body() body: { input: string }) {
    return this.llmService.promptPreview(body.input);
  }

  /**
   * 将模板渲染结果发送给大模型，并返回模型输出
   * @param body 包含输入参数的对象，其中input属性为字符串类型
   */
  @Post('prompt-to-model')
  async promptToModel(@Body() body: { input: string }) {
    return this.llmService.promptToModel(body.input);
  }

  /**
   * 通过调用链一次性返回结果：模板 → 模型 → 字符串解析
   *
   * 调用方式：POST /api/langchain/chain-invoke，body 为 { "input": "..." }
   * 与 prompt-to-model 的区别：处理逻辑封装在 requirementChain 里，controller 只负责传参。
   */
  @Post('chain-invoke')
  async chainInvoke(@Body() body: { input: string }) {
    return this.llmService.chainInvoke(body.input);
  }

  /**
   * 通过调用链流式返回结果（Content-Type: text/event-stream，边生成边写回响应）
   *
   * 调用方式：POST /api/langchain/chain-stream，body 为 { "input": "..." }
   * 与 3.4 的 stream 接口不同：链尾接了 StringOutputParser，
   * 所以 chunk 已经是字符串，直接 res.write(chunk) 即可，不需要再取 chunk.content。
   *
   * @param body 包含输入参数的对象，其中input属性为字符串类型
   * @param res Express 响应对象，用于直接写入事件流
   */
  @Post('chain-stream')
  async chainStream(@Body() body: { input: string }, @Res() res: Response) {
    // 声明响应类型为事件流，前端可用 fetch 读取响应体并逐块消费
    res.setHeader('Content-Type', 'text/event-stream');
    // 禁止缓存，避免代理或浏览器缓存流式内容
    res.setHeader('Cache-Control', 'no-cache');
    // 保持长连接，支持服务端持续推送
    res.setHeader('Connection', 'keep-alive');

    // stream() 返回的是 Promise，先 await 得到可异步迭代的流
    const stream = await this.llmService.chainStream(body.input);

    // 逐块写出，chunk 已被 StringOutputParser 转成字符串
    for await (const chunk of stream) {
      res.write(chunk);
    }

    // 所有分块发送完毕，结束响应
    res.end();
  }

  /**
   * 通过调用链批量执行多条输入
   *
   * 调用方式：POST /api/langchain/chain-batch，body 为 { "inputs": ["...", "..."] }
   * 批量逻辑与并发调度在 service 层由 Runnable.batch 完成，controller 只做透传。
   *
   * @param body 包含 inputs 数组的对象
   */
  @Post('chain-batch')
  async chainBatch(@Body() body: { inputs: string[] }) {
    return this.llmService.chainBatch(body.inputs);
  }
}
