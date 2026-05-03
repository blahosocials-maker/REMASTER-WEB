import { createClient } from "@supabase/supabase-js";

export type NewsPost = {
  id: string;
  title: string;
  image_url: string | null;
  short_text: string;
  created_at: string;
};

export type GalleryImage = {
  id: string;
  storage_path: string;
  alt: string | null;
  created_at: string;
};

export type Faction = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  status: string;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export function getPublicGalleryUrl(path: string) {
  if (!supabase) return "";
  return supabase.storage.from("gallery").getPublicUrl(path).data.publicUrl;
}

export const fallbackNews: NewsPost[] = [
  {
    id: "fallback-news-1",
    title: "Server portal online",
    image_url: null,
    short_text: "REMASTER EDITION portal je pripraveny na napojenie na Supabase.",
    created_at: new Date().toISOString()
  }
];

export const fallbackFactions: Faction[] = [
  {
    id: "fallback-faction-1",
    title: "LSPD",
    description: "Law enforcement faction pripraveny na konfiguraciu.",
    image_url: null,
    status: "Recruiting",
    created_at: new Date().toISOString()
  },
  {
    id: "fallback-faction-2",
    title: "EMS",
    description: "Medical roleplay faction pre zachranne zlozky.",
    image_url: null,
    status: "Open",
    created_at: new Date().toISOString()
  }
];
