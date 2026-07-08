"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function AdminOpportunityPage() {
  const router = useRouter();

  const [opportunityId, setOpportunityId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cityRegion, setCityRegion] = useState("");
  const [roleRequested, setRoleRequested] = useState("");
  const [importantNotice, setImportantNotice] = useState("");
  const [celebrationTitle, setCelebrationTitle] = useState("");
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function fillForm(opportunity: Opportunity) {
    setOpportunityId(opportunity.id);
    setTitle(opportunity.title ?? "");
    setDescription(opportunity.description ?? "");
    setCityRegion(opportunity.city_region ?? "");
    setRoleRequested(opportunity.role_requested ?? "");
    setImportantNotice(opportunity.important_notice ?? "");
    setCelebrationTitle(opportunity.celebration_title ?? "");
    setCelebrationMessage(opportunity.celebration_message ?? "");
    setWhatsappPhone(opportunity.whatsapp_phone ?? "");
    setWhatsappMessage(opportunity.whatsapp_message ?? "");
    setBannerUrl(opportunity.banner_url ?? "");
    setIsActive(opportunity.is_active ?? true);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  useEffect(() => {
    async function initialLoad() {
      setLoading(true);
      setErrorMessage("");

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.push("/admin/login");
        return;
      }

      const { error: adminError } = await supabase.rpc(
        "get_professionals_admin_summary"
      );

      if (adminError) {
        setErrorMessage("Seu usuário não tem permissão administrativa.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc(
        "get_active_professional_opportunity",
        {}
      );

      if (error) {
        setErrorMessage("Não foi possível carregar a oportunidade atual.");
        setLoading(false);
        return;
      }

      const currentOpportunity = ((data as Opportunity[]) ?? [])[0] ?? null;

      if (currentOpportunity) {
        fillForm(currentOpportunity);
      } else {
        setTitle("Oportunidade para profissionais de piso de concreto");
        setDescription(
          "Estamos organizando uma chamada para profissionais cadastrados no banco de mão de obra de piso de concreto. Informe sua disponibilidade pelo WhatsApp para que a equipe avalie o encaixe conforme região, função e demanda."
        );
        setCityRegion("Campinas e região");
        setRoleRequested("Profissionais de piso de concreto");
        setImportantNotice(
          "A chamada depende da disponibilidade da obra, perfil técnico, localização e confirmação da equipe administrativa."
        );
        setCelebrationTitle("");
        setCelebrationMessage("");
        setWhatsappPhone("");
        setWhatsappMessage(
          "Olá. Vi a oportunidade no Banco de Profissionais e gostaria de falar com a equipe."
        );
        setBannerUrl("");
        setIsActive(true);
      }

      setLoading(false);
    }

    initialLoad();
  }, [router]);

  async function saveOpportunity() {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim()) {
      setErrorMessage("Informe o título da oportunidade.");
      setSaving(false);
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Informe a descrição da oportunidade.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase.rpc(
      "save_professional_opportunity_admin",
      {
        p_id: opportunityId,
        p_title: title,
        p_description: description,
        p_city_region: cityRegion,
        p_role_requested: roleRequested,
        p_important_notice: importantNotice,
        p_celebration_title: celebrationTitle,
        p_celebration_message: celebrationMessage,
        p_whatsapp_phone: whatsappPhone,
        p_whatsapp_message: whatsappMessage,
        p_banner_url: bannerUrl,
        p_is_active: isActive,
      }
    );

    if (error) {
      setErrorMessage(error.message || "Não foi possível salvar.");
      setSaving(false);
      return;
    }

    setOpportunityId(data as string);
    setSuccessMessage("Oportunidade salva com sucesso.");
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/admin/profissionais"
              className="text-sm font-medium text-orange-400 hover:text-orange-300"
            >
              ← Voltar para profissionais
            </Link>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-orange-400">
              Página pública
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Oportunidade atual
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
              Edite a chamada que será exibida em /oportunidade. Use essa página
              como destino das notificações enviadas pelo OneSignal.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/oportunidade"
              target="_blank"
              className="rounded-xl bg-orange-500 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Ver página pública
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700"
            >
              Sair
            </button>
          </div>
        </header>

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-700 bg-red-950/70 p-5 text-sm leading-6 text-red-100">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-6 rounded-2xl border border-emerald-700 bg-emerald-950/70 p-5 text-sm leading-6 text-emerald-100">
            {successMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
            Carregando oportunidade...
          </div>
        ) : (
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
            <div className="grid gap-5">
              <label className="block">
                <span className="text-sm font-medium text-zinc-200">
                  Título da oportunidade *
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  placeholder="Ex: Oportunidade para aplicador de piso"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-200">
                  Descrição *
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={6}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-orange-500"
                  placeholder="Descreva a chamada, perfil desejado e orientação geral."
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Cidade/região
                  </span>
                  <input
                    value={cityRegion}
                    onChange={(event) => setCityRegion(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Ex: Campinas e região"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Função procurada
                  </span>
                  <input
                    value={roleRequested}
                    onChange={(event) => setRoleRequested(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Ex: Acabador de piso"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-zinc-200">
                  Aviso importante
                </span>
                <textarea
                  value={importantNotice}
                  onChange={(event) => setImportantNotice(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-orange-500"
                  placeholder="Ex: A chamada depende de análise, disponibilidade e confirmação da equipe."
                />
              </label>

              <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/20 p-5">
                <h2 className="text-lg font-bold text-white">
                  Felicitações e datas comemorativas
                </h2>

                <p className="mt-2 text-sm leading-6 text-emerald-100/80">
                  Use este espaço para Dia dos Pais, Natal, Ano Novo, Dia do
                  Trabalhador ou mensagens especiais para os profissionais.
                  Finalmente uma área útil para datas comemorativas, esse teatro
                  anual que move calendários e gráficas.
                </p>

                <div className="mt-5 grid gap-5">
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-200">
                      Título da felicitação
                    </span>
                    <input
                      value={celebrationTitle}
                      onChange={(event) =>
                        setCelebrationTitle(event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                      placeholder="Ex: Feliz Dia do Trabalhador"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-zinc-200">
                      Mensagem comemorativa
                    </span>
                    <textarea
                      value={celebrationMessage}
                      onChange={(event) =>
                        setCelebrationMessage(event.target.value)
                      }
                      rows={4}
                      className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-orange-500"
                      placeholder="Mensagem especial para aparecer na página pública."
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    WhatsApp da equipe
                  </span>
                  <input
                    value={whatsappPhone}
                    onChange={(event) => setWhatsappPhone(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Ex: 5519999999999"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Link do banner/imagem
                  </span>
                  <input
                    value={bannerUrl}
                    onChange={(event) => setBannerUrl(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="https://.../banner.png"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-zinc-200">
                  Mensagem pronta do WhatsApp
                </span>
                <textarea
                  value={whatsappMessage}
                  onChange={(event) => setWhatsappMessage(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-orange-500"
                  placeholder="Mensagem que será aberta no WhatsApp."
                />
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-orange-500"
                />

                <span>
                  <span className="block text-sm font-semibold text-zinc-100">
                    Manter oportunidade ativa
                  </span>
                  <span className="mt-1 block text-sm text-zinc-400">
                    A página pública /oportunidade mostra somente a oportunidade
                    ativa mais recente.
                  </span>
                </span>
              </label>

              <button
                type="button"
                onClick={saveOpportunity}
                disabled={saving}
                className="rounded-xl bg-orange-500 px-5 py-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar oportunidade"}
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}