"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase-client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (password.length < 6) {
        throw new Error(
          "Şifre en az 6 karakter olmalıdır."
        );
      }

      if (password !== passwordAgain) {
        throw new Error(
          "Girdiğiniz şifreler aynı değil."
        );
      }

      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,

          options: {
            data: {
              first_name: name.trim(),
              last_name: surname.trim(),
              phone: phone.trim(),

              full_name:
                `${name.trim()} ${surname.trim()}`.trim(),
            },
          },
        });

      if (error) {
        throw error;
      }

      if (data.session) {
        setSuccess(
          "Hesabınız oluşturuldu. Giriş yaptınız."
        );
      } else {
        setSuccess(
          "Hesabınız oluşturuldu. E-posta adresinize gönderilen doğrulama bağlantısına tıklayın."
        );
      }

      setName("");
      setSurname("");
      setEmail("");
      setPhone("");
      setPassword("");
      setPasswordAgain("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Kayıt oluşturulamadı."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="formCard">
      <h1>Üye Ol</h1>

      <form onSubmit={handleSubmit}>
        <label>Ad</label>

        <input
          required
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          placeholder="Adınız"
          autoComplete="given-name"
        />

        <label>Soyad</label>

        <input
          required
          type="text"
          value={surname}
          onChange={(event) =>
            setSurname(event.target.value)
          }
          placeholder="Soyadınız"
          autoComplete="family-name"
        />

        <label>E-posta</label>

        <input
          required
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="ornek@mail.com"
          autoComplete="email"
        />

        <label>Telefon</label>

        <input
          type="tel"
          value={phone}
          onChange={(event) =>
            setPhone(event.target.value)
          }
          placeholder="05XX XXX XX XX"
          autoComplete="tel"
        />

        <label>Şifre</label>

        <input
          required
          type="password"
          minLength={6}
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          placeholder="En az 6 karakter"
          autoComplete="new-password"
        />

        <label>Şifre Tekrar</label>

        <input
          required
          type="password"
          minLength={6}
          value={passwordAgain}
          onChange={(event) =>
            setPasswordAgain(event.target.value)
          }
          placeholder="Şifrenizi tekrar yazın"
          autoComplete="new-password"
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

        {success ? (
          <div
            style={{
              margin: "12px 0",
              padding: "11px 12px",
              borderRadius: "7px",
              background: "#dcfce7",
              color: "#166534",
              fontWeight: 700,
            }}
          >
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          className="primary"
          disabled={loading}
        >
          {loading
            ? "HESAP OLUŞTURULUYOR..."
            : "ÜYE OL"}
        </button>

        <p>
          Zaten hesabınız var mı?{" "}
          <Link href="/giris">
            Giriş yapın
          </Link>
        </p>
      </form>
    </main>
  );
}
