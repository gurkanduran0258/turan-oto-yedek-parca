"use client";

import { useState } from "react";

export default function WorkOrderControlPage() {
  const [workOrderNo, setWorkOrderNo] = useState("");
  const [busy, setBusy] = useState<"all" | "single" | null>(null);
  const [message, setMessage] = useState("");

  async function send(requestType: "all" | "single") {
    if (requestType === "single" && !workOrderNo.trim()) {
      return alert("Sistem / İş Emri numarası gir.");
    }

    setBusy(requestType);
    setMessage("");

    try {
      const r = await fetch("/api/admin/servis/import-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          workOrderNo: workOrderNo.trim(),
        }),
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "İstek oluşturulamadı.");

      setMessage(
        requestType === "all"
          ? "TOFAŞ'taki mevcut iş emirleri okuma kuyruğuna alındı."
          : `${workOrderNo.trim()} okuma kuyruğuna alındı.`
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ color: "#c90020", fontWeight: 900, fontSize: 12 }}>
        SERVİS / TOFAŞ
      </div>

      <h1 style={{ margin: "4px 0" }}>İş Emri Kontrol</h1>

      <p style={{ color: "#64748b", maxWidth: 900 }}>
        TOFAŞ'taki mevcut İKK / iş emri kayıtlarını sadece okur. TOFAŞ tarafında
        kayıt oluşturmaz, güncellemez veya silmez.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 14,
          marginTop: 18,
        }}
      >
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Toplu Aktarım</h3>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Açık TOFAŞ İKK listesindeki kayıtları sırayla okuyup admin paneline
            aktarır.
          </p>

          <button
            disabled={busy !== null}
            onClick={() => void send("all")}
            style={primary}
          >
            {busy === "all"
              ? "Aktarım Kuyruğa Alınıyor..."
              : "TOFAŞ'tan İş Emirlerini Al"}
          </button>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Tek İş Emri</h3>

          <input
            value={workOrderNo}
            onChange={(e) => setWorkOrderNo(e.target.value)}
            placeholder="Sistem No / İKK No"
            style={input}
          />

          <button
            disabled={busy !== null}
            onClick={() => void send("single")}
            style={{ ...primary, marginTop: 9 }}
          >
            {busy === "single" ? "Kuyruğa Alınıyor..." : "Bu İş Emrini Getir"}
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            background: "#dcfce7",
            color: "#166534",
            border: "1px solid #bbf7d0",
            borderRadius: 9,
            fontWeight: 800,
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          padding: 14,
          background: "#eff6ff",
          color: "#1e40af",
          border: "1px solid #bfdbfe",
          borderRadius: 9,
          fontSize: 13,
        }}
      >
        Read-only: otomasyon yalnızca listeyi ve DETAY ekranını görüntüler.
        KAYDET / GÜNCELLE / SİL / ONAY butonlarına basmaz.
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 13,
  padding: 18,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
};

const primary: React.CSSProperties = {
  border: 0,
  background: "#c90020",
  color: "#fff",
  padding: "11px 15px",
  borderRadius: 8,
  fontWeight: 900,
  cursor: "pointer",
};
