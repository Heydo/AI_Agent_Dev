import { Injectable } from '@nestjs/common';
import { createChatModel } from './model.factory';
import {
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import { requirementPrompt } from './requirement.prompt-builder';

/**
 * LlmService 服务类，提供与语言模型交互的服务
 * 使用 @Injectable() 装饰器标记为可注入，实例由 NestJS 依赖注入容器管理
 */
@Injectable()
export class LlmService {
  // 私有属性，用于存储聊天模型实例
  private model = createChatModel();

  /**
   * 调用演示方法，用于从输入文本中抽取结构化信息
   * @param input 需要处理的文本内容
   * @returns 返回抽取后的结构化信息字符串
   */
  async invokeDemo(input: string): Promise<string> {
    // 创建系统消息，定义助手的角色
    const systemMessage = new SystemMessage('你是一名需求结构化抽取助手');
    // 创建人类消息，包含需要处理的文本和抽取指令
    const humanMessage = new HumanMessage(
      `请从下面文本中抽取 action、constraints、entities：\n${input}`,
    );
    // 将系统消息和人类消息组合成消息数组
    const messages: BaseMessage[] = [systemMessage, humanMessage];
    // 调用模型处理消息并获取响应
    const response = await this.model.invoke(messages);
    // 返回响应内容，转换为字符串格式
    return response.content.toString();
  }

  /**
   * 流式处理输入文本并生成结构化抽取结果
   * @param input 需要处理的文本内容
   * @returns 返回一个可流式读取的结构化抽取结果
   */
  async streamDemo(input: string) {
    // 使用模型对输入文本进行流式处理
    // 首先设置系统角色为需求结构化抽取助手
    // 然后传入用户输入的文本内容
    return this.model.stream([
      new SystemMessage('你是一名需求结构化抽取助手'), // 系统消息，定义AI助手角色
      new HumanMessage(`请逐步分析并输出结构化抽取结果：\n${input}`), // 人类消息，包含需要处理的输入文本
    ]);
  }

  /**
   * 批量处理输入数据，进行需求结构化抽取
   * @param inputs - 需要处理的字符串数组，每个元素代表一个待抽取的需求文本
   * @returns 返回一个Promise，解析后的结果为字符串数组，每个元素是对应输入的结构化抽取结果
   */
  async batchDemo(inputs: string[]) {
    // 将输入数组映射为消息组数组，每个消息组包含系统消息和用户消息
    const messageGroups = inputs.map((input) => [
      new SystemMessage('你是一名需求结构化抽取助手'), // 系统消息，定义AI助手的角色
      new HumanMessage(`请抽取 action、constraints、entities：\n${input}`), // 用户消息，包含待抽取的需求文本和抽取指令
    ]);

    // 使用模型批量处理消息组，获取响应
    const responses = await this.model.batch(messageGroups);
    // 将响应内容转换为字符串并返回
    return responses.map((item) => item.content.toString());
  }

  /**
   * 预览提示词渲染结果（仅渲染模板，不调用模型）
   * @param input - 用户输入的原始文本内容
   * @returns 包含渲染后提示词文本的对象，文本格式为 "System: ...\nHuman: ..."
   */
  async promptPreview(input: string) {
    // invoke 返回 ChatPromptValue（提示词值对象），toString() 可得到完整提示词文本
    const promptValue = await requirementPrompt.invoke({ input });
    return { rendered: promptValue.toString() };
  }

  /**
   * 将用户输入套用提示词模板后发送给模型，并返回模型响应
   * @param input - 用户输入的原始文本内容
   * @returns 包含模型响应内容的对象
   */
  async promptToModel(input: string) {
    // formatMessages 返回 BaseMessage[]，保留 system / human 角色，可直接传给聊天模型
    const messages = await requirementPrompt.formatMessages({ input }); // 格式化提示消息
    const response = await this.model.invoke(messages); // 调用模型获取响应
    return { result: response.content }; // 返回响应内容
  }
}
