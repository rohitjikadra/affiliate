"use client";

import { useState } from "react";

export function ContactForm({ email }: { email: string }) {
  const [name, setName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(`AffiliateHub contact from ${name.trim() || "visitor"}`);
    const body = encodeURIComponent(`${message.trim()}\n\nFrom: ${name.trim()}\nEmail: ${fromEmail.trim()}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-neutral-800">
        Name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-navy"
        />
      </label>
      <label className="block text-sm font-medium text-neutral-800">
        Your email
        <input
          type="email"
          value={fromEmail}
          onChange={(event) => setFromEmail(event.target.value)}
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-navy"
        />
      </label>
      <label className="block text-sm font-medium text-neutral-800">
        Message
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          className="mt-1 min-h-32 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-navy"
        />
      </label>
      <button type="submit" className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-white">
        Open email
      </button>
      <p className="text-xs text-neutral-500">Opens your mail app to {email}.</p>
    </form>
  );
}
