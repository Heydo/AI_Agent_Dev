import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';

export type LangChainAppConfig = {
  llm: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  retrieval: {
    enabled: boolean;
    topK: number;
  };
  tools: {
    enableConstraintCheck: boolean;
    enableEntityLookup: boolean;
  };
  features: {
    enableStructuredOutput: boolean;
    enableStreaming: boolean;
  };
};

/**
 * 加载LangChain配置文件
 * @returns 返回解析后的LangChainAppConfig对象
 */
export function loadLangChainConfig(): LangChainAppConfig {
  // 构建配置文件路径，当前工作目录下的config/langchain.yaml文件
  const filePath = path.join(process.cwd(), 'config', 'langchain.yaml');
  // 同步读取配置文件内容
  const raw = fs.readFileSync(filePath, 'utf8');
  // 将YAML格式字符串解析为LangChainAppConfig对象并返回
  return yaml.load(raw) as LangChainAppConfig;
}

/**
 * 获取API密钥配置信息
 * 该函数从环境变量中读取各种API的密钥和基础URL配置
 * @returns {object} 包含所有API密钥和基础URL配置的对象
 */
export function getApiKeys() {
  return {
    // OpenAI API密钥，如果环境变量不存在则使用空字符串作为默认值
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    // OpenAI API基础URL配置
    openaiBaseUrl: process.env.OPENAI_BASE_URL,
    // 嵌入模型API密钥，优先使用EMBEDDING_API_KEY，如果不存在则使用OPENAI_API_KEY
    embeddingApiKey:
      process.env.EMBEDDING_API_KEY ?? process.env.OPENAI_API_KEY ?? '',
    // 向量数据库的URL配置
    vectorDbUrl: process.env.VECTOR_DB_URL,
    // 向量数据库的API密钥配置
    vectorDbApiKey: process.env.VECTOR_DB_API_KEY,
  };
}
