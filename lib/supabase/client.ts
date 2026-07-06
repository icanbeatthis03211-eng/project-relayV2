import { createClient } from "@supabase/supabase-js";

/**
 * Supabase 프로젝트 자격증명 (docs/supabase-info.md 기준, 하드코딩).
 * 요청에 따라 별도의 .env.local 환경변수 파일을 사용하지 않고
 * 소스코드 내부에 직접 값을 기입합니다.
 */
const SUPABASE_PROJECT_ID = "lkjxzrrkzpdtbdcmqhjo";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_4O5YSzTtDub-hSbzGUInsg_JCLzEtDd";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
