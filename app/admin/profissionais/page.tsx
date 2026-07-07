"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Professional = {
  id: string;
  full_name: string;
  whatsapp: string;
  city: string;
  neighborhood: string | null;
  main_role: string;
  experience_years: number | null;
  availability: string | null;
  accepts_travel: boolean;
  has_transport: boolean;
  daily_rate: number | null;
  status: string;
  trust_status: string;
  internal_rating: number | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
  skills: string[];
  experiences_count: number;
  notes_count: number;
  contacts_count: number;
};

type RoleOption = {
  key: string;
  label: string;
  sort_order: number;
};

type SkillOption = {
  key: string;
  label: string;
  category: string;
  sort_order: number;
};

type StatusOption = {
  key: string;
  label: string;
};

type TrustStatusOption = {
  key: string;
  label: string;
};

type FormOptions = {
  roles: RoleOption[];
  skills: SkillOption[];
  statuses: StatusOption[];
  trust_statuses: TrustStatusOption[];
};

type AdminSummary = {
  total: number;
  novo_cadastro: number;
  em_analise: number;
  aprovado: number;
  preferencial: number;
  chamado_recentemente: number;
  nao_respondeu: number;
  inativo: number;
  recusado: number;
  bloqueado: number;
  com_conducao: number;
  aceita_viagem: number;
};

const emptySummary: AdminSummary = {
  total: 0,
  novo_cadastro: 0,
  em_analise: 0,
  aprovado: 0,
  preferencial: 0,
  chamado_recentemente: 0,
  nao_respondeu: 0,
  inativo: 0,
  recusado: 0,
  bloqueado: 0,
  com_conducao: 0,
  aceita_viagem: 0,
};

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "Não informado";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Nunca";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function buildWhatsappLink(phone: string, name: string) {
  const cleanPhone = onlyNumbers(phone);
  const phoneWithCountry = cleanPhone.startsWith("55")
    ? cleanPhone
    : `55${cleanPhone}`;

  const message = encodeURIComponent(
    `Olá, ${name}. Recebemos seu cadastro profissional e gostaríamos de falar sobre uma possível oportunidade.`
  );

  return `https://wa.me/${phoneWithCountry}?text=${message}`;
}

function getStatusLabel(statuses: StatusOption[], key: string) {
  return statuses.find((status) => status.key === key)?.label ?? key;
}

function getTrustStatusLabel(statuses: TrustStatusOption[], key: string) {
  return statuses.find((status) => status.key === key)?.label ?? key;
}

export default function AdminProfessionalsPage() {
  const router = useRouter();

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [summary, setSummary] = useState<AdminSummary>(emptySummary);
  const [options, setOptions] = useState<FormOptions>({
    roles: [],
    skills: [],
    statuses: [],
    trust_statuses: [],
  });

  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [mainRole, setMainRole] = useState("");
  const [status, setStatus] = useState("");
  const [trustStatus, setTrustStatus] = useState("");
  const [skill, setSkill] = useState("");
  const [acceptsTravel, setAcceptsTravel] = useState("");
  const [hasTransport, setHasTransport] = useState("");

  const cities = useMemo(() => {
    const uniqueCities = new Set(
      professionals.map((professional) => professional.city).filter(Boolean)
    );

    return Array.from(uniqueCities).sort((a, b) => a.localeCompare(b));
  }, [professionals]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  async function loadOptions() {
    const { data, error } = await supabase.rpc("get_professional_form_options");

    if (error) {
      throw new Error("Não foi possível carregar as opções do sistema.");
    }

    const receivedOptions = data as FormOptions;

    setOptions({
      roles: receivedOptions.roles ?? [],
      skills: receivedOptions.skills ?? [],
      statuses: receivedOptions.statuses ?? [],
      trust_statuses: receivedOptions.trust_statuses ?? [],
    });
  }

  async function loadSummary() {
    const { data, error } = await supabase.rpc("get_professionals_admin_summary");

    if (error) {
      throw new Error("Não foi possível carregar o resumo administrativo.");
    }

    setSummary((data as AdminSummary) ?? emptySummary);
  }

  async function loadProfessionals(useFilters = true) {
    setFiltering(true);
    setErrorMessage("");

    const { data, error } = await supabase.rpc("list_professionals_admin", {
      p_search: useFilters ? search : "",
      p_city: useFilters ? city : "",
      p_neighborhood: useFilters ? neighborhood : "",
      p_main_role: useFilters ? mainRole : "",
      p_status: useFilters ? status : "",
      p_trust_status: useFilters ? trustStatus : "",
      p_skill: useFilters ? skill : "",
      p_accepts_travel:
        useFilters && acceptsTravel !== "" ? acceptsTravel === "sim" : null,
      p_has_transport:
        useFilters && hasTransport !== "" ? hasTransport === "sim" : null,
    });

    if (error) {
      setErrorMessage(
        error.message === "Acesso negado."
          ? "Seu usuário não tem permissão administrativa."
          : "Não foi possível carregar os profissionais."
      );
      setProfessionals([]);
      setFiltering(false);
      return;
    }

    setProfessionals((data as Professional[]) ?? []);
    setFiltering(false);
  }

  function clearFilters() {
    setSearch("");
    setCity("");
    setNeighborhood("");
    setMainRole("");
    setStatus("");
    setTrustStatus("");
    setSkill("");
    setAcceptsTravel("");
    setHasTransport("");
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

      try {
        await loadOptions();
        await loadSummary();
        await loadProfessionals(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o painel.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyFilters() {
    await loadProfessionals(true);
  }

  async function handleClearAndReload() {
    clearFilters();

    setFiltering(true);

    const { data, error } = await supabase.rpc("list_professionals_admin", {
      p_search: "",
      p_city: "",
      p_neighborhood: "",
      p_main_role: "",
      p_status: "",
      p_trust_status: "",
      p_skill: "",
      p_accepts_travel: null,
      p_has_transport: null,
    });

    if (error) {
      setErrorMessage("Não foi possível limpar os filtros.");
      setFiltering(false);
      return;
    }

    setProfessionals((data as Professional[]) ?? []);
    setFiltering(false);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-400">
              Painel administrativo
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Profissionais cadastrados
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
              Consulte, filtre e chame profissionais cadastrados para obras de
              piso de concreto, carpintaria, armação e apoio operacional.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cadastro-profissional"
              className="rounded-xl border border-zinc-700 px-4 py-3 text-center text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
            >
              Ver cadastro público
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

        {loading ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
            Carregando painel...
          </div>
        ) : (
          <>
            {errorMessage ? (
              <div className="mb-6 rounded-2xl border border-red-700 bg-red-950/70 p-5 text-sm leading-6 text-red-100">
                {errorMessage}
              </div>
            ) : null}

            <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Total cadastrado</p>
                <strong className="mt-2 block text-3xl text-white">
                  {summary.total}
                </strong>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Novos cadastros</p>
                <strong className="mt-2 block text-3xl text-white">
                  {summary.novo_cadastro}
                </strong>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Aprovados</p>
                <strong className="mt-2 block text-3xl text-white">
                  {summary.aprovado + summary.preferencial}
                </strong>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Aceitam viagem</p>
                <strong className="mt-2 block text-3xl text-white">
                  {summary.aceita_viagem}
                </strong>
              </div>
            </section>

            <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Filtros</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Use os filtros para encontrar o profissional certo.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleClearAndReload}
                    className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
                  >
                    Limpar filtros
                  </button>

                  <button
                    type="button"
                    onClick={applyFilters}
                    disabled={filtering}
                    className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {filtering ? "Filtrando..." : "Aplicar filtros"}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Buscar
                  </span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Nome, WhatsApp, cidade..."
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Cidade
                  </span>
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Ex: Campinas"
                    list="cities-list"
                  />
                  <datalist id="cities-list">
                    {cities.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Bairro
                  </span>
                  <input
                    value={neighborhood}
                    onChange={(event) => setNeighborhood(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Ex: Centro"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Função
                  </span>
                  <select
                    value={mainRole}
                    onChange={(event) => setMainRole(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                    <option value="">Todas</option>
                    {options.roles.map((role) => (
                      <option key={role.key} value={role.label}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Qualificação
                  </span>
                  <select
                    value={skill}
                    onChange={(event) => setSkill(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                    <option value="">Todas</option>
                    {options.skills.map((item) => (
                      <option key={item.key} value={item.label}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                    <option value="">Todos</option>
                    {options.statuses.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Confiança
                  </span>
                  <select
                    value={trustStatus}
                    onChange={(event) => setTrustStatus(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                    <option value="">Todas</option>
                    {options.trust_statuses.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Aceita viagem
                  </span>
                  <select
                    value={acceptsTravel}
                    onChange={(event) => setAcceptsTravel(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                    <option value="">Todos</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Tem condução
                  </span>
                  <select
                    value={hasTransport}
                    onChange={(event) => setHasTransport(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                    <option value="">Todos</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Lista de profissionais
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {professionals.length} profissional(is) encontrado(s).
                  </p>
                </div>
              </div>

              {professionals.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-sm leading-6 text-zinc-400">
                  Nenhum profissional encontrado com os filtros atuais.
                </div>
              ) : (
                <div className="space-y-4">
                  {professionals.map((professional) => (
                    <article
                      key={professional.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-bold text-white">
                              {professional.full_name}
                            </h3>

                            <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300">
                              {getStatusLabel(options.statuses, professional.status)}
                            </span>

                            <span className="rounded-full border border-orange-700/70 bg-orange-950/40 px-3 py-1 text-xs font-semibold text-orange-200">
                              {getTrustStatusLabel(
                                options.trust_statuses,
                                professional.trust_status
                              )}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-zinc-400">
                            {professional.main_role} • {professional.city}
                            {professional.neighborhood
                              ? ` / ${professional.neighborhood}`
                              : ""}
                          </p>

                          <div className="mt-4 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <span className="block text-zinc-500">
                                WhatsApp
                              </span>
                              <strong className="font-semibold text-zinc-100">
                                {professional.whatsapp}
                              </strong>
                            </div>

                            <div>
                              <span className="block text-zinc-500">
                                Experiência
                              </span>
                              <strong className="font-semibold text-zinc-100">
                                {professional.experience_years
                                  ? `${professional.experience_years} ano(s)`
                                  : "Não informado"}
                              </strong>
                            </div>

                            <div>
                              <span className="block text-zinc-500">
                                Diária
                              </span>
                              <strong className="font-semibold text-zinc-100">
                                {formatCurrency(professional.daily_rate)}
                              </strong>
                            </div>

                            <div>
                              <span className="block text-zinc-500">
                                Último contato
                              </span>
                              <strong className="font-semibold text-zinc-100">
                                {formatDate(professional.last_contact_at)}
                              </strong>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {professional.accepts_travel ? (
                              <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-200">
                                Aceita viagem
                              </span>
                            ) : null}

                            {professional.has_transport ? (
                              <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-200">
                                Tem condução
                              </span>
                            ) : null}

                            {professional.internal_rating ? (
                              <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-200">
                                Nota interna: {professional.internal_rating}/5
                              </span>
                            ) : null}

                            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-200">
                              {professional.contacts_count} contato(s)
                            </span>

                            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-200">
                              {professional.notes_count} nota(s)
                            </span>
                          </div>

                          {professional.skills?.length ? (
                            <div className="mt-4">
                              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                                Qualificações
                              </p>

                              <div className="flex flex-wrap gap-2">
                                {professional.skills.slice(0, 8).map((item) => (
                                  <span
                                    key={item}
                                    className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-300"
                                  >
                                    {item}
                                  </span>
                                ))}

                                {professional.skills.length > 8 ? (
                                  <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
                                    +{professional.skills.length - 8}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex min-w-full flex-col gap-3 lg:min-w-48">
                          <a
                            href={buildWhatsappLink(
                              professional.whatsapp,
                              professional.full_name
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-emerald-700"
                          >
                            Chamar no WhatsApp
                          </a>

                          <Link
                            href={`/admin/profissionais/${professional.id}`}
                            className="rounded-xl border border-zinc-700 px-4 py-3 text-center text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
                          >
                            Ver ficha
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}