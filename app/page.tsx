"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, BadgeCheck, Shield, Users, Zap } from "lucide-react";
import {
  fallbackFactions,
  fallbackNews,
  getPublicGalleryUrl,
  hasSupabaseConfig,
  supabase
} from "@/lib/supabase";
import type { Faction, GalleryImage, NewsPost } from "@/lib/supabase";
import { formatDate } from "@/lib/date";

const navItems = ["Home", "Gallery", "Factions", "News", "Rules"];

export default function PortalPage() {
  const [news, setNews] = useState<NewsPost[]>(fallbackNews);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [factions, setFactions] = useState<Faction[]>(fallbackFactions);
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/your-server";
  const fivemUrl = process.env.NEXT_PUBLIC_FIVEM_CONNECT_URL || "fivem://connect/127.0.0.1:30120";

  useEffect(() => {
    async function loadPortalData() {
      if (!supabase) return;

      const [newsResult, galleryResult, factionResult] = await Promise.all([
        supabase.from("news").select("*").order("created_at", { ascending: false }),
        supabase.from("gallery_images").select("*").order("created_at", { ascending: false }),
        supabase.from("factions").select("*").order("created_at", { ascending: false })
      ]);

      if (newsResult.data?.length) setNews(newsResult.data);
      if (galleryResult.data) setGallery(galleryResult.data);
      if (factionResult.data?.length) setFactions(factionResult.data);
    }

    loadPortalData();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Roleplay", value: "Serious", icon: Shield },
      { label: "Community", value: "Active", icon: Users },
      { label: "Edition", value: "Modern", icon: Zap }
    ],
    []
  );

  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise pointer-events-none absolute inset-0" />
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/55 backdrop-blur-xl">
        <nav className="section-shell flex h-16 items-center justify-between">
          <a href="#home" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border border-white/25 bg-white text-sm font-black text-black shadow-glow-soft">
              <img src="/re-logo.png" alt="Remaster Logo" className="h-36 w-36 object-contain rounded-xl shadow-lg" />
            </span>
            <span className="hidden font-display text-sm uppercase sm:inline">REMASTER</span>
          </a>
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-4 py-2 text-xs font-bold uppercase text-white/70 transition hover:text-white"
              >
                {item}
              </a>
            ))}
          </div>
          <a
            href="/admin"
            className="border border-white/20 px-4 py-2 text-xs font-black uppercase transition hover:bg-white hover:text-black"
          >
            Admin
          </a>
        </nav>
      </header>

      <section id="home" className="section-shell relative flex min-h-screen flex-col justify-center pb-16 pt-28">
        <div className="max-w-5xl">
          <div className="mb-8 inline-flex items-center gap-3 border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase text-white/70 backdrop-blur">
            <BadgeCheck size={16} />
            FiveM Roleplay Server
          </div>
          <div className="mb-8 grid h-28 w-28 place-items-center border border-white/25 bg-white text-4xl font-black text-black shadow-glow md:h-36 md:w-36 md:text-5xl">
            RE
          </div>
          <h1 className="text-balance font-display text-5xl font-black uppercase leading-none text-white md:text-8xl lg:text-9xl">
            REMASTER EDITION
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
            Cisty, moderny portal pre FiveM roleplay komunitu s galeriou, frakciami, novinkami a admin panelom napojenym na Supabase.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href={discordUrl}
              className="group inline-flex items-center justify-center gap-3 bg-white px-7 py-4 text-sm font-black uppercase text-black transition hover:bg-white/85"
            >
              Discord
              <ArrowUpRight className="transition group-hover:translate-x-1 group-hover:-translate-y-1" size={18} />
            </a>
            <a
              href={fivemUrl}
              className="inline-flex items-center justify-center gap-3 border border-white/25 bg-white/5 px-7 py-4 text-sm font-black uppercase text-white transition hover:bg-white hover:text-black"
            >
              Connect to FiveM
            </a>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass p-5">
              <Icon className="mb-6 text-white" size={22} />
              <p className="text-xs font-bold uppercase text-white/45">{label}</p>
              <p className="mt-2 text-2xl font-black uppercase">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <SectionHeader id="gallery" eyebrow="Storage" title="Gallery" />
      <section className="section-shell grid gap-4 pb-28 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.length ? (
          gallery.map((image) => (
            <div key={image.id} className="glass group aspect-[4/3] overflow-hidden">
              <Image
                src={getPublicGalleryUrl(image.storage_path)}
                alt={image.alt || "REMASTER EDITION gallery image"}
                width={900}
                height={675}
                className="h-full w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
              />
            </div>
          ))
        ) : (
          <EmptyState text={hasSupabaseConfig ? "Gallery images can be uploaded from admin panel." : "Add Supabase credentials to load gallery images from Storage."} />
        )}
      </section>

      <SectionHeader id="factions" eyebrow="Teams" title="Factions" />
      <section className="section-shell grid gap-5 pb-28 md:grid-cols-2 lg:grid-cols-3">
        {factions.map((faction) => (
          <article key={faction.id} className="glass overflow-hidden">
            <div className="relative aspect-[16/10] bg-white/5">
              {faction.image_url ? (
                <Image src={faction.image_url} alt={faction.title} fill className="object-cover grayscale" />
              ) : (
                <div className="grid h-full place-items-center text-5xl font-black text-white/15">{faction.title.slice(0, 2)}</div>
              )}
              <span className="absolute right-4 top-4 border border-white/25 bg-black/70 px-3 py-1 text-xs font-black uppercase">
                {faction.status}
              </span>
            </div>
            <div className="p-6">
              <h3 className="font-display text-2xl font-black uppercase">{faction.title}</h3>
              <p className="mt-3 leading-7 text-white/62">{faction.description}</p>
            </div>
          </article>
        ))}
      </section>

      <SectionHeader id="news" eyebrow="Updates" title="News" />
      <section className="section-shell grid gap-5 pb-28 lg:grid-cols-3">
        {news.map((post) => (
          <article key={post.id} className="glass overflow-hidden">
            <div className="relative aspect-video bg-white/5">
              {post.image_url ? (
                <Image src={post.image_url} alt={post.title} fill className="object-cover grayscale" />
              ) : (
                <div className="grid h-full place-items-center text-sm font-black uppercase text-white/25">REMASTER NEWS</div>
              )}
            </div>
            <div className="p-6">
              <time className="text-xs font-bold uppercase text-white/45">{formatDate(post.created_at)}</time>
              <h3 className="mt-3 font-display text-2xl font-black uppercase">{post.title}</h3>
              <p className="mt-3 leading-7 text-white/62">{post.short_text}</p>
            </div>
          </article>
        ))}
      </section>

      <SectionHeader id="rules" eyebrow="Soon" title="Rules" />
      <section className="section-shell pb-28">
        <div className="glass p-8 text-center md:p-14">
          <p className="font-display text-2xl font-black uppercase md:text-4xl">Pravidlá budú doplnené čoskoro.</p>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <section id={id} className="section-shell scroll-mt-24 pb-8">
      <p className="text-xs font-black uppercase text-white/45">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl font-black uppercase md:text-6xl">{title}</h2>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="glass col-span-full p-10 text-center">
      <p className="text-white/60">{text}</p>
    </div>
  );
}
