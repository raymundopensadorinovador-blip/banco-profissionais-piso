"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import OneSignal from "react-onesignal";
import { supabase } from "@/lib/supabaseClient";

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

type AvailabilityOption = {
  key: string;
  label: string;
  sort_order: number;
};

type FormOptions = {
  roles: RoleOption[];
  skills: SkillOption[];
  availability: AvailabilityOption[];
};

type ExperienceItem = {
  company_or_work_name: string;
  role_performed: string;
  time_worked: string;
  description: string;
};

type ReferenceItem = {
  reference_name: string;
  reference_phone: string;
  relationship: string;
};

const emptyExperience: ExperienceItem = {
  company_or_work_name: "",
  role_performed: "",
  time_worked: "",
  description: "",
};

const emptyReference: ReferenceItem = {
  reference_name: "",
  reference_phone: "",
  relationship: "",
};

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

export default function CadastroProfissionalPage() {
  const [options, setOptions] = useState<FormOptions>({
    roles: [],
    skills: [],
    availability: [],
  });

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [createdProfessionalId, setCreatedProfessionalId] = useState<string | null>(
    null
  );
  const [pushLoading, setPushLoading] = useState(false);
  const [pushSuccessMessage, setPushSuccessMessage] = useState("");
  const [pushErrorMessage, setPushErrorMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [referredByName, setReferredByName] = useState("");
  const [referredByPhone, setReferredByPhone] = useState("");
  const [mainRoleKey, setMainRoleKey] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [availabilityKey, setAvailabilityKey] = useState("");
  const [acceptsTravel, setAcceptsTravel] = useState(false);
  const [hasTransport, setHasTransport] = useState(false);
  const [dailyRate, setDailyRate] = useState("");
  const [professionalSummary, setProfessionalSummary] = useState("");
  const [worksExperienceSummary, setWorksExperienceSummary] = useState("");
  const [selectedSkillKeys, setSelectedSkillKeys] = useState<string[]>([]);
  const [experiences, setExperiences] = useState<ExperienceItem[]>([
    { ...emptyExperience },
  ]);
  const [references, setReferences] = useState<ReferenceItem[]>([
    { ...emptyReference },
  ]);
  const [consentContact, setConsentContact] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true);
      setErrorMessage("");

      const { data, error } = await supabase.rpc("get_professional_form_options");

      if (error) {
        setErrorMessage(
          "Não foi possível carregar as opções do formulário. Tente novamente."
        );
        setLoadingOptions(false);
        return;
      }

      const receivedOptions = data as FormOptions;

      setOptions({
        roles: receivedOptions.roles ?? [],
        skills: receivedOptions.skills ?? [],
        availability: receivedOptions.availability ?? [],
      });

      setLoadingOptions(false);
    }

    loadOptions();
  }, []);

  const skillsByCategory = useMemo(() => {
    return options.skills.reduce<Record<string, SkillOption[]>>((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }

      acc[skill.category].push(skill);
      return acc;
    }, {});
  }, [options.skills]);

  function toggleSkill(skillKey: string) {
    setSelectedSkillKeys((current) => {
      if (current.includes(skillKey)) {
        return current.filter((item) => item !== skillKey);
      }

      return [...current, skillKey];
    });
  }

  function updateExperience(
    index: number,
    field: keyof ExperienceItem,
    value: string
  ) {
    setExperiences((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addExperience() {
    setExperiences((current) => [...current, { ...emptyExperience }]);
  }

  function removeExperience(index: number) {
    setExperiences((current) => {
      if (current.length === 1) {
        return [{ ...emptyExperience }];
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function updateReference(
    index: number,
    field: keyof ReferenceItem,
    value: string
  ) {
    setReferences((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addReference() {
    setReferences((current) => [...current, { ...emptyReference }]);
  }

  function removeReference(index: number) {
    setReferences((current) => {
      if (current.length === 1) {
        return [{ ...emptyReference }];
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function resetForm() {
    setFullName("");
    setWhatsapp("");
    setCity("");
    setNeighborhood("");
    setReferredByName("");
    setReferredByPhone("");
    setExperienceYears("");
    setAvailabilityKey("");
    setAcceptsTravel(false);
    setHasTransport(false);
    setDailyRate("");
    setProfessionalSummary("");
    setWorksExperienceSummary("");
    setSelectedSkillKeys([]);
    setExperiences([{ ...emptyExperience }]);
    setReferences([{ ...emptyReference }]);
    setConsentContact(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");
    setCreatedProfessionalId(null);
    setPushSuccessMessage("");
    setPushErrorMessage("");
    const selectedRole = options.roles.find((role) => role.key === mainRoleKey);
    const selectedAvailability = options.availability.find(
      (availability) => availability.key === availabilityKey
    );

    const selectedSkills = options.skills
      .filter((skill) => selectedSkillKeys.includes(skill.key))
      .map((skill) => skill.label);

    const filledExperiences = experiences.filter((experience) => {
      return (
        experience.company_or_work_name.trim() ||
        experience.role_performed.trim() ||
        experience.time_worked.trim() ||
        experience.description.trim()
      );
    });

    const filledReferences = references.filter((reference) => {
      return (
        reference.reference_name.trim() ||
        reference.reference_phone.trim() ||
        reference.relationship.trim()
      );
    });

    if (!referredByName.trim()) {
      setErrorMessage("Informe o nome de quem te indicou para continuar.");
      setSubmitting(false);
      return;
    }

    if (!selectedRole) {
      setErrorMessage("Escolha a função principal.");
      setSubmitting(false);
      return;
    }

    if (!consentContact) {
      setErrorMessage("Você precisa autorizar o contato para enviar o cadastro.");
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase.rpc("create_professional_application_v3", {
      p_full_name: fullName,
      p_whatsapp: whatsapp,
      p_city: city,
      p_neighborhood: neighborhood,
      p_main_role: selectedRole.label,
      p_experience_years: parseNumber(experienceYears),
      p_availability: selectedAvailability?.label ?? "",
      p_accepts_travel: acceptsTravel,
      p_has_transport: hasTransport,
      p_daily_rate: parseNumber(dailyRate),
      p_professional_summary: professionalSummary,
      p_works_experience_summary: worksExperienceSummary,
      p_consent_contact: consentContact,
      p_skills: selectedSkills,
      p_experiences: filledExperiences,
      p_references: filledReferences,
      p_referred_by_name: referredByName,
      p_referred_by_phone: referredByPhone,
    });

    if (error) {
      setErrorMessage(error.message || "Não foi possível enviar o cadastro.");
      setSubmitting(false);
      return;
    }

    setCreatedProfessionalId(data as string);

    setSuccessMessage(
      "Cadastro enviado com sucesso. Sua indicação foi registrada, e nossa equipe poderá entrar em contato quando houver uma oportunidade compatível com seu perfil."
    );
    resetForm();
    setSubmitting(false);
  }

  async function handleEnablePushNotifications() {
    if (!createdProfessionalId) {
      setPushErrorMessage(
        "Não foi possível identificar o cadastro para ativar as notificações."
      );
      return;
    }
  
    setPushLoading(true);
    setPushSuccessMessage("");
    setPushErrorMessage("");
  
    try {
      const isSupported = OneSignal.Notifications.isPushSupported();
  
      if (!isSupported) {
        setPushErrorMessage(
          "Este navegador não oferece suporte para notificações push."
        );
        setPushLoading(false);
        return;
      }
  
      await OneSignal.login(createdProfessionalId);
  
      await OneSignal.Notifications.requestPermission();
  
      const hasPermission = OneSignal.Notifications.permission;
  
      if (!hasPermission) {
        await supabase.rpc("mark_professional_push_disabled", {
          p_professional_id: createdProfessionalId,
          p_permission_status: "denied",
        });
  
        setPushErrorMessage(
          "As notificações não foram ativadas. Para receber avisos, permita notificações deste site no navegador."
        );
        setPushLoading(false);
        return;
      }
  
      await OneSignal.User.PushSubscription.optIn();
  
      await new Promise((resolve) => setTimeout(resolve, 1000));
  
      const subscriptionId = OneSignal.User.PushSubscription.id ?? "";
  
      const { error } = await supabase.rpc("mark_professional_push_enabled", {
        p_professional_id: createdProfessionalId,
        p_onesignal_subscription_id: subscriptionId,
        p_permission_status: "granted",
      });
  
      if (error) {
        throw error;
      }
  
      setPushSuccessMessage(
        "Notificações ativadas com sucesso. Agora você poderá receber avisos de oportunidades neste dispositivo."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível ativar as notificações.";
  
      setPushErrorMessage(message);
    } finally {
      setPushLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {successMessage ? (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-emerald-700 bg-emerald-950 p-5 text-sm leading-6 text-emerald-50 shadow-2xl shadow-black/50 sm:bottom-6">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-base font-black text-white">
              ✓
            </div>

            <div className="min-w-0 flex-1">
              <strong className="block text-base text-white">
                Cadastro enviado
              </strong>
              <p className="mt-1 text-emerald-100">{successMessage}</p>
              {createdProfessionalId ? (
  <div className="mt-4 rounded-xl border border-emerald-700/70 bg-emerald-900/50 p-4">
    <strong className="block text-sm text-white">
      Receba oportunidades no celular
    </strong>

    <p className="mt-1 text-sm leading-6 text-emerald-100">
      Ative as notificações para receber avisos quando houver chamadas ou
      oportunidades compatíveis com seu perfil.
    </p>

    <button
      type="button"
      onClick={handleEnablePushNotifications}
      disabled={pushLoading}
      className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pushLoading ? "Ativando notificações..." : "Ativar notificações"}
    </button>

    <p className="mt-2 text-xs leading-5 text-emerald-100/80">
      No Android e PC, basta permitir notificações no navegador. No iPhone,
      pode ser necessário adicionar o app à Tela de Início.
    </p>

    {pushSuccessMessage ? (
      <div className="mt-3 rounded-lg bg-emerald-800/70 p-3 text-sm text-white">
        {pushSuccessMessage}
      </div>
    ) : null}

    {pushErrorMessage ? (
      <div className="mt-3 rounded-lg bg-red-950/80 p-3 text-sm text-red-100">
        {pushErrorMessage}
      </div>
    ) : null}
  </div>
) : null}
            </div>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="rounded-lg px-2 py-1 text-lg font-bold text-emerald-100 hover:bg-emerald-900"
              aria-label="Fechar mensagem de sucesso"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-orange-400 hover:text-orange-300"
          >
            ← Voltar para início
          </Link>

          <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/30 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-400">
              Cadastro profissional
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Trabalha com piso de concreto?
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">
              Preencha seus dados para entrar em nosso banco de profissionais.
              Também aceitamos cadastro de carpinteiro, armador, operador,
              servente especializado, encarregado e apoio de obra.
            </p>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
              O cadastro não garante contratação imediata. Ele serve para nossa
              equipe encontrar profissionais conforme a necessidade de cada obra.
            </p>
          </div>
        </div>

        {loadingOptions ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
            Carregando formulário...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage ? (
              <div className="rounded-2xl border border-red-700 bg-red-950/70 p-5 text-sm leading-6 text-red-100">
                {errorMessage}
              </div>
            ) : null}

            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <h2 className="text-xl font-bold text-white">Dados de contato</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Informe os dados principais para a equipe entrar em contato.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Nome completo *
                  </span>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Ex: João da Silva"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    WhatsApp *
                  </span>
                  <input
                    value={whatsapp}
                    onChange={(event) => setWhatsapp(event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Ex: (19) 99999-9999"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Cidade *
                  </span>
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Ex: Campinas"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Bairro
                  </span>
                  <input
                    value={neighborhood}
                    onChange={(event) => setNeighborhood(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Ex: Jardim Londres"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-orange-800/60 bg-orange-950/20 p-5 sm:p-6">
  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
        Indicação
      </p>

      <h2 className="mt-2 text-2xl font-bold text-white">
        Indique e dobre suas chances
      </h2>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-orange-100/80">
        Informe quem te indicou para este cadastro. Cadastros com indicação
        ficam mais fáceis de validar e podem ter prioridade quando surgir uma
        oportunidade compatível.
      </p>
    </div>
  </div>

  <div className="mt-6 grid gap-4 sm:grid-cols-2">
    <label className="block">
      <span className="text-sm font-medium text-zinc-100">
        Nome de quem te indicou *
      </span>
      <input
        value={referredByName}
        onChange={(event) => setReferredByName(event.target.value)}
        required
        className="mt-2 w-full rounded-xl border border-orange-700/60 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
        placeholder="Ex: Juliano, encarregado, empresa ou contato"
      />
    </label>

    <label className="block">
      <span className="text-sm font-medium text-zinc-100">
        WhatsApp de quem te indicou
      </span>
      <input
        value={referredByPhone}
        onChange={(event) => setReferredByPhone(event.target.value)}
        className="mt-2 w-full rounded-xl border border-orange-700/60 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
        placeholder="Ex: (19) 99999-9999"
      />
      <span className="mt-2 block text-xs leading-5 text-orange-100/60">
        Opcional, mas ajuda nossa equipe a confirmar a indicação.
      </span>
    </label>
  </div>
</section> 

            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <h2 className="text-xl font-bold text-white">
                Função e experiência
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Função principal *
                  </span>
                  <select
                    value={mainRoleKey}
                    onChange={(event) => setMainRoleKey(event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                    <option value="">Selecione</option>
                    {options.roles.map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Tempo de experiência
                  </span>
                  <input
                    value={experienceYears}
                    onChange={(event) => setExperienceYears(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Ex: 5"
                    inputMode="decimal"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Disponibilidade
                  </span>
                  <select
                    value={availabilityKey}
                    onChange={(event) => setAvailabilityKey(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                    <option value="">Selecione</option>
                    {options.availability.map((availability) => (
                      <option key={availability.key} value={availability.key}>
                        {availability.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Valor médio da diária
                  </span>
                  <input
                    value={dailyRate}
                    onChange={(event) => setDailyRate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Ex: 180,00"
                    inputMode="decimal"
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <input
                    type="checkbox"
                    checked={acceptsTravel}
                    onChange={(event) => setAcceptsTravel(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-orange-500"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-zinc-100">
                      Aceita viajar
                    </span>
                    <span className="mt-1 block text-sm text-zinc-400">
                      Marque se aceita trabalhar em outras cidades.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <input
                    type="checkbox"
                    checked={hasTransport}
                    onChange={(event) => setHasTransport(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-orange-500"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-zinc-100">
                      Tem condução própria
                    </span>
                    <span className="mt-1 block text-sm text-zinc-400">
                      Marque se consegue ir até a obra por conta própria.
                    </span>
                  </span>
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <h2 className="text-xl font-bold text-white">
                Qualificações e serviços
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Marque tudo que você já fez ou sabe fazer.
              </p>

              <div className="mt-6 space-y-6">
                {Object.entries(skillsByCategory).map(([category, skills]) => (
                  <div key={category}>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-orange-400">
                      {category}
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {skills.map((skill) => (
                        <label
                          key={skill.key}
                          className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSkillKeys.includes(skill.key)}
                            onChange={() => toggleSkill(skill.key)}
                            className="mt-1 h-4 w-4 accent-orange-500"
                          />
                          <span className="text-sm font-medium text-zinc-100">
                            {skill.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <h2 className="text-xl font-bold text-white">
                Resumo profissional
              </h2>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Fale um pouco sobre sua experiência
                  </span>
                  <textarea
                    value={professionalSummary}
                    onChange={(event) =>
                      setProfessionalSummary(event.target.value)
                    }
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Ex: Trabalho há 8 anos com piso industrial, acabamento com acabadora e corte de juntas."
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">
                    Obras, empresas ou serviços onde já trabalhou
                  </span>
                  <textarea
                    value={worksExperienceSummary}
                    onChange={(event) =>
                      setWorksExperienceSummary(event.target.value)
                    }
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Ex: Galpões, condomínios, pisos externos, empresas onde trabalhou, tipos de obra..."
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Experiências anteriores
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Opcional, mas ajuda o administrador a entender seu histórico.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addExperience}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
                >
                  Adicionar experiência
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {experiences.map((experience, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <h3 className="font-semibold text-white">
                        Experiência {index + 1}
                      </h3>

                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="text-sm font-medium text-red-300 hover:text-red-200"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        value={experience.company_or_work_name}
                        onChange={(event) =>
                          updateExperience(
                            index,
                            "company_or_work_name",
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        placeholder="Empresa ou obra"
                      />

                      <input
                        value={experience.role_performed}
                        onChange={(event) =>
                          updateExperience(
                            index,
                            "role_performed",
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        placeholder="Função exercida"
                      />

                      <input
                        value={experience.time_worked}
                        onChange={(event) =>
                          updateExperience(
                            index,
                            "time_worked",
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        placeholder="Tempo trabalhado"
                      />

                      <input
                        value={experience.description}
                        onChange={(event) =>
                          updateExperience(
                            index,
                            "description",
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        placeholder="Descrição rápida"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Referências profissionais
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Informe alguém que possa confirmar sua experiência, se tiver.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addReference}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
                >
                  Adicionar referência
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {references.map((reference, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <h3 className="font-semibold text-white">
                        Referência {index + 1}
                      </h3>

                      <button
                        type="button"
                        onClick={() => removeReference(index)}
                        className="text-sm font-medium text-red-300 hover:text-red-200"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <input
                        value={reference.reference_name}
                        onChange={(event) =>
                          updateReference(
                            index,
                            "reference_name",
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        placeholder="Nome"
                      />

                      <input
                        value={reference.reference_phone}
                        onChange={(event) =>
                          updateReference(
                            index,
                            "reference_phone",
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        placeholder="Telefone"
                      />

                      <input
                        value={reference.relationship}
                        onChange={(event) =>
                          updateReference(
                            index,
                            "relationship",
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        placeholder="Relação profissional"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={consentContact}
                  onChange={(event) => setConsentContact(event.target.checked)}
                  required
                  className="mt-1 h-4 w-4 accent-orange-500"
                />
                <span className="text-sm leading-6 text-zinc-300">
                  Autorizo o armazenamento dos dados enviados e o contato por
                  WhatsApp ou telefone para oportunidades profissionais
                  relacionadas a obras e serviços de piso de concreto. Tratamento
                  de dados conforme a LGPD, Lei nº 13.709/2018, sob diretrizes
                  da ANPD.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-xl bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Enviando cadastro..." : "Enviar cadastro"}
              </button>
            </section>
          </form>
        )}
      </section>
    </main>
  );
}