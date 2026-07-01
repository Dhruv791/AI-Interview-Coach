import { apiClient } from './client'

export interface TrendPoint {
  date: string
  score: number
  category: string
}

export interface CategoryStat {
  category: string
  avg_score: number
  count: number
  best_score: number
}

export interface KPISummary {
  total_interviews: number
  completed_interviews: number
  completion_rate: number
  avg_score: number | null
  best_score: number | null
  worst_score: number | null
  best_category: string | null
  weakest_category: string | null
  improvement_pct: number | null
  total_resumes: number
  avg_ats_score: number | null
}

export interface InsightItem {
  text: string
  frequency: number
}

export interface AnalyticsSummary {
  kpis: KPISummary
  trend: TrendPoint[]
  by_category: CategoryStat[]
  top_strengths: InsightItem[]
  top_weaknesses: InsightItem[]
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const { data } = await apiClient.get<AnalyticsSummary>('/analytics/')
  return data
}
