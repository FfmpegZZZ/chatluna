import { Context } from 'koishi'
import { PLAN_CONFIG } from '../utils/billing'
import { UserReplyCount } from '../utils/billing'

// 在模块声明中扩展 Tables 接口
declare module 'koishi' {
  interface Tables {
    user_reply_count: UserReplyCount
  }
}

// 初始化数据库表
export async function initBillingDatabase(ctx: Context) {
  ctx.model.extend('user_reply_count', {
    userId: 'string',
    planType: {
      type: 'char',
      length: 10,
      initial: 'free'
    },
    remainingCount: {
      type: 'integer',
      initial: 0
    },
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
  }, {
    primary: 'userId',
    unique: ['userId']
  })
}

// 获取用户回复次数记录
export async function getUserReplyCount(ctx: Context, userId: string) {
  const records = await ctx.database.get('user_reply_count', { userId })
  return records.length > 0 ? records[0] : null
}

// 创建用户回复次数记录
export async function createUserReplyCount(ctx: Context, userId: string, planType: 'free' | 'pro' | 'max' = 'free') {
  const maxCount = PLAN_CONFIG[planType].maxCount
  const now = new Date()
  
  const record: UserReplyCount = {
    userId,
    planType,
    remainingCount: maxCount,
    createdAt: now,
    updatedAt: now
  }
  
  await ctx.database.create('user_reply_count', record)
  return record
}

// 更新用户回复次数
export async function updateUserReplyCount(ctx: Context, userId: string, remainingCount: number) {
  await ctx.database.set('user_reply_count', { userId }, {
    remainingCount,
    updatedAt: new Date()
  })
}

// 获取用户计划类型
export async function getUserPlanType(ctx: Context, userId: string): Promise<'free' | 'pro' | 'max'> {
  // 检查是否存在其他插件提供的计划服务
  // 使用更安全的方式访问可能不存在的属性
  if (ctx['planService'] && typeof ctx['planService'].getUserPlan === 'function') {
    try {
      const plan = await ctx['planService'].getUserPlan(userId)
      if (plan && (plan === 'free' || plan === 'pro' || plan === 'max')) {
        return plan
      }
    } catch (error) {
      ctx.logger.warn('Failed to get user plan from plan service:', error)
    }
  }
  
  // 如果没有其他插件提供计划服务，默认为free
  return 'free'
}