"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        if (
          error.message
            .toLowerCase()
            .includes("invalid login")
        ) {
          throw new Error(
            "E-posta adresi veya şifre hatalı."
          );
        }

        throw error;
      }

      router.push("/");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Giriş yapılamadı."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="formCard">
      <h1>Giriş Yap</h1>

      <form onSubmit={handleSubmit}>
        <label>E-posta</label>

        <input
          type="email"
          required
          autoComplete="email"
          placeholder="ornek@mail.com"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
        />

        <label>Şifre</label>

        <input
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
        />

        {error ? (
          <div
            style={{
              margin: "12px 0",
              padding: "11px 12px",
              borderRadius: "7px",
              background: "#fee2e2",
              color: "#991b1b",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          className="primary"
          disabled={loading}
        >
          {loading
            ? "GİRİŞ YAPILIYOR..."
            : "GİRİŞ YAP"}
        </button>

        <p>
          Hesabınız yok mu?{" "}
          <Link href="/kayit">
            Kayıt olun
          </Link>
        </p>
      </form>
    </main>
  );
}
