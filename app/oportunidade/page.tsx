"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Opportunity = {
  id: string;
  title: string;
  description: string;
  city_region: string | null;
  role_requested: string | null;
  important_notice: string | null;
  celebration_title: string | null;
  celebration_message: string | null;
  whatsapp_phone: string | null;
  whatsapp_message: string | null;
  banner_url: string | null;
  is_active: boolean;
  updated_at: string | null;
};

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function normalizePhone(phone: string | null) {
  const cleanPhone = onlyNumbers(phone ?? "");

  if (!cleanPhone) {
    return "";
  }

  if (cleanPhone.startsWith("55")) {
    return cleanPhone;
  }

  return `55${cleanPhone}`;
}

function buildWhatsappUrl(opportunity: Opportunity) {
  const phone = normalizePhone(opportunity.whatsapp_phone);

  if (!phone) {
    return "";
  }

  const message =
    opportunity.whatsapp_message?.trim() ||
    `Olá. Vi a oportunidade "${opportunity.title}" no Banco de Profissionais e gostaria de falar com a equipe.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function OpportunityPage() {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadOpportunity() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase.rpc(
        "get_active_professional_opportunity",
        {}
      );

      if (error) {
        setErrorMessage("Não foi possível carregar a oportunidade.");
        setLoading(false);
        return;
      }

      const activeOpportunity = ((data as Opportunity[]) ?? [])[0] ?? null;

      setOpportunity(activeOpportunity);
      setLoading(false);
    }

    loadOpportunity();
  }, []);

  const whatsappUrl = opportunity ? buildWhatsappUrl(opportunity) : "";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-bp.png"
              alt="Banco de Profissionais Piso de Concreto"
              width={56}
              height={56}
              priority
              className="rounded-2xl"
            />

            <div>
              <p className="text-sm font-semibold text-white">
                Banco de Profissionais
              </p>
              <p className="text-xs text-zinc-400">Piso de concreto</p>
            </div>
          </Link>

          <Link
            href="/cadastro-profissional"
            className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-900"
          >
            Fazer cadastro
          </Link>
        </header>

        {loading ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 text-zinc-300">
            Carregando oportunidade...
          </div>
        ) : errorMessage ? (
          <div className="rounded-3xl border border-red-700 bg-red-950/70 p-6 text-red-100">
            {errorMessage}
          </div>
        ) : !opportunity ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-400">
              Oportunidade
            </p>

            <h1 className="mt-4 text-3xl font-bold text-white">
              Nenhuma oportunidade ativa no momento
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
              Cadastre seu perfil para receber avisos quando novas chamadas
              forem abertas.
            </p>

            <Link
              href="/cadastro-profissional"
              className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Fazer cadastro profissional
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 shadow-2xl shadow-black/20">
              {opportunity.banner_url ? (
                <div className="border-b border-zinc-800 bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={opportunity.banner_url}
                    alt={opportunity.title}
                    className="max-h-[420px] w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="p-6 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-400">
                  Oportunidade aberta
                </p>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  {opportunity.title}
                </h1>

                <p className="mt-6 whitespace-pre-line text-base leading-8 text-zinc-300">
                  {opportunity.description}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                      Cidade/região
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {opportunity.city_region || "A combinar"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                      Função procurada
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {opportunity.role_requested || "Profissional de obra"}
                    </p>
                  </div>
                </div>

                {opportunity.important_notice ? (
                  <div className="mt-6 rounded-2xl border border-orange-800/70 bg-orange-950/30 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
                      Aviso importante
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-orange-100">
                      {opportunity.important_notice}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white">
                  Quer participar?
                </h2>

                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  Fale com a equipe pelo WhatsApp para confirmar disponibilidade
                  e receber orientação. O cadastro no banco não garante chamada
                  imediata, porque até obra depende de agenda, cliente e clima,
                  essa trindade que gosta de atrapalhar gente honesta.
                </p>

                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    Falar no WhatsApp
                  </a>
                ) : (
                  <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                    WhatsApp da equipe ainda não configurado.
                  </div>
                )}

                <Link
                  href="/cadastro-profissional"
                  className="mt-3 flex w-full items-center justify-center rounded-xl border border-zinc-700 px-5 py-4 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
                >
                  Atualizar ou fazer cadastro
                </Link>
              </div>

              {(opportunity.celebration_title ||
                opportunity.celebration_message) ? (
                <div className="rounded-3xl border border-emerald-800/70 bg-emerald-950/20 p-6 sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Felicitações e datas comemorativas
                  </p>

                  <h2 className="mt-4 text-2xl font-bold text-white">
                    {opportunity.celebration_title || "Mensagem especial"}
                  </h2>

                  {opportunity.celebration_message ? (
                    <p className="mt-4 whitespace-pre-line text-sm leading-6 text-emerald-100/90">
                      {opportunity.celebration_message}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}