"use client";

import { useActionState } from "react";
import { influencerLoginAction } from "@/app/actions/auth";

export function InfluencerLoginForm() {
  const [state, formAction, pending] = useActionState(influencerLoginAction, null);

  return (
    <form action={formAction} className="form">
      <div className="field">
        <label htmlFor="email">E-mail cadastrado</label>
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
        {pending ? "Entrando..." : "Entrar no portal"}
      </button>
      <p className="notice">
        Use a senha criada pela empresa. Contas inativas ou influenciadores
        pausados/recusados nao conseguem entrar.
      </p>
    </form>
  );
}
