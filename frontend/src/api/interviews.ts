import { apiClient } from './client'

export interface Feedback {
  id: string
  score: number
  critique: string
  suggestions: string | null
}

export interface Response {
  id: string
  user_answer: string
  feedback: Feedback | null
}

export interface Question {
  id: string
  question_text: string
  suggested_answer?: string
  order_index: number
  response: Response | null
}

export interface Interview {
  id: string
  category: string
  difficulty: string
  overall_score: number | null
  overall_feedback: string | null
  created_at: string
  completed_at: string | null
  questions: Question[]
}

export interface StartInterviewParams {
  category: string
  difficulty: string
}

export async function startInterview(params: StartInterviewParams): Promise<Interview> {
  const { data } = await apiClient.post<Interview>('/interviews/', params)
  return data
}

export async function getInterview(id: string): Promise<Interview> {
  const { data } = await apiClient.get<Interview>(`/interviews/${id}`)
  return data
}

export async function submitResponse(questionId: string, userAnswer: string): Promise<Response> {
  const { data } = await apiClient.post<Response>(`/interviews/questions/${questionId}/response`, {
    user_answer: userAnswer,
  })
  return data
}

export async function completeInterview(id: string): Promise<Interview> {
  const { data } = await apiClient.post<Interview>(`/interviews/${id}/complete`)
  return data
}

export async function listInterviews(): Promise<Interview[]> {
  const { data } = await apiClient.get<Interview[]>('/interviews/')
  return data
}
