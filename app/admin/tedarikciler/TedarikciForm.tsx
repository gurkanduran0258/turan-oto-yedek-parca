"use client";

import { useState } from "react";

export default function TedarikciForm() {
  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [tax, setTax] =
    useState("");

  async function save() {
    const response = await fetch(
      "/api/admin/tedarikciler",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          tax_number: tax,
        }),
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      alert(
        result.error || "Hata"
      );
      return;
    }

    location.reload();
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "2fr 1fr 1.5fr 1fr auto",
        gap: 8,
        background: "#fff",
        border:
          "1px solid #e2e8f0",
        borderRadius: 11,
        padding: 14,
        marginBottom: 15,
      }}
    >
      <input
        placeholder="Tedarikçi adı"
        value={name}
        onChange={(event) =>
          setName(
            event.target.value
          )
        }
      />

      <input
        placeholder="Telefon"
        value={phone}
        onChange={(event) =>
          setPhone(
            event.target.value
          )
        }
      />

      <input
        placeholder="E-posta"
        value={email}
        onChange={(event) =>
          setEmail(
            event.target.value
          )
        }
      />

      <input
        placeholder="Vergi no"
        value={tax}
        onChange={(event) =>
          setTax(
            event.target.value
          )
        }
      />

      <button
        onClick={() => void save()}
      >
        Ekle
      </button>
    </div>
  );
}
