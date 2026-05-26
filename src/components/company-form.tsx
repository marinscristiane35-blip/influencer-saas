"use client";

import { useActionState } from "react";

type CompanyFormState = {
  error?: string;
  success?: string;
} | null;

type CompanyFormProps = {
  action: (state: CompanyFormState, formData: FormData) => Promise<CompanyFormState>;
};

export function CompanyForm({ action }: CompanyFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="form">
      <div className="field">
        <label htmlFor="name">Nome</label>
        <input id="name" name="name" required />
      </div>
      <div className="field">
        <label htmlFor="slug">Slug</label>
        <input id="slug" name="slug" pattern="[a-z0-9-]+" required />
      </div>
      {state?.error ? <p className="error">{state.error}</p> : null}
      {state?.success ? <p className="muted">{state.success}</p> : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Cadastrar"}
      </button>
    </form>
  );
}
