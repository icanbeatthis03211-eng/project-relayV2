export type ProjectType =
  | "역기획 프로젝트"
  | "데이터 드리븐 프로젝트"
  | "MVP 프로젝트"
  | "최종 프로젝트"
  | "서비스 기획 입문"
  | "서비스 기획 숙련"
  | "서비스 기획 심화";

export type FeedbackSource = "튜터" | "팀원" | "발표 피드백" | "자기 회고";

export type Tag =
  | "문제 정의"
  | "타깃 설정"
  | "리서치 근거"
  | "KPI"
  | "우선순위"
  | "솔루션 논리"
  | "데이터 해석"
  | "사용자 관점"
  | "발표 흐름"
  | "장표 표현"
  | "기타";

export interface Feedback {
  id: string;
  user_id: string;
  project_type: string;
  feedback_source: string;
  original_feedback: string;
  summary: string | null;
  tag: string;
  action_item: string | null;
  is_shareable: boolean;
  created_at: string;
}

export interface SharedCard {
  id: string;
  feedback_id: string | null;
  user_id: string | null;
  project_type: string;
  generalized_feedback: string;
  tag: string;
  action_item: string;
  created_at: string;
}

export interface ChecklistStatus {
  id: string;
  user_id: string;
  tag: string;
  is_checked: boolean;
  updated_at: string;
}

export interface TagCount {
  tag: string;
  count: number;
}
