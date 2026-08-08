"use client";

import { useState } from "react";

export default function AyarlarForm({
  initial,
}: {
  initial: any;
}) {
  const [form, setForm] =
    useState(initial);

  const [message, setMessage] =
    useState("");

  function setValue(
    key: string,
    value: any
  ) {
    setForm((current: any) => ({
      ...current,
      [key]: value,
    }));
  }

  async function save() {
    const response = await fetch(
      "/api/admin/settings",
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(form),
      }
    );

    const result =
      await response.json();

    setMessage(
      response.ok
        ? "Ayarlar kaydedildi."
        : result.error || "Hata"
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        border:
          "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 18,
        maxWidth: 760,
        display: "grid",
        gap: 10,
      }}
    >
      <input
        value={
          form.company_name || ""
        }
        onChange={(event) =>
          setValue(
            "company_name",
            event.target.value
          )
        }
        placeholder="Firma adı"
      />

      <input
        value={form.phone || ""}
        onChange={(event) =>
          setValue(
            "phone",
            event.target.value
          )
        }
        placeholder="Telefon"
      />

      <input
        value={
          form.support_email || ""
        }
        onChange={(event) =>
          setValue(
            "support_email",
            event.target.value
          )
        }
        placeholder="Destek e-posta"
      />

      <input
        type="number"
        value={
          form.free_shipping_threshold ||
          1500
        }
        onChange={(event) =>
          setValue(
            "free_shipping_threshold",
            Number(
              event.target.value
            )
          )
        }
        placeholder="Ücretsiz kargo limiti"
      />

      <input
        type="number"
        value={
          form.standard_shipping_fee ||
          99.9
        }
        onChange={(event) =>
          setValue(
            "standard_shipping_fee",
            Number(
              event.target.value
            )
          )
        }
        placeholder="Kargo ücreti"
      />

      <input
        type="number"
        value={
          form.low_stock_threshold ||
          5
        }
        onChange={(event) =>
          setValue(
            "low_stock_threshold",
            Number(
              event.target.value
            )
          )
        }
        placeholder="Kritik stok"
      />

      <input
        type="number"
        value={
          form.default_profit_margin ||
          40
        }
        onChange={(event) =>
          setValue(
            "default_profit_margin",
            Number(
              event.target.value
            )
          )
        }
        placeholder="Varsayılan kar"
      />

      <button
        onClick={() => void save()}
      >
        Kaydet
      </button>

      {message ? (
        <b>{message}</b>
      ) : null}
    </div>
  );
}
