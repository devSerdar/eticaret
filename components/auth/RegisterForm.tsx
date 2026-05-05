"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/auth-actions";

type RegisterFormProps = {
  nextPath: string;
};

export default function RegisterForm({ nextPath }: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />
      <div>
        <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-800">
          E-posta
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-inner outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      <div>
        <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-800">
          Gorunen ad
        </label>
        <input
          id="reg-name"
          name="displayName"
          type="text"
          required
          minLength={2}
          autoComplete="nickname"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-inner outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-800">
          Sifre (en az 8 karakter)
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
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
        {pending ? "Kaydediliyor…" : "Kayit ol ve giris yap"}
      </button>
      <p className="text-center text-sm text-[var(--text-muted)]">
        Zaten uye misin?{" "}
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-indigo-700 hover:underline">
          Giris yap
        </Link>
      </p>
    </form>
  );
}
