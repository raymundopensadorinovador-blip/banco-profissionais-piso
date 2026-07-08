"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type PushTarget = {
  id: string;
  full_name: string;
  whatsapp: string;
  city: string;
  neighborhood: string | null;
  main_role: string;
  status: string;
  trust_status: string;
  push_enabled: boolean;
  onesignal_external_id: string | null;
  onesignal_subscription_id: string | null;
  push_permission_status: string | null;
  push_opted_in_at: string | null;
  referred_by_name: string | null;
  referred_by_phone: string | null;
  skills: string[];
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

function formatDate(value: string | null) {
  if (!value) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(statuses: StatusOption[], key: string) {
  return statuses.find((status) => status.key === key)?.label ?? key;
}

function getTrustStatusLabel(statuses: TrustStatusOption[], key: string) {
  return statuses.find((status) => status.key === key)?.label ?? key;
}

export default function AdminNotificationsPage() {
  const router = useRouter();

  const [targets, setTargets] = useState<PushTarget[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [options, setOptions] = useState<FormOptions>({
    roles: [],
    skills: [],
    statuses: [],
    trust_statuses: [],
  });

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [mainRole, setMainRole] = useState("");
  const [status, setStatus] = useState("");
  const [trustStatus, setTrustStatus] = useState("");
  const [skill, setSkill] = useState("");

  const [title, setTitle] = useState("Oportunidade para profissionais de piso");
  const [message, setMessage] = useState(
    "Temos uma nova chamada para profissionais cadastrados. Toque na notificação para falar com a equipe."
  );
  const [targetUrl, setTargetUrl] = useState(
    "https://banco-profissionais-piso.vercel.app"
  );
  const [imageUrl, setImageUrl] = useState("");

  const selectedTargets = useMemo(() => {
    return targets.filter((target) => selectedIds.includes(target.id));
  }, [selectedIds, targets]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  async function loadOptions() {
    const { data, error } = await supabase.rpc("get_professional_form_options");

    if (error) {
      throw new Error("Não foi possível carregar opções.");
    }

    const receivedOptions = data as FormOptions;

    setOptions({
      roles: receivedOptions.roles ?? [],
      skills: receivedOptions.skills ?? [],
      statuses: receivedOptions.statuses ?? [],
      trust_statuses: receivedOptions.trust_statuses ?? [],
    });
  }

  async function loadTargets() {
    setErrorMessage("");

    const { data, error } = await supabase.rpc(
      "list_professionals_push_targets_admin",
      {
        p_search: search,
        p_city: city,
        p_main_role: mainRole,
        p_status: status,
        p_trust_status: trustStatus,
        p_skill: skill,
      }
    );

    if (error) {
      throw new Error(
        error.message === "Acesso negado."
          ? "Seu usuário não tem permissão administrativa."
          : "Não foi possível carregar os profissionais com push ativo."
      );
    }

    const receivedTargets = (data as PushTarget[]) ?? [];
    setTargets(receivedTargets);
    setSelectedIds(receivedTargets.map((target) => target.id));
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
        await loadTargets();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a página.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyFilters() {
    setLoading(true);

    try {
      await loadTargets();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível aplicar filtros.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setCity("");
    setMainRole("");
    setStatus("");
    setTrustStatus("");
    setSkill("");
  }

  async function clearAndReload() {
    clearFilters();

    setLoading(true);

    const { data, error } = await supabase.rpc(
      "list_professionals_push_targets_admin",
      {
        p_search: "",
        p_city: "",
        p_main_role: "",
        p_status: "",
        p_trust_status: "",
        p_skill: "",
      }
    );

    if (error) {
      setErrorMessage("Não foi possível limpar os filtros.");
      setLoading(false);
      return;
    }

    const receivedTargets = (data as PushTarget[]) ?? [];
    setTargets(receivedTargets);
    setSelectedIds(receivedTargets.map((target) => target.id));
    setLoading(false);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  }

  function selectAll() {
    setSelectedIds(targets.map((target) => target.id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function sendNotification() {
    setSending(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim()) {
      setErrorMessage("Informe o título da notificação.");
      setSending(false);
      return;
    }

    if (!message.trim()) {
      setErrorMessage("Informe a mensagem da notificação.");
      setSending(false);
      return;
    }

    if (selectedIds.length === 0) {
      setErrorMessage("Selecione pelo menos um profissional.");
      setSending(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setErrorMessage("Sessão expirada. Faça login novamente.");
      setSending(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/send-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title,
          message,
          targetUrl,
          imageUrl,
          targetProfessionalIds: selectedIds,
          filters: {
            search,
            city,
            mainRole,
            status,
            trustStatus,
            skill,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const details = result.details
          ? ` Detalhes: ${JSON.stringify(result.details)}`
          : "";
      
        throw new Error(
          `${result.error ?? "Não foi possível enviar notificação."}${details}`
        );
      }

      setSuccessMessage(
        `Notificação enviada para ${result.recipientsCount} profissional(is).`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a notificação.";

      setErrorMessage(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/admin/profissionais"
              className="text-sm font-medium text-orange-400 hover:text-orange-300"
            >
              ← Voltar para profissionais
            </Link>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-orange-400">
              Notificações push
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Enviar oportunidade
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
              Envie avisos para profissionais que ativaram notificações no
              cadastro. O banner pode aparecer em navegadores compatíveis.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cadastro-profissional"
              className="rounded-xl border border-zinc-700 px-4 py-3 text-center text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
            >
              Cadastro público
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

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
            <h2 className="text-xl font-bold text-white">
              Conteúdo da notificação
            </h2>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-zinc-200">
                  Título *
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  placeholder="Ex: Oportunidade para piso de concreto"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-200">
                  Mensagem *
                </span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-orange-500"
                  placeholder="Digite a mensagem da notificação"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-200">
                  Link ao tocar na notificação
                </span>
                <input
                  value={targetUrl}
                  onChange={(event) => setTargetUrl(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  placeholder="https://..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-200">
                  Link do banner/imagem
                </span>
                <input
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  placeholder="https://.../banner.png"
                />
                <span className="mt-2 block text-xs leading-5 text-zinc-500">
                  A imagem precisa estar em uma URL pública. A exibição depende
                  do navegador e do sistema.
                </span>
              </label>

              <div className="rounded-2xl border border-orange-800/60 bg-orange-950/20 p-5">
                <p className="text-sm text-orange-100/80">
                  Destinatários selecionados
                </p>
                <strong className="mt-1 block text-3xl text-white">
                  {selectedIds.length}
                </strong>

                <button
                  type="button"
                  onClick={sendNotification}
                  disabled={sending}
                  className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Enviando..." : "Enviar notificação"}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
            <h2 className="text-xl font-bold text-white">
              Profissionais com push ativo
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-zinc-200">
                  Buscar
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  placeholder="Nome, cidade, WhatsApp..."
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
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={applyFilters}
                className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Aplicar filtros
              </button>

              <button
                type="button"
                onClick={clearAndReload}
                className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
              >
                Limpar filtros
              </button>

              <button
                type="button"
                onClick={selectAll}
                className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
              >
                Selecionar todos
              </button>

              <button
                type="button"
                onClick={clearSelection}
                className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
              >
                Limpar seleção
              </button>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-sm text-zinc-400">
                  Carregando profissionais...
                </div>
              ) : targets.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-sm leading-6 text-zinc-400">
                  Nenhum profissional com notificações ativas foi encontrado.
                </div>
              ) : (
                <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
                  {targets.map((target) => {
                    const checked = selectedIds.includes(target.id);

                    return (
                      <label
                        key={target.id}
                        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 transition hover:border-zinc-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelected(target.id)}
                          className="mt-1 h-4 w-4 accent-orange-500"
                        />

                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-white">
                            {target.full_name}
                          </span>

                          <span className="mt-1 block text-sm text-zinc-400">
                            {target.main_role} • {target.city}
                            {target.neighborhood
                              ? ` / ${target.neighborhood}`
                              : ""}
                          </span>

                          <span className="mt-1 block text-xs text-zinc-500">
                            Status: {getStatusLabel(options.statuses, target.status)} •
                            Confiança:{" "}
                            {getTrustStatusLabel(
                              options.trust_statuses,
                              target.trust_status
                            )}
                          </span>

                          <span className="mt-1 block text-xs text-emerald-300">
                            Push ativo desde {formatDate(target.push_opted_in_at)}
                          </span>

                          {target.referred_by_name ? (
                            <span className="mt-1 block text-xs text-orange-300">
                              Indicado por: {target.referred_by_name}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}