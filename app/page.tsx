import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">
            Banco de profissionais
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Cadastro técnico para profissionais de piso de concreto
          </h1>

          <p className="mt-6 text-lg leading-8 text-zinc-300">
            Cadastre seu perfil profissional para futuras oportunidades em obras
            de piso de concreto, carpintaria, armação, acabamento, apoio e
            logística.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/cadastro-profissional"
              className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Fazer cadastro profissional
            </Link>

            <Link
              href="/admin/login"
              className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
            >
              Acesso administrativo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}