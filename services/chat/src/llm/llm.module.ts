import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmController } from './llm.controller';
// import { RequirementService } from './requirement.service';

/**
 * LlmModule 模块定义
 * 使用 @Module 装饰器标记，是 NestJS 框架中的模块类
 * 该模块整合了 LLM 相关的服务和控制器，并将其导出供其他模块使用
 */
@Module({
  providers: [
    LlmService,
    // RequirementService
  ], // 提供的提供者（服务）列表，这些服务将在模块内被实例化和管理
  controllers: [LlmController], // 控制器列表，用于处理传入的请求并返回响应
  exports: [
    LlmService,
    // RequirementService
  ], // 导出服务列表，允许其他模块导入和使用这些服务
})
export class LlmModule {} // 模块类声明，导出以便其他模块可以导入使用
