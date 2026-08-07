"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import AccountNav from "@/components/AccountNav";
import { supabase } from "@/lib/supabase-client";

export default function AccountPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/giris");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const { data, error } =
        await supabase
          .from("profiles")
          .select(
            "first_name,last_name,phone"
          )
          .eq("id", user.id)
          .maybeSingle();

      if (error) {
        setError(error.message);
      }

      setFirstName(
        data?.first_name ||
          user.user_metadata?.first_name ||
          ""
      );

      setLastName(
        data?.last_name ||
          user.user_metadata?.last_name ||
          ""
      );

      setPhone(
        data?.phone ||
          user.user_metadata?.phone ||
          ""
      );

      setLoading(false);
    }

    void loadProfile();
  }, [router]);

  async function saveProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!userId) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const { error: profileError } =
      await supabase
        .from("profiles")
        .upsert({
          id: userId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          updated_at:
            new Date().toISOString(),
        });

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    const { error: authError } =
      await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name:
            `${firstName.trim()} ${lastName.trim()}`.trim(),
          phone: phone.trim(),
        },
      });

    if (authError) {
      setError(authError.message);
      setSaving(false);
      return;
    }

    setMessage(
      "Profil bilgileriniz güncellendi."
    );

    setSaving(false);
  }

  if (loading) {
    return (
      <main
        className="container"
        style={{
          padding: "55px 0",
        }}
      >
        Hesap yükleniyor...
      </main>
    );
  }

  return (
    <main
      className="container"
      style={{
        padding: "42px 0 70px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "240px minmax(0,1fr)",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <AccountNav />

        <section
          style={{
            border:
              "1px solid #e2e8f0",
            borderRadius: "12px",
            background: "#ffffff",
            padding: "28px",
          }}
        >
          <h1
            style={{
              marginTop: 0,
            }}
          >
            Profilim
          </h1>

          <p
            style={{
              color: "#64748b",
            }}
          >
            Hesap ve iletişim bilgilerinizi
            buradan güncelleyebilirsiniz.
          </p>

          <form
            onSubmit={saveProfile}
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2,minmax(0,1fr))",
              gap: "18px",
              marginTop: "25px",
            }}
          >
            <label style={labelStyle}>
              Ad

              <input
                style={inputStyle}
                value={firstName}
                onChange={(event) =>
                  setFirstName(
                    event.target.value
                  )
                }
              />
            </label>

            <label style={labelStyle}>
              Soyad

              <input
                style={inputStyle}
                value={lastName}
                onChange={(event) =>
                  setLastName(
                    event.target.value
                  )
                }
              />
            </label>

            <label style={labelStyle}>
              E-posta

              <input
                style={{
                  ...inputStyle,
                  background: "#f8fafc",
                }}
                value={email}
                disabled
              />
            </label>

            <label style={labelStyle}>
              Telefon

              <input
                style={inputStyle}
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                placeholder="05XX XXX XX XX"
              />
            </label>

            {error ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "12px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "8px",
                  fontWeight: 700,
                }}
              >
                {error}
              </div>
            ) : null}

            {message ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "12px",
                  background: "#dcfce7",
                  color: "#166534",
                  borderRadius: "8px",
                  fontWeight: 700,
                }}
              >
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              className="primary"
              disabled={saving}
              style={{
                width: "fit-content",
              }}
            >
              {saving
                ? "KAYDEDİLİYOR..."
                : "BİLGİLERİ KAYDET"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "7px",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 13px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "15px",
};
