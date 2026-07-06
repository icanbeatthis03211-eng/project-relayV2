import { supabase } from "./supabase/client";
import { ChecklistStatus, Feedback, SharedCard, TagCount } from "./types";

export interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

function toErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
}

// ---------- feedbacks ----------

export async function createFeedback(input: {
  user_id: string;
  project_type: string;
  feedback_source: string;
  original_feedback: string;
  tag: string;
  is_shareable: boolean;
}): Promise<QueryResult<Feedback>> {
  const { data, error } = await supabase
    .from("feedbacks")
    .insert([input])
    .select()
    .single();

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: data as Feedback, error: null };
}

export async function getFeedbacksByUser(
  userId: string
): Promise<QueryResult<Feedback[]>> {
  const { data, error } = await supabase
    .from("feedbacks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: (data as Feedback[]) ?? [], error: null };
}

export async function getFeedbackById(
  id: string
): Promise<QueryResult<Feedback>> {
  const { data, error } = await supabase
    .from("feedbacks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: data as Feedback, error: null };
}

/**
 * Aggregates a user's feedbacks by tag, sorted by count descending.
 * A tag with count >= 2 is considered a "repeated feedback".
 */
export function computeTagCounts(feedbacks: Feedback[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const fb of feedbacks) {
    counts.set(fb.tag, (counts.get(fb.tag) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------- checklist_status ----------

export async function getChecklistStatus(
  userId: string
): Promise<QueryResult<ChecklistStatus[]>> {
  const { data, error } = await supabase
    .from("checklist_status")
    .select("*")
    .eq("user_id", userId);

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: (data as ChecklistStatus[]) ?? [], error: null };
}

export async function upsertChecklistItem(
  userId: string,
  tag: string,
  isChecked: boolean
): Promise<QueryResult<ChecklistStatus>> {
  const { data, error } = await supabase
    .from("checklist_status")
    .upsert(
      [
        {
          user_id: userId,
          tag,
          is_checked: isChecked,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "user_id,tag" }
    )
    .select()
    .single();

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: data as ChecklistStatus, error: null };
}

export async function resetChecklist(
  userId: string
): Promise<QueryResult<null>> {
  const { error } = await supabase
    .from("checklist_status")
    .update({ is_checked: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: null, error: null };
}

// ---------- shared_cards ----------

export async function createSharedCard(input: {
  feedback_id: string | null;
  project_type: string;
  generalized_feedback: string;
  tag: string;
  action_item: string;
}): Promise<QueryResult<SharedCard>> {
  const { data, error } = await supabase
    .from("shared_cards")
    .insert([input])
    .select()
    .single();

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: data as SharedCard, error: null };
}

export async function getSharedCards(filters?: {
  projectType?: string;
  tag?: string;
}): Promise<QueryResult<SharedCard[]>> {
  let query = supabase
    .from("shared_cards")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.projectType) {
    query = query.eq("project_type", filters.projectType);
  }
  if (filters?.tag) {
    query = query.eq("tag", filters.tag);
  }

  const { data, error } = await query;

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: (data as SharedCard[]) ?? [], error: null };
}

export function computeSharedTagFrequency(cards: SharedCard[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const card of cards) {
    counts.set(card.tag, (counts.get(card.tag) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------- 누적 참여자 수 (실시간) ----------

/**
 * feedbacks 테이블에 한 번이라도 기록을 남긴 서로 다른 user_id 수를
 * "누적 참여자 수"로 집계합니다. (전체 사용자 대상 전역 지표)
 */
export async function getParticipantCount(): Promise<QueryResult<number>> {
  const { data, error } = await supabase.from("feedbacks").select("user_id");

  if (error) return { data: null, error: toErrorMessage(error) };

  const uniqueUsers = new Set(
    (data as { user_id: string }[]).map((row) => row.user_id)
  );
  return { data: uniqueUsers.size, error: null };
}

/**
 * feedbacks 테이블에 새로운 행이 INSERT 될 때마다 콜백을 실행하는
 * Supabase Realtime 구독. 반환된 함수를 호출하면 구독이 해제됩니다.
 * (database/schema.sql 에서 해당 테이블이 supabase_realtime publication에
 * 추가되어 있어야 동작합니다.)
 */
export function subscribeToFeedbackInserts(onInsert: () => void): () => void {
  const channel = supabase
    .channel("public:feedbacks:participant-count")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "feedbacks" },
      () => {
        onInsert();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
