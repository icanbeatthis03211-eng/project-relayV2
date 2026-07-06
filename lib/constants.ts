import { FeedbackSource, ProjectType, Tag } from "./types";

export const PROJECT_TYPES: ProjectType[] = [
  "역기획 프로젝트",
  "데이터 드리븐 프로젝트",
  "MVP 프로젝트",
  "최종 프로젝트",
];

export const FEEDBACK_SOURCES: FeedbackSource[] = [
  "튜터",
  "팀원",
  "발표 피드백",
  "자기 회고",
];

export const TAGS: Tag[] = [
  "문제 정의",
  "타깃 설정",
  "리서치 근거",
  "KPI",
  "우선순위",
  "솔루션 논리",
  "데이터 해석",
  "사용자 관점",
  "발표 흐름",
  "장표 표현",
];

export interface ChecklistMapItem {
  question: string;
  description: string;
}

export const CHECKLIST_MAP: Record<Tag, ChecklistMapItem> = {
  "문제 정의": {
    question: "문제를 한 문장으로 명확하게 좁혔는가?",
    description: "문제 범위를 좁히는 것과 관련된 피드백이 반복되고 있어요.",
  },
  "타깃 설정": {
    question: "타깃 사용자의 상황, 불편, 행동을 구체적으로 설명할 수 있는가?",
    description: "타깃 사용자를 더 구체화할 필요가 있어 보여요.",
  },
  KPI: {
    question: "설정한 KPI가 해결안과 직접적으로 연결되어 있는가?",
    description: "KPI와 솔루션의 연결 고리를 다시 점검하면 좋아요.",
  },
  "리서치 근거": {
    question: "주요 주장마다 최소 1개 이상의 근거 자료가 있는가?",
    description: "주장을 뒷받침할 근거 자료가 부족하다는 지적이 반복되고 있어요.",
  },
  우선순위: {
    question: "제한된 리소스 안에서 무엇을 먼저 할지 기준을 세웠는가?",
    description: "우선순위를 정하는 기준이 명확하지 않다는 피드백이 반복되고 있어요.",
  },
  "솔루션 논리": {
    question: "문제와 솔루션 사이의 논리적 연결이 자연스러운가?",
    description: "문제와 해결안 사이의 논리적 비약이 지적되고 있어요.",
  },
  "데이터 해석": {
    question: "데이터를 다르게 해석할 여지는 없는지 점검했는가?",
    description: "데이터 해석의 근거나 관점이 반복적으로 지적되고 있어요.",
  },
  "사용자 관점": {
    question: "사용자 입장에서 다시 한번 서비스를 사용해봤는가?",
    description: "사용자 관점이 부족하다는 피드백이 반복되고 있어요.",
  },
  "발표 흐름": {
    question: "발표 흐름이 Problem → Insight → Solution 순서로 이어지는가?",
    description: "발표 흐름의 논리적 순서에 대한 피드백이 반복되고 있어요.",
  },
  "장표 표현": {
    question: "핵심 메시지가 장표에서 한눈에 보이는가?",
    description: "장표에서 메시지 전달력에 대한 지적이 반복되고 있어요.",
  },
};

export const REPEAT_THRESHOLD = 2;
