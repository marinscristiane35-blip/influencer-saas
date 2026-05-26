"use client";

import { useActionState } from "react";

type LoginFormState = {
  error?: string;
} | null;

type LoginFormProps = {
  action: (state: LoginFormState, formData: FormData) => Promise<LoginFormState>;
  notice?: string;
  submitLabel?: string;
};

export function LoginForm({
  action,
  notice,
  submitLabel = "Entrar",
}: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="form">
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state?.error ? <p className="error">{state.error}</p> : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Entrando..." : submitLabel}
      </button>
      {notice ? <p className="notice">{notice}</p> : null}
    </form>
  );
}
