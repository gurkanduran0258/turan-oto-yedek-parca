"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function KargoManager({
  id,
  company,
  tracking,
}: {
  id: number;
  company: string | null;
  tracking: string | null;
}) {
  const router = useRouter();

  const [currentCompany, setCurrentCompany] =
    useState(company || "");

  const [currentTracking, setCurrentTracking] =
    useState(tracking || "");

  const [busy, setBusy] =
    useState(false);

  async function save() {
    setBusy(true);

    try {
      const response = await fetch(
        `/api/admin/orders/${id}/shipping`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            shipping_company:
              currentCompany,
            tracking_number:
              currentTracking,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Hata"
        );
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Hata"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "180px 220px auto",
        gap: 8,
      }}
    >
      <input
        value={currentCompany}
        onChange={(event) =>
          setCurrentCompany(
            event.target.value
          )
        }
        placeholder="Kargo firması"
      />

      <input
        value={currentTracking}
        onChange={(event) =>
          setCurrentTracking(
            event.target.value
          )
        }
        placeholder="Takip numarası"
      />

      <button
        disabled={busy}
        onClick={() => void save()}
      >
        {busy
          ? "Kaydediliyor"
          : "Kaydet"}
      </button>
    </div>
  );
}
