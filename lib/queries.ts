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

/**
 * 사용자가 지금까지 저장한 피드백에서 사용된 모든 태그(중복 제거)를
 * 가져옵니다. 미리 정의된 태그 목록에 없는, 사용자가 직접 추가한
 * 커스텀 태그를 다음 피드백 저장 화면에서도 다시 보여주기 위해 사용해요.
 */
export async function getDistinctTagsByUser(
  userId: string
): Promise<QueryResult<string[]>> {
  const { data, error } = await supabase
    .from("feedbacks")
    .select("tag")
    .eq("user_id", userId);

  if (error) return { data: null, error: toErrorMessage(error) };

  const unique = Array.from(
    new Set((data as { tag: string }[]).map((row) => row.tag))
  );
  return { data: unique, error: null };
}

export async function updateFeedback(
  id: string,
  patch: Partial<{
    project_type: string;
    feedback_source: string;
    original_feedback: string;
    tag: string;
    is_shareable: boolean;
  }>
): Promise<QueryResult<Feedback>> {
  const { data, error } = await supabase
    .from("feedbacks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: data as Feedback, error: null };
}

export async function deleteFeedback(id: string): Promise<QueryResult<null>> {
  const { error } = await supabase.from("feedbacks").delete().eq("id", id);

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: null, error: null };
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

/**
 * 주어진 feedback id 목록 중 이미 공유 카드로 등록된 것을 찾아옵니다.
 * "내가 저장한 피드백" 화면에서 이미 공유한 피드백을 표시하는 데 사용해요.
 */
export async function getSharedCardsByFeedbackIds(
  feedbackIds: string[]
): Promise<QueryResult<SharedCard[]>> {
  if (feedbackIds.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("shared_cards")
    .select("*")
    .in("feedback_id", feedbackIds);

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: (data as SharedCard[]) ?? [], error: null };
}

export async function deleteSharedCard(id: string): Promise<QueryResult<null>> {
  const { error } = await supabase.from("shared_cards").delete().eq("id", id);

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: null, error: null };
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
