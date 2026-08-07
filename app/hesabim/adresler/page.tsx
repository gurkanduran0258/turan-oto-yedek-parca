"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountNav from "@/components/AccountNav";
import { supabase } from "@/lib/supabase-client";

type Address = {
  id: number;
  title: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string | null;
  address_line: string;
  postal_code: string | null;
  is_default: boolean;
};

const EMPTY_FORM = {
  title: "",
  first_name: "",
  last_name: "",
  phone: "",
  city: "",
  district: "",
  neighborhood: "",
  address_line: "",
  postal_code: "",
  is_default: false,
};

export default function AddressesPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAddresses(uid: string) {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", uid)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setAddresses((data || []) as Address[]);
  }

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/giris");
        return;
      }

      setUserId(user.id);
      await loadAddresses(user.id);
      setLoading(false);
    }

    void load();
  }, [router]);

  function newAddress() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setMessage("");
    setError("");
  }

  function editAddress(address: Address) {
    setEditingId(address.id);

    setForm({
      title: address.title,
      first_name: address.first_name,
      last_name: address.last_name,
      phone: address.phone,
      city: address.city,
      district: address.district,
      neighborhood: address.neighborhood || "",
      address_line: address.address_line,
      postal_code: address.postal_code || "",
      is_default: address.is_default,
    });

    setShowForm(true);
    setMessage("");
    setError("");
  }

  async function saveAddress(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!userId) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (form.is_default) {
        await supabase
          .from("addresses")
          .update({
            is_default: false,
          })
          .eq("user_id", userId);
      }

      const payload = {
        user_id: userId,
        title: form.title.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        neighborhood: form.neighborhood.trim() || null,
        address_line: form.address_line.trim(),
        postal_code: form.postal_code.trim() || null,
        is_default: form.is_default,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from("addresses")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          throw error;
        }

        setMessage("Adres güncellendi.");
      } else {
        const { error } = await supabase
          .from("addresses")
          .insert(payload);

        if (error) {
          throw error;
        }

        setMessage("Adres eklendi.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);

      await loadAddresses(userId);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Adres kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeAddress(id: number) {
    const confirmed = window.confirm(
      "Bu adresi silmek istediğinize emin misiniz?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Adres silindi.");

    await loadAddresses(userId);
  }

  if (loading) {
    return (
      <main
        className="container"
        style={{
          padding: "50px 0",
        }}
      >
        Adresler yükleniyor...
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
      <div style={layoutStyle}>
        <AccountNav />

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                }}
              >
                Adreslerim
              </h1>

              <p
                style={{
                  color: "#64748b",
                }}
              >
                Teslimat ve fatura adreslerinizi yönetin.
              </p>
            </div>

            <button
              type="button"
              className="primary"
              onClick={newAddress}
            >
              + YENİ ADRES
            </button>
          </div>

          {error ? (
            <div style={errorStyle}>
              {error}
            </div>
          ) : null}

          {message ? (
            <div style={successStyle}>
              {message}
            </div>
          ) : null}

          {showForm ? (
            <form
              onSubmit={saveAddress}
              style={formGridStyle}
            >
              <label style={labelStyle}>
                Adres Başlığı

                <input
                  required
                  style={inputStyle}
                  placeholder="Ev, İş, Depo..."
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </label>

              <label style={labelStyle}>
                Ad

                <input
                  required
                  style={inputStyle}
                  value={form.first_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      first_name: event.target.value,
                    }))
                  }
                />
              </label>

              <label style={labelStyle}>
                Soyad

                <input
                  required
                  style={inputStyle}
                  value={form.last_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      last_name: event.target.value,
                    }))
                  }
                />
              </label>

              <label style={labelStyle}>
                Telefon

                <input
                  required
                  type="tel"
                  style={inputStyle}
                  placeholder="05XX XXX XX XX"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </label>

              <label style={labelStyle}>
                İl

                <input
                  required
                  style={inputStyle}
                  placeholder="İstanbul"
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                />
              </label>

              <label style={labelStyle}>
                İlçe

                <input
                  required
                  style={inputStyle}
                  placeholder="Arnavutköy"
                  value={form.district}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      district: event.target.value,
                    }))
                  }
                />
              </label>

              <label style={labelStyle}>
                Mahalle

                <input
                  style={inputStyle}
                  value={form.neighborhood}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      neighborhood: event.target.value,
                    }))
                  }
                />
              </label>

              <label style={labelStyle}>
                Posta Kodu

                <input
                  style={inputStyle}
                  value={form.postal_code}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      postal_code: event.target.value,
                    }))
                  }
                />
              </label>

              <label
                style={{
                  ...labelStyle,
                  gridColumn: "1 / -1",
                }}
              >
                Açık Adres

                <textarea
                  required
                  style={{
                    ...inputStyle,
                    minHeight: "110px",
                    resize: "vertical",
                  }}
                  value={form.address_line}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      address_line: event.target.value,
                    }))
                  }
                />
              </label>

              <label
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      is_default: event.target.checked,
                    }))
                  }
                />

                Varsayılan adres yap
              </label>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  type="submit"
                  className="primary"
                  disabled={saving}
                >
                  {saving
                    ? "KAYDEDİLİYOR..."
                    : editingId
                      ? "ADRESİ GÜNCELLE"
                      : "ADRESİ KAYDET"}
                </button>

                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                  }}
                >
                  Vazgeç
                </button>
              </div>
            </form>
          ) : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(270px,1fr))",
              gap: "16px",
              marginTop: "25px",
            }}
          >
            {addresses.length ? (
              addresses.map((address) => (
                <article
                  key={address.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <strong>
                      {address.title}
                    </strong>

                    {address.is_default ? (
                      <span
                        style={{
                          padding: "4px 8px",
                          background: "#dcfce7",
                          color: "#166534",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 800,
                        }}
                      >
                        Varsayılan
                      </span>
                    ) : null}
                  </div>

                  <p>
                    {address.first_name}{" "}
                    {address.last_name}
                  </p>

                  <p style={mutedTextStyle}>
                    {address.phone}
                  </p>

                  <p style={mutedTextStyle}>
                    {address.neighborhood
                      ? `${address.neighborhood}, `
                      : ""}

                    {address.address_line}
                  </p>

                  <p style={mutedTextStyle}>
                    {address.district} /{" "}
                    {address.city}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "14px",
                    }}
                  >
                    <button
                      type="button"
                      style={secondaryButtonStyle}
                      onClick={() =>
                        editAddress(address)
                      }
                    >
                      Düzenle
                    </button>

                    <button
                      type="button"
                      style={deleteButtonStyle}
                      onClick={() =>
                        void removeAddress(
                          address.id
                        )
                      }
                    >
                      Sil
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div
                style={{
                  padding: "30px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  color: "#64748b",
                }}
              >
                Henüz kayıtlı adresiniz yok.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const layoutStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "240px minmax(0,1fr)",
  gap: "24px",
  alignItems: "start",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "28px",
  background: "#ffffff",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2,minmax(0,1fr))",
  gap: "15px",
  marginTop: "24px",
  padding: "20px",
  background: "#f8fafc",
  borderRadius: "10px",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "7px",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "15px",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  padding: "9px 12px",
  borderRadius: "7px",
  background: "#ffffff",
  cursor: "pointer",
};

const deleteButtonStyle: React.CSSProperties = {
  border: "none",
  padding: "9px 12px",
  borderRadius: "7px",
  background: "#fee2e2",
  color: "#991b1b",
  cursor: "pointer",
};

const mutedTextStyle: React.CSSProperties = {
  color: "#64748b",
  margin: "5px 0",
  lineHeight: 1.5,
};

const successStyle: React.CSSProperties = {
  margin: "16px 0",
  padding: "12px",
  background: "#dcfce7",
  color: "#166534",
  borderRadius: "8px",
  fontWeight: 700,
};

const errorStyle: React.CSSProperties = {
  margin: "16px 0",
  padding: "12px",
  background: "#fee2e2",
  color: "#991b1b",
  borderRadius: "8px",
  fontWeight: 700,
};
