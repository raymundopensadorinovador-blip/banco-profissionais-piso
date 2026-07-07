"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setErrorMessage("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    const { error: adminError } = await supabase.rpc(
      "get_professionals_admin_summary"
    );

    if (adminError) {
      await supabase.auth.signOut();

      setErrorMessage(
        "Este usuário não tem permissão administrativa para acessar o painel."
      );
      setLoading(false);
      return;
    }

    router.push("/admin/profissionais");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        <Link
          href="/"
          className="mb-8 text-sm font-medium text-orange-400 hover:text-orange-300"
        >
          ← Voltar para início
        </Link>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-400">
            Área administrativa
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
            Entrar no painel
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Acesso restrito aos administradores do banco de profissionais.
          </p>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-red-700 bg-red-950/70 p-4 text-sm leading-6 text-red-100">
              {errorMessage}
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-200">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                placeholder="admin@email.com"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-200">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                placeholder="Digite sua senha"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}