import { ChatOpenAI } from '@langchain/openai';
import {
  loadLangChainConfig,
  getApiKeys,
} from '../config/load-langchain-config';

/**
 * 创建聊天模型实例的函数
 * 该函数会加载配置和API密钥，然后返回一个配置好的ChatOpenAI实例
 * @returns {ChatOpenAI} 返回一个配置好的ChatOpenAI聊天模型实例
 */
export function createChatModel() {
  // 从配置文件中加载语言链的配置信息
  const config = loadLangChainConfig();
  // 获取所需的API密钥信息
  const keys = getApiKeys();

  // 返回一个新的ChatOpenAI实例，使用配置文件中的参数和API密钥
  return new ChatOpenAI({
    // 指定使用的模型名称
    model: config.llm.model,
    // 设置温度参数，控制输出的随机性
    temperature: config.llm.temperature,
    // 设置最大令牌数，限制输出的长度
    maxTokens: config.llm.maxTokens,
    // 设置OpenAI API密钥
    openAIApiKey: keys.openaiApiKey,
    // 如果提供了自定义的API基础URL，则设置它
    configuration: keys.openaiBaseUrl
      ? { baseURL: keys.openaiBaseUrl }
      : undefined,
  });
}
