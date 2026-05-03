"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Image from "next/image";
import { LogOut, Pencil, Plus, Trash2, Upload } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import {
  getPublicGalleryUrl,
  hasSupabaseConfig,
  supabase
} from "@/lib/supabase";
import type { Faction, GalleryImage, NewsPost } from "@/lib/supabase";
import { formatDate } from "@/lib/date";

type NewsForm = {
  id?: string;
  title: string;
  image_url: string;
  short_text: string;
};

type FactionForm = {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  status: string;
};

const emptyNews: NewsForm = { title: "", image_url: "", short_text: "" };
const emptyFaction: FactionForm = { title: "", description: "", image_url: "", status: "Open" };

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [news, setNews] = useState<NewsPost[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [newsForm, setNewsForm] = useState<NewsForm>(emptyNews);
  const [factionForm, setFactionForm] = useState<FactionForm>(emptyFaction);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadAdminData();
  }, [session]);

  async function loadAdminData() {
    if (!supabase) return;

    const [newsResult, galleryResult, factionResult] = await Promise.all([
      supabase.from("news").select("*").order("created_at", { ascending: false }),
      supabase.from("gallery_images").select("*").order("created_at", { ascending: false }),
      supabase.from("factions").select("*").order("created_at", { ascending: false })
    ]);

    setNews(newsResult.data || []);
    setGallery(galleryResult.data || []);
    setFactions(factionResult.data || []);
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "Logged in.");
  }

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async function saveNews(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;

    const payload = {
      title: newsForm.title,
      image_url: newsForm.image_url || null,
      short_text: newsForm.short_text
    };

    const result = newsForm.id
      ? await supabase.from("news").update(payload).eq("id", newsForm.id)
      : await supabase.from("news").insert(payload);

    setMessage(result.error ? result.error.message : "News saved.");
    setNewsForm(emptyNews);
    await loadAdminData();
  }

  async function deleteNews(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("news").delete().eq("id", id);
    setMessage(error ? error.message : "News deleted.");
    await loadAdminData();
  }

  async function saveFaction(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;

    const payload = {
      title: factionForm.title,
      description: factionForm.description,
      image_url: factionForm.image_url || null,
      status: factionForm.status
    };

    const result = factionForm.id
      ? await supabase.from("factions").update(payload).eq("id", factionForm.id)
      : await supabase.from("factions").insert(payload);

    setMessage(result.error ? result.error.message : "Faction saved.");
    setFactionForm(emptyFaction);
    await loadAdminData();
  }

  async function deleteFaction(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("factions").delete().eq("id", id);
    setMessage(error ? error.message : "Faction deleted.");
    await loadAdminData();
  }

  async function uploadGalleryImage(file: File | undefined) {
    if (!supabase || !file) return;
    setUploading(true);
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${extension}`;

    const upload = await supabase.storage.from("gallery").upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

    if (upload.error) {
      setMessage(upload.error.message);
      setUploading(false);
      return;
    }

    const insert = await supabase.from("gallery_images").insert({
      storage_path: path,
      alt: file.name
    });

    setMessage(insert.error ? insert.error.message : "Image uploaded.");
    setUploading(false);
    await loadAdminData();
  }

  async function deleteGalleryImage(image: GalleryImage) {
    if (!supabase) return;
    await supabase.storage.from("gallery").remove([image.storage_path]);
    const { error } = await supabase.from("gallery_images").delete().eq("id", image.id);
    setMessage(error ? error.message : "Image deleted.");
    await loadAdminData();
  }

  if (!hasSupabaseConfig) {
    return (
      <AdminShell>
        <div className="glass mx-auto max-w-2xl p-8">
          <h1 className="font-display text-4xl font-black uppercase">Admin Panel</h1>
          <p className="mt-4 leading-7 text-white/65">
            Add Supabase environment variables from <span className="font-bold text-white">.env.example</span> before using admin login and database features.
          </p>
        </div>
      </AdminShell>
    );
  }

  if (!session) {
    return (
      <AdminShell>
        <form onSubmit={login} className="glass mx-auto max-w-md p-8">
          <p className="text-xs font-black uppercase text-white/45">Protected</p>
          <h1 className="mt-3 font-display text-4xl font-black uppercase">Admin Login</h1>
          <div className="mt-8 space-y-4">
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Password" value={password} onChange={setPassword} type="password" />
          </div>
          <button className="mt-6 w-full bg-white px-5 py-4 text-sm font-black uppercase text-black transition hover:bg-white/85">
            Login
          </button>
          {message ? <p className="mt-4 text-sm text-white/60">{message}</p> : null}
        </form>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="section-shell py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase text-white/45">Protected</p>
            <h1 className="mt-3 font-display text-4xl font-black uppercase md:text-6xl">Admin Panel</h1>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 border border-white/20 px-5 py-3 text-sm font-black uppercase transition hover:bg-white hover:text-black"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {message ? <p className="mb-6 border border-white/10 bg-white/5 p-4 text-sm text-white/70">{message}</p> : null}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel title="News">
            <form onSubmit={saveNews} className="space-y-4">
              <Field label="Title" value={newsForm.title} onChange={(value) => setNewsForm({ ...newsForm, title: value })} />
              <Field label="Image URL" value={newsForm.image_url} onChange={(value) => setNewsForm({ ...newsForm, image_url: value })} />
              <Textarea label="Short text" value={newsForm.short_text} onChange={(value) => setNewsForm({ ...newsForm, short_text: value })} />
              <button className="inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-black uppercase text-black">
                <Plus size={17} />
                {newsForm.id ? "Update News" : "Add News"}
              </button>
            </form>
            <List>
              {news.map((post) => (
                <AdminRow
                  key={post.id}
                  title={post.title}
                  subtitle={`${formatDate(post.created_at)} - ${post.short_text}`}
                  onEdit={() => setNewsForm({ id: post.id, title: post.title, image_url: post.image_url || "", short_text: post.short_text })}
                  onDelete={() => deleteNews(post.id)}
                />
              ))}
            </List>
          </Panel>

          <Panel title="Gallery">
            <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-white/25 bg-white/5 p-8 text-center transition hover:bg-white/10">
              <Upload className="mb-3" size={26} />
              <span className="font-black uppercase">{uploading ? "Uploading..." : "Upload image"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(event) => uploadGalleryImage(event.target.files?.[0])}
              />
            </label>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {gallery.map((image) => (
                <div key={image.id} className="relative overflow-hidden border border-white/10 bg-white/5">
                  <Image
                    src={getPublicGalleryUrl(image.storage_path)}
                    alt={image.alt || "Gallery image"}
                    width={500}
                    height={375}
                    className="aspect-[4/3] w-full object-cover grayscale"
                  />
                  <button
                    onClick={() => deleteGalleryImage(image)}
                    className="absolute right-3 top-3 grid h-10 w-10 place-items-center bg-black/80 text-white transition hover:bg-white hover:text-black"
                    aria-label="Delete gallery image"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Factions">
            <form onSubmit={saveFaction} className="space-y-4">
              <Field label="Title" value={factionForm.title} onChange={(value) => setFactionForm({ ...factionForm, title: value })} />
              <Field label="Image URL" value={factionForm.image_url} onChange={(value) => setFactionForm({ ...factionForm, image_url: value })} />
              <Field label="Status" value={factionForm.status} onChange={(value) => setFactionForm({ ...factionForm, status: value })} />
              <Textarea label="Description" value={factionForm.description} onChange={(value) => setFactionForm({ ...factionForm, description: value })} />
              <button className="inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-black uppercase text-black">
                <Plus size={17} />
                {factionForm.id ? "Update Faction" : "Add Faction"}
              </button>
            </form>
            <List>
              {factions.map((faction) => (
                <AdminRow
                  key={faction.id}
                  title={faction.title}
                  subtitle={`${faction.status} - ${faction.description}`}
                  onEdit={() =>
                    setFactionForm({
                      id: faction.id,
                      title: faction.title,
                      description: faction.description,
                      image_url: faction.image_url || "",
                      status: faction.status
                    })
                  }
                  onDelete={() => deleteFaction(faction.id)}
                />
              ))}
            </List>
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden py-20">
      <div className="grid-noise pointer-events-none absolute inset-0" />
      <a href="/" className="fixed left-6 top-6 z-20 text-xs font-black uppercase text-white/65 hover:text-white">
        REMASTER EDITION
      </a>
      <div className="relative z-10">{children}</div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass p-6">
      <h2 className="mb-5 font-display text-2xl font-black uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-white/45">{label}</span>
      <input
        required={label !== "Image URL"}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-white/15 bg-black/55 px-4 py-3 text-white outline-none transition focus:border-white/60"
      />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-white/45">{label}</span>
      <textarea
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full resize-none border border-white/15 bg-black/55 px-4 py-3 text-white outline-none transition focus:border-white/60"
      />
    </label>
  );
}

function List({ children }: { children: ReactNode }) {
  return <div className="mt-6 space-y-3">{children}</div>;
}

function AdminRow({
  title,
  subtitle,
  onEdit,
  onDelete
}: {
  title: string;
  subtitle: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border border-white/10 bg-white/5 p-4">
      <div className="min-w-0">
        <h3 className="truncate font-black uppercase">{title}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/55">{subtitle}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button onClick={onEdit} className="grid h-10 w-10 place-items-center border border-white/15 hover:bg-white hover:text-black" aria-label="Edit">
          <Pencil size={16} />
        </button>
        <button onClick={onDelete} className="grid h-10 w-10 place-items-center border border-white/15 hover:bg-white hover:text-black" aria-label="Delete">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
