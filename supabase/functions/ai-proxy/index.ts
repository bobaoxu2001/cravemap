import { createHandler } from './handler.ts';

Deno.serve(createHandler({
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY'),
  GEMINI_API_KEY: Deno.env.get('GEMINI_API_KEY'),
  GEMINI_MODEL: Deno.env.get('GEMINI_MODEL'),
  OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY'),
}));
