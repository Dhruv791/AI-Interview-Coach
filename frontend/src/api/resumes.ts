import { apiClient } from './client'

export interface ResumeAnalysis {
  id: string
  ats_score: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  analyzed_at: string
}

export interface Resume {
  id: string
  file_name: string
  uploaded_at: string
  analysis: ResumeAnalysis | null
}

export async function uploadResume(file: File): Promise<Resume> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post<Resume>('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function listResumes(): Promise<Resume[]> {
  const { data } = await apiClient.get<Resume[]>('/resumes/')
  return data
}

export async function getResume(id: string): Promise<Resume> {
  const { data } = await apiClient.get<Resume>(`/resumes/${id}`)
  return data
}

export async function deleteResume(id: string): Promise<void> {
  await apiClient.delete(`/resumes/${id}`)
}
