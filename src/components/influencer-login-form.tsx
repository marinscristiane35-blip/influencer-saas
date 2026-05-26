"use client";

import { useActionState } from "react";
import { influencerLoginAction } from "@/app/actions/auth";

export function InfluencerLoginForm() {
  const [state, formAction, pending] = useActionState(influencerLoginAction, null);

  return (
    <form action={formAction} className="form">
      <div className="field">
        <label htmlFor="email">E-mail cadastrado</label>
        <input id="email" name="email" type="email" required />
      </div>
      {state?.error ? <p className="error">{state.error}</p> : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Entrando..." : "Entrar no portal"}
      </button>
      <p className="notice">
        Acesso temporario por e-mail cadastrado. Influenciadores pausados ou
        recusados nao conseguem entrar.
      </p>
    </form>
  );
}
