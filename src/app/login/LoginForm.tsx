"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";
import { type AuthState, loginAction, setupAction } from "./actions";

const initial: AuthState = {};

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="input"
          placeholder="you@yourcompany.com"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>
      <ErrorNote message={state.error} />
      <SubmitButton className="btn-primary w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}

export function SetupForm() {
  const [state, action] = useActionState(setupAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">
          Your name
        </label>
        <input id="name" name="name" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="setup-email">
          Email
        </label>
        <input
          id="setup-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="input"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="setup-password">
            Password
          </label>
          <input
            id="setup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="confirm">
            Confirm
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="input"
          />
        </div>
      </div>
      <ErrorNote message={state.error} />
      <SubmitButton className="btn-primary w-full" pendingLabel="Creating…">
        Create admin account
      </SubmitButton>
    </form>
  );
}
