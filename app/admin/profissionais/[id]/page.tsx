"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  professional_summary: string | null;
  works_experience_summary: string | null;
  consent_contact: boolean;
  status: string;
  trust_status: string;
  internal_rating: number | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
  referred_by: string | null;
  referred_by_name: string | null;
  referred_by_phone: string | null;
  consent_lgpd_reference: string | null;
  consent_given_at: string | null;
  consent_source: string | null;
};

type Skill = {
  id: string;
  professional_id: string;
  skill_name: string;
  created_at: string;
};

type Experience = {
  id: string;
  professional_id: string;
  company_or_work_name: string | null;
  role_performed: string | null;
  time_worked: string | null;
  description: string | null;
  created_at: string;
};

type ReferenceItem = {
  id: string;
  professional_id: string;
  reference_name: string | null;
  reference_phone: string | null;
  relationship: string | null;
  created_at: string;
};

type Photo = {
  id: string;
  professional_id: string;
  photo_url: string;
  description: string | null;
  created_at: string;
};

type AdminNote = {
  id: string;
  professional_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
};

type ContactHistory = {
  id: string;
  professional_id: string;
  contact_date: string;
  contact_reason: string | null;
  contact_result: string | null;
  created_by: string | null;
  created_at: string;
};

type FullProfile = {
  professional: Professional;
  skills: Skill[];
  experiences: Experience[];
  references: ReferenceItem[];
  photos: Photo[];
  admin_notes: AdminNote[];
  contact_history: ContactHistory[];
};

type StatusOption = {
  key: string;
  label: string;
};

type TrustStatusOption = {
  key: string;
  label: string;
};

type AvailabilityOption = {
  key: string;
  label: string;
  sort_order: number;
};

type FormOptions = {
  availability: AvailabilityOption[];
  statuses: StatusOption[];
  trust_statuses: TrustStatusOption[];
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

function parseNumber(value: string): number | null {
  const cleaned = value.replace(/\./g, "").replace(",", ".").trim();

  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

function getStatusLabel(statuses: StatusOption[], key: string) {
  return statuses.find((status) => status.key === key)?.label ?? key;
}

function getTrustStatusLabel(statuses: TrustStatusOption[], key: string) {
  return statuses.find((status) => status.key === key)?.label ?? key;
}

export default function ProfessionalProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const professionalId = params.id;

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [options, setOptions] = useState<FormOptions>({
    availability: [],
    statuses: [],
    trust_statuses: [],
  });

  const [loading, setLoading] = useState(true);
  const [savingAdminFields, setSavingAdminFields] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [status, setStatus] = useState("");
  const [trustStatus, setTrustStatus] = useState("");
  const [internalRating, setInternalRating] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [availability, setAvailability] = useState("");
  const [acceptsTravel, setAcceptsTravel] = useState(false);
  const [hasTransport, setHasTransport] = useState(false);

  const [contactReason, setContactReason] = useState("");
  const [contactResult, setContactResult] = useState("");
  const [contactStatus, setContactStatus] = useState("chamado_recentemente");

  const [noteText, setNoteText] = useState("");

  const professional = profile?.professional ?? null;

  const sortedSkills = useMemo(() => {
    return [...(profile?.skills ?? [])].sort((a, b) =>
      a.skill_name.localeCompare(b.skill_name)
    );
  }, [profile?.skills]);

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
      availability: receivedOptions.availability ?? [],
      statuses: receivedOptions.statuses ?? [],
      trust_statuses: receivedOptions.trust_statuses ?? [],
    });
  }

  async function loadProfile() {
    const { data, error } = await supabase.rpc("get_professional_full_profile", {
      p_professional_id: professionalId,
    });

    if (error) {
      throw new Error(
        error.message === "Acesso negado."
          ? "Seu usuário não tem permissão administrativa."
          : "Não foi possível carregar a ficha do profissional."
      );
    }

    const receivedProfile = data as FullProfile;

    setProfile(receivedProfile);

    setStatus(receivedProfile.professional.status ?? "");
    setTrustStatus(receivedProfile.professional.trust_status ?? "");
    setInternalRating(
      receivedProfile.professional.internal_rating
        ? String(receivedProfile.professional.internal_rating)
        : ""
    );
    setDailyRate(
      receivedProfile.professional.daily_rate
        ? String(receivedProfile.professional.daily_rate).replace(".", ",")
        : ""
    );
    setAvailability(receivedProfile.professional.availability ?? "");
    setAcceptsTravel(receivedProfile.professional.accepts_travel);
    setHasTransport(receivedProfile.professional.has_transport);
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
        await loadProfile();
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
  }, [professionalId]);

  async function handleSaveAdminFields(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingAdminFields(true);
    setErrorMessage("");
    setSuccessMessage("");

    const ratingNumber = internalRating ? Number(internalRating) : null;

    const { error } = await supabase.rpc("update_professional_admin_fields", {
      p_professional_id: professionalId,
      p_status: status || null,
      p_trust_status: trustStatus || null,
      p_internal_rating: ratingNumber,
      p_daily_rate: parseNumber(dailyRate),
      p_availability: availability,
      p_accepts_travel: acceptsTravel,
      p_has_transport: hasTransport,
    });

    if (error) {
      setErrorMessage(error.message || "Não foi possível salvar alterações.");
      setSavingAdminFields(false);
      return;
    }

    await loadProfile();

    setSuccessMessage("Dados administrativos atualizados.");
    setSavingAdminFields(false);
  }

  async function handleRegisterContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingContact(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase.rpc("register_professional_contact", {
      p_professional_id: professionalId,
      p_contact_reason: contactReason,
      p_contact_result: contactResult,
      p_update_status: contactStatus || "chamado_recentemente",
    });

    if (error) {
      setErrorMessage(error.message || "Não foi possível registrar contato.");
      setSavingContact(false);
      return;
    }

    setContactReason("");
    setContactResult("");
    setContactStatus("chamado_recentemente");

    await loadProfile();

    setSuccessMessage("Contato registrado no histórico.");
    setSavingContact(false);
  }

  async function handleCreateNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingNote(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase.rpc("create_professional_admin_note", {
      p_professional_id: professionalId,
      p_note: noteText,
    });

    if (error) {
      setErrorMessage(error.message || "Não foi possível criar observação.");
      setSavingNote(false);
      return;
    }

    setNoteText("");

    await loadProfile();

    setSuccessMessage("Observação interna criada.");
    setSavingNote(false);
  }

  async function handleDeleteNote(noteId: string) {
    const confirmed = window.confirm("Excluir esta observação interna?");

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase.rpc("delete_professional_admin_note", {
      p_note_id: noteId,
    });

    if (error) {
      setErrorMessage(error.message || "Não foi possível excluir observação.");
      return;
    }

    await loadProfile();

    setSuccessMessage("Observação excluída.");
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
              ← Voltar para lista
            </Link>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-orange-400">
              Ficha do profissional
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              {professional?.full_name ?? "Profissional"}
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
              Dados completos, qualificações, experiências, observações internas
              e histórico de contato.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {professional ? (
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
            ) : null}

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
            Carregando ficha...
          </div>
        ) : (
          <>
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

            {!profile || !professional ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
                Profissional não encontrado.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
                    <h2 className="text-xl font-bold text-white">
                      Dados principais
                    </h2>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <InfoCard label="Nome" value={professional.full_name} />
                      <InfoCard label="WhatsApp" value={professional.whatsapp} />
                      <InfoCard label="Cidade" value={professional.city} />
                      <InfoCard
                        label="Bairro"
                        value={professional.neighborhood ?? "Não informado"}
                      />
                      <InfoCard
                        label="Função principal"
                        value={professional.main_role}
                      />
                      <InfoCard
                        label="Tempo de experiência"
                        value={
                          professional.experience_years
                            ? `${professional.experience_years} ano(s)`
                            : "Não informado"
                        }
                      />
                      <InfoCard
                        label="Disponibilidade"
                        value={professional.availability ?? "Não informado"}
                      />
                      <InfoCard
                        label="Valor da diária"
                        value={formatCurrency(professional.daily_rate)}
                      />
                      <InfoCard
                        label="Aceita viajar"
                        value={professional.accepts_travel ? "Sim" : "Não"}
                      />
                      <InfoCard
                        label="Tem condução"
                        value={professional.has_transport ? "Sim" : "Não"}
                      />
                      <InfoCard
                        label="Último contato"
                        value={formatDate(professional.last_contact_at)}
                      />
                      <InfoCard
                        label="Cadastro criado em"
                        value={formatDate(professional.created_at)}
                      />
                      <InfoCard
  label="Indicado por"
  value={professional.referred_by_name ?? "Não informado"}
/>

<InfoCard
  label="WhatsApp de quem indicou"
  value={professional.referred_by_phone ?? "Não informado"}
/>
                    </div>
                  </section>
                  <section className="rounded-3xl border border-orange-800/60 bg-orange-950/20 p-5 sm:p-6">
  <h2 className="text-xl font-bold text-white">Indicação e consentimento</h2>

  <div className="mt-6 grid gap-4 sm:grid-cols-2">
    <InfoCard
      label="Nome de quem indicou"
      value={professional.referred_by_name ?? "Não informado"}
    />

    <InfoCard
      label="WhatsApp de quem indicou"
      value={professional.referred_by_phone ?? "Não informado"}
    />

    <InfoCard
      label="Referência LGPD"
      value={professional.consent_lgpd_reference ?? "Não informado"}
    />

    <InfoCard
      label="Consentimento em"
      value={formatDate(professional.consent_given_at)}
    />
  </div>
</section>
                  <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
                    <h2 className="text-xl font-bold text-white">
                      Resumo profissional
                    </h2>

                    <div className="mt-5 space-y-5">
                      <TextBlock
                        label="Experiência informada"
                        value={
                          professional.professional_summary ??
                          "Nenhum resumo informado."
                        }
                      />

                      <TextBlock
                        label="Obras, empresas ou serviços"
                        value={
                          professional.works_experience_summary ??
                          "Nenhuma informação adicional."
                        }
                      />
                    </div>
                  </section>

                  <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
                    <h2 className="text-xl font-bold text-white">
                      Qualificações
                    </h2>

                    {sortedSkills.length === 0 ? (
                      <p className="mt-4 text-sm text-zinc-400">
                        Nenhuma qualificação marcada.
                      </p>
                    ) : (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {sortedSkills.map((skill) => (
                          <span
                            key={skill.id}
                            className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
                          >
                            {skill.skill_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
                    <h2 className="text-xl font-bold text-white">
                      Experiências anteriores
                    </h2>

                    {profile.experiences.length === 0 ? (
                      <p className="mt-4 text-sm text-zinc-400">
                        Nenhuma experiência detalhada informada.
                      </p>
                    ) : (
                      <div className="mt-5 space-y-4">
                        {profile.experiences.map((experience) => (
                          <div
                            key={experience.id}
                            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                          >
                            <h3 className="font-bold text-white">
                              {experience.company_or_work_name ||
                                "Empresa/obra não informada"}
                            </h3>

                            <div className="mt-3 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
                              <InfoLine
                                label="Função"
                                value={
                                  experience.role_performed ?? "Não informado"
                                }
                              />
                              <InfoLine
                                label="Tempo"
                                value={experience.time_worked ?? "Não informado"}
                              />
                            </div>

                            {experience.description ? (
                              <p className="mt-3 text-sm leading-6 text-zinc-400">
                                {experience.description}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
                    <h2 className="text-xl font-bold text-white">
                      Referências profissionais
                    </h2>

                    {profile.references.length === 0 ? (
                      <p className="mt-4 text-sm text-zinc-400">
                        Nenhuma referência informada.
                      </p>
                    ) : (
                      <div className="mt-5 space-y-4">
                        {profile.references.map((reference) => (
                          <div
                            key={reference.id}
                            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                          >
                            <h3 className="font-bold text-white">
                              {reference.reference_name || "Nome não informado"}
                            </h3>

                            <div className="mt-3 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
                              <InfoLine
                                label="Telefone"
                                value={
                                  reference.reference_phone ?? "Não informado"
                                }
                              />
                              <InfoLine
                                label="Relação"
                                value={reference.relationship ?? "Não informado"}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                <aside className="space-y-6">
                  <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
                    <h2 className="text-xl font-bold text-white">
                      Controle interno
                    </h2>

                    <form
                      onSubmit={handleSaveAdminFields}
                      className="mt-6 space-y-4"
                    >
                      <label className="block">
                        <span className="text-sm font-medium text-zinc-200">
                          Status
                        </span>
                        <select
                          value={status}
                          onChange={(event) => setStatus(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        >
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
                          onChange={(event) =>
                            setTrustStatus(event.target.value)
                          }
                          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        >
                          {options.trust_statuses.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-zinc-200">
                          Nota interna
                        </span>
                        <select
                          value={internalRating}
                          onChange={(event) =>
                            setInternalRating(event.target.value)
                          }
                          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        >
                          <option value="">Sem nota</option>
                          <option value="1">1/5</option>
                          <option value="2">2/5</option>
                          <option value="3">3/5</option>
                          <option value="4">4/5</option>
                          <option value="5">5/5</option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-zinc-200">
                          Diária
                        </span>
                        <input
                          value={dailyRate}
                          onChange={(event) => setDailyRate(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                          placeholder="Ex: 180,00"
                          inputMode="decimal"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-zinc-200">
                          Disponibilidade
                        </span>
                        <select
                          value={availability}
                          onChange={(event) =>
                            setAvailability(event.target.value)
                          }
                          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        >
                          <option value="">Não informado</option>
                          {options.availability.map((item) => (
                            <option key={item.key} value={item.label}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <input
                          type="checkbox"
                          checked={acceptsTravel}
                          onChange={(event) =>
                            setAcceptsTravel(event.target.checked)
                          }
                          className="mt-1 h-4 w-4 accent-orange-500"
                        />
                        <span className="text-sm font-semibold text-zinc-100">
                          Aceita viagem
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <input
                          type="checkbox"
                          checked={hasTransport}
                          onChange={(event) =>
                            setHasTransport(event.target.checked)
                          }
                          className="mt-1 h-4 w-4 accent-orange-500"
                        />
                        <span className="text-sm font-semibold text-zinc-100">
                          Tem condução
                        </span>
                      </label>

                      <button
                        type="submit"
                        disabled={savingAdminFields}
                        className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingAdminFields ? "Salvando..." : "Salvar controle"}
                      </button>
                    </form>

                    <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-400">
                      Status atual:{" "}
                      <strong className="text-zinc-100">
                        {getStatusLabel(options.statuses, professional.status)}
                      </strong>
                      <br />
                      Confiança atual:{" "}
                      <strong className="text-zinc-100">
                        {getTrustStatusLabel(
                          options.trust_statuses,
                          professional.trust_status
                        )}
                      </strong>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
                    <h2 className="text-xl font-bold text-white">
                      Registrar contato
                    </h2>

                    <form onSubmit={handleRegisterContact} className="mt-6 space-y-4">
                      <label className="block">
                        <span className="text-sm font-medium text-zinc-200">
                          Motivo do contato
                        </span>
                        <input
                          value={contactReason}
                          onChange={(event) =>
                            setContactReason(event.target.value)
                          }
                          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                          placeholder="Ex: Chamar para obra no galpão"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-zinc-200">
                          Resultado
                        </span>
                        <input
                          value={contactResult}
                          onChange={(event) =>
                            setContactResult(event.target.value)
                          }
                          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                          placeholder="Ex: Aceitou, recusou, não respondeu"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-zinc-200">
                          Atualizar status para
                        </span>
                        <select
                          value={contactStatus}
                          onChange={(event) =>
                            setContactStatus(event.target.value)
                          }
                          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        >
                          {options.statuses.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="submit"
                        disabled={savingContact}
                        className="w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingContact ? "Registrando..." : "Registrar contato"}
                      </button>
                    </form>

                    <div className="mt-6">
                      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-500">
                        Histórico
                      </h3>

                      {profile.contact_history.length === 0 ? (
                        <p className="mt-3 text-sm text-zinc-400">
                          Nenhum contato registrado.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {profile.contact_history.map((contact) => (
                            <div
                              key={contact.id}
                              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                            >
                              <p className="text-sm font-semibold text-white">
                                {formatDate(contact.contact_date)}
                              </p>

                              <p className="mt-2 text-sm leading-6 text-zinc-400">
                                <strong className="text-zinc-200">
                                  Motivo:
                                </strong>{" "}
                                {contact.contact_reason || "Não informado"}
                              </p>

                              <p className="text-sm leading-6 text-zinc-400">
                                <strong className="text-zinc-200">
                                  Resultado:
                                </strong>{" "}
                                {contact.contact_result || "Não informado"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
                    <h2 className="text-xl font-bold text-white">
                      Observações internas
                    </h2>

                    <form onSubmit={handleCreateNote} className="mt-6 space-y-4">
                      <label className="block">
                        <span className="text-sm font-medium text-zinc-200">
                          Nova observação
                        </span>
                        <textarea
                          value={noteText}
                          onChange={(event) => setNoteText(event.target.value)}
                          rows={4}
                          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                          placeholder="Ex: Bom acabamento, mas precisa de encarregado junto."
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={savingNote}
                        className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingNote ? "Salvando..." : "Adicionar observação"}
                      </button>
                    </form>

                    <div className="mt-6">
                      {profile.admin_notes.length === 0 ? (
                        <p className="text-sm text-zinc-400">
                          Nenhuma observação interna.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {profile.admin_notes.map((note) => (
                            <div
                              key={note.id}
                              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                            >
                              <p className="text-sm leading-6 text-zinc-300">
                                {note.note}
                              </p>

                              <div className="mt-3 flex items-center justify-between gap-4">
                                <span className="text-xs text-zinc-500">
                                  {formatDate(note.created_at)}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-xs font-semibold text-red-300 hover:text-red-200"
                                >
                                  Excluir
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                </aside>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <span className="block text-sm text-zinc-500">{label}</span>
      <strong className="mt-1 block break-words text-sm font-semibold text-zinc-100">
        {value}
      </strong>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-zinc-500">{label}: </span>
      <strong className="font-semibold text-zinc-100">{value}</strong>
    </p>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
        {value}
      </p>
    </div>
  );
}