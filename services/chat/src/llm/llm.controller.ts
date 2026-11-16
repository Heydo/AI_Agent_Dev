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
}
