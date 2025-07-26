// 计划配置
export const PLAN_CONFIG = {
  free: { maxCount: 100 },   // 免费用户每天100次
  pro: { maxCount: 500 },    // 专业用户每天500次
  max: { maxCount: 2000 }    // 最高级用户每天2000次
}

export interface UserReplyCount {
  userId: string
  planType: 'free' | 'pro' | 'max'
  remainingCount: number
  createdAt: Date
  updatedAt: Date
}