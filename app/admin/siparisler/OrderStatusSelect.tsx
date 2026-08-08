"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = [
  "Yeni",
  "Ödeme Bekleniyor",
  "Ödendi",
  "Hazırlanıyor",
  "Kargoda",
  "Tamamlandı",
  "İptal",
];

export default function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    const old = status;
    setStatus(next);
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: next,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Güncellenemedi.");
      }

      router.refresh();
    } catch (error) {
      setStatus(old);
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
    <select
      value={status}
      disabled={busy}
      onChange={(event) =>
        void change(event.target.value)
      }
    >
      {statuses.map((item) => (
        <option key={item}>
          {item}
        </option>
      ))}
    </select>
  );
}
