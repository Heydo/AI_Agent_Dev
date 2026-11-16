/**
 * StringOutputParser 来自 @langchain/core/output_parsers（LangChain 内置输出解析器，无需额外依赖）。
 * 作用：把模型返回的 AIMessage 统一转成纯字符串。
 * 为什么需要它：模型输出是带 role、token 用量、工具调用等字段的消息对象，
 * 接上解析器后，链尾直接给业务层一个 string，调用方不用再关心消息结构。
 */
import { StringOutputParser } from '@langchain/core/output_parsers';
import { createChatModel } from './model.factory';
import { requirementPrompt } from './requirement.prompt-builder';

/**
 * 模型与解析器在模块加载时各创建一次，整条链随之复用。
 * 不要放到方法里每次新建：那样每次请求都会重新读取配置、重建 HTTP 客户端，既慢又浪费资源。
 */
const model = createChatModel();
const parser = new StringOutputParser();

/**
 * 用 Runnable 的 pipe() 方法把三段首尾相接，构建最小调用链（3.6）：
 *
 *   requirementPrompt（{ input } 对象 → ChatPromptValue）
 *     → model（ChatPromptValue → AIMessage）
 *     → parser（AIMessage → string）
 *
 * 为什么可以这样写：
 * - pipe() 由 LangChain 的 Runnable 基类提供，规则是"上一段的输出自动作为下一段的输入"；
 * - 模板、模型、解析器都继承自 Runnable，输入输出类型刚好能接上，所以能串。
 *
 * 返回值是一个 RunnableSequence，它和单个组件一样实现 invoke / stream / batch，
 * 所以调用方不需要关心里面有几段，按普通 Runnable 使用即可。
 */
export const requirementChain = requirementPrompt.pipe(model).pipe(parser);
