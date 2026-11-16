/**
 * 导入LangChain核心提示模板模块
 * ChatPromptTemplate用于构建聊天提示模板
 */
import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * 从requirement.prompt文件中导入需求相关的提示模板
 * REQUIREMENT_SYSTEM_PROMPT: 系统级别的提示模板
 * REQUIREMENT_USER_TEMPLATE: 用户级别的提示模板
 */
import {
  REQUIREMENT_SYSTEM_PROMPT,
  REQUIREMENT_USER_TEMPLATE,
} from './prompts/requirement.prompt';

/**
 * 使用 ChatPromptTemplate.fromMessages 内置静态方法构建聊天提示模板
 *
 * 该方法接收一个消息元组数组，每个元组的格式为 [角色字符串, 模板内容字符串]
 * - 角色字符串: 指定消息的角色，如 'system'(系统设定), 'human'(用户输入), 'ai'(AI回复)
 * - 模板内容字符串: 该角色对应的提示词文本，支持使用 {变量名} 进行动态插值
 *
 * 此处构建了包含两条消息的模板：
 * 1. ['system', REQUIREMENT_SYSTEM_PROMPT] - 定义系统级别的行为规范与背景设定
 * 2. ['human', REQUIREMENT_USER_TEMPLATE] - 定义用户输入的提示词模板结构
 *
 * 返回值为 ChatPromptTemplate 实例，后续传入变量即可得到渲染结果。
 *
 * 关于实例的后续调用方法说明（以下返回值以 @langchain/core v1.4.1 实测为准）：
 * - .invoke(变量对象): 返回 ChatPromptValue（提示词值对象），内部调用 formatPromptValue；
 *   同时会经过 Runnable 的回调管理，支持传入 tags / metadata 用于追踪。
 * - .formatMessages(变量对象): 返回 BaseMessage[]，保留 system / human 角色，
 *   可直接传给聊天模型（如 ChatOpenAI）的 invoke 方法。
 * - .format(变量对象): 返回 Promise<string>，文本格式为 "System: ...\nHuman: ..."，
 *   角色信息以文本前缀的形式保留，并非丢失；注意 v1 中该方法是异步的，需要 await。
 */
export const requirementPrompt = ChatPromptTemplate.fromMessages([
  ['system', REQUIREMENT_SYSTEM_PROMPT],
  ['human', REQUIREMENT_USER_TEMPLATE],
]);
