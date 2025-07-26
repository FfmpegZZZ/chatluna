import { Context } from 'koishi'
import { getUserReplyCount, createUserReplyCount, updateUserReplyCount, getUserPlanType } from '../services/billing-database'
import { PLAN_CONFIG } from '../utils/billing'

// 检查用户是否有足够的回复次数
export async function checkUserQuota(ctx: Context, userId: string) {
  // 获取用户计划类型
  const planType = await getUserPlanType(ctx, userId)
  
  // 获取用户回复次数记录
  let userRecord = await getUserReplyCount(ctx, userId)
  
  // 如果是新用户，创建记录
  if (!userRecord) {
    userRecord = await createUserReplyCount(ctx, userId, planType)
  }
  
  // 如果计划类型发生变化，更新记录
  if (userRecord.planType !== planType) {
    userRecord.planType = planType
    // 重置次数为新计划的最大次数
    const maxCount = PLAN_CONFIG[planType].maxCount
    userRecord.remainingCount = maxCount
    await updateUserReplyCount(ctx, userId, userRecord.remainingCount)
  }
  
  // 检查次数是否足够
  if (userRecord.remainingCount <= 0) {
    return {
      allowed: false,
      message: `您的回复次数已用完。当前计划: ${planType} (${PLAN_CONFIG[planType].maxCount}次/天)`
    }
  }
  
  return { allowed: true }
}

// 扣除用户回复次数
export async function deductUserQuota(ctx: Context, userId: string) {
  const userRecord = await getUserReplyCount(ctx, userId)
  
  if (!userRecord || userRecord.remainingCount <= 0) {
    return false
  }
  
  await updateUserReplyCount(ctx, userId, userRecord.remainingCount - 1)
  return true
}