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
        <input id="name" name="name" placeholder="Acme LTDA" required />
      </div>
      <div className="field">
        <label htmlFor="slug">Slug</label>
        <input
          id="slug"
          name="slug"
          pattern="[a-z0-9-]+"
          placeholder="acme"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue="active">
          <option value="active">Ativa</option>
          <option value="inactive">Inativa</option>
          <option value="suspended">Suspensa</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="adminName">Responsavel</label>
        <input
          id="adminName"
          name="adminName"
          placeholder="Nome do administrador"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="adminEmail">E-mail do responsavel</label>
        <input
          id="adminEmail"
          name="adminEmail"
          placeholder="admin@empresa.com"
          required
          type="email"
        />
      </div>
      <div className="field">
        <label htmlFor="adminPassword">Senha inicial</label>
        <input
          id="adminPassword"
          minLength={8}
          name="adminPassword"
          placeholder="Minimo 8 caracteres"
          required
          type="password"
        />
      </div>
      {state?.error ? <p className="error">{state.error}</p> : null}
      {state?.success ? <p className="muted">{state.success}</p> : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Cadastrar empresa e acesso"}
      </button>
    </form>
  );
}
