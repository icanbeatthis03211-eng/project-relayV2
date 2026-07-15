import { supabase } from "./supabase/client";
import { ChecklistStatus, Feedback, SharedCard, TagCount } from "./types";

function tagsOf(item: { tag: string; tags?: string[] | null }): string[] {
  return item.tags && item.tags.length > 0 ? item.tags : [item.tag];
}

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
  tags: string[];
  is_shareable: boolean;
  attachment_path?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
}): Promise<QueryResult<Feedback>> {
  const { tags, ...rest } = input;
  const { data, error } = await supabase
    .from("feedbacks")
    .insert([{ ...rest, tag: tags[0] ?? "기타", tags }])
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
    .select("tag, tags")
    .eq("user_id", userId);

  if (error) return { data: null, error: toErrorMessage(error) };

  const unique = new Set<string>();
  for (const row of data as { tag: string; tags: string[] | null }[]) {
    tagsOf(row).forEach((t) => unique.add(t));
  }
  return { data: Array.from(unique), error: null };
}

/**
 * 사용자가 지금까지 저장한 피드백에서 사용된 모든 프로젝트 유형(중복 제거)을
 * 가져옵니다. 미리 정의된 목록에 없는, 사용자가 직접 입력한 프로젝트 이름을
 * 다음 저장 화면에서도 다시 골라 쓸 수 있게 하기 위해 사용해요.
 */
export async function getDistinctProjectTypesByUser(
  userId: string
): Promise<QueryResult<string[]>> {
  const { data, error } = await supabase
    .from("feedbacks")
    .select("project_type")
    .eq("user_id", userId);

  if (error) return { data: null, error: toErrorMessage(error) };

  const unique = new Set<string>();
  for (const row of data as { project_type: string }[]) {
    if (row.project_type) unique.add(row.project_type);
  }
  return { data: Array.from(unique), error: null };
}

export async function updateFeedback(
  id: string,
  patch: Partial<{
    project_type: string;
    feedback_source: string;
    original_feedback: string;
    tags: string[];
    is_shareable: boolean;
  }>
): Promise<QueryResult<Feedback>> {
  const { tags, ...rest } = patch;
  const dbPatch: Record<string, unknown> = { ...rest };
  if (tags) {
    dbPatch.tags = tags;
    dbPatch.tag = tags[0] ?? "기타";
  }

  const { data, error } = await supabase
    .from("feedbacks")
    .update(dbPatch)
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: data as Feedback, error: null };
}

/**
 * 첨부된 과제 파일이 있으면 스토리지에서도 함께 정리한 뒤 피드백 행을 삭제합니다.
 */
export async function deleteFeedback(
  id: string,
  attachmentPath?: string | null
): Promise<QueryResult<null>> {
  if (attachmentPath) {
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([attachmentPath]);
  }
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
    for (const t of tagsOf(fb)) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
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
  user_id: string;
  project_type: string;
  generalized_feedback: string;
  tags: string[];
  action_item: string;
}): Promise<QueryResult<SharedCard>> {
  const { tags, ...rest } = input;
  const { data, error } = await supabase
    .from("shared_cards")
    .insert([{ ...rest, tag: tags[0] ?? "기타", tags }])
    .select()
    .single();

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: data as SharedCard, error: null };
}

/**
 * tag 필터는 shared_cards.tags 배열에 포함되는지로 판단하기 때문에
 * (레거시 카드는 단일 tag 컬럼으로 대체) 서버에는 projectType만 넘기고,
 * tag 필터는 클라이언트에서 걸러냅니다.
 */
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

  const { data, error } = await query;

  if (error) return { data: null, error: toErrorMessage(error) };
  let cards = (data as SharedCard[]) ?? [];
  if (filters?.tag) {
    cards = cards.filter((c) => tagsOf(c).includes(filters.tag as string));
  }
  return { data: cards, error: null };
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
    for (const t of tagsOf(card)) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------- 과제 파일 첨부 (피드백에 함께 저장) ----------

const ATTACHMENTS_BUCKET = "assignments";

export async function uploadFeedbackAttachment(
  userId: string,
  file: File
): Promise<QueryResult<{ path: string }>> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  const path = `${userId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
  const { error } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) return { data: null, error: toErrorMessage(error) };
  return { data: { path }, error: null };
}

export function getAttachmentUrl(path: string): string {
  const { data } = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
