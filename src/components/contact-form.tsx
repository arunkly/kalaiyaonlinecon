import { useState } from "react";
import { submitContact } from "@/lib/contact";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-[#2E7D32]";

export function ContactForm() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="mt-10 rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="font-display text-2xl">सम्पर्क फारम</h2>
      <p className="mt-1 text-sm text-muted">हामीलाई सन्देश पठाउनुहोस्।</p>
      {status === "ok" ? (
        <p className="mt-4 rounded-xl bg-[#E8F5E9] px-4 py-3 text-sm font-semibold text-[#2E7D32]">
          सन्देश पठाइयो। धन्यवाद।
        </p>
      ) : (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setStatus("sending");
            setError(null);
            void submitContact({ data: { name, address, email, phone, message } })
              .then(() => {
                setStatus("ok");
                setName("");
                setAddress("");
                setEmail("");
                setPhone("");
                setMessage("");
              })
              .catch((err) => {
                setStatus("err");
                setError(err instanceof Error ? err.message : "सन्देश पठाउन सकिएन।");
              });
          }}
        >
          <label className="block text-sm font-medium">
            नाम
            <input value={name} onChange={(e) => setName(e.target.value)} required className={field} />
          </label>
          <label className="block text-sm font-medium">
            ठेगाना
            <input value={address} onChange={(e) => setAddress(e.target.value)} required className={field} />
          </label>
          <label className="block text-sm font-medium">
            इमेल
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={field} />
          </label>
          <label className="block text-sm font-medium">
            सम्पर्क नम्बर
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={field} />
          </label>
          <label className="block text-sm font-medium">
            सन्देश
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} className={field} />
          </label>
          {error ? <p className="text-sm text-mark">{error}</p> : null}
          <button
            disabled={status === "sending"}
            className="rounded-full bg-[#2E7D32] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {status === "sending" ? "पठाउँदै..." : "पठाउनुहोस्"}
          </button>
        </form>
      )}
    </section>
  );
}
