import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for browser-side usage
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
)

// Create a server-side client (for API routes)
export const createServerSupabaseClient = () => {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
