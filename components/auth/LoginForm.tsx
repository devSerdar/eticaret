"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/auth-actions";

type LoginFormProps = {
  nextPath: string;
  banner?: string;
};

export default function LoginForm({ nextPath, banner }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />
      {banner ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-900" role="alert">
          {banner}
        </p>
      ) : null}
      <div>
        <label htmlFor="login-email" className="block text-sm font-semibold text-slate-800">
          E-posta
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-inner outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="block text-sm font-semibold text-slate-800">
          Sifre
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={8}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-inner outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      {state?.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
      >
        {pending ? "Giris yapiliyor…" : "Giris yap"}
      </button>
      <p className="text-center text-sm text-[var(--text-muted)]">
        Hesabin yok mu?{" "}
        <Link href={`/register?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-indigo-700 hover:underline">
          Kayit ol
        </Link>
      </p>
    </form>
  );
}
