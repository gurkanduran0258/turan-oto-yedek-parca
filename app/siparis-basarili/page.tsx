"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function OrderSuccessPage() {
  const params = useSearchParams();

  const orderNo =
    params.get("order") || "-";

  return (
    <main
      className="container"
      style={{
        padding: "80px 20px",
        minHeight: "60vh",
      }}
    >
      <section
        style={{
          maxWidth: "650px",
          margin: "0 auto",
          padding: "40px",
          textAlign: "center",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
            background: "#dcfce7",
            color: "#166534",
            fontSize: "34px",
            fontWeight: 900,
          }}
        >
          ✓
        </div>

        <h1>
          Siparişiniz Alındı
        </h1>

        <p
          style={{
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          Siparişiniz başarıyla
          oluşturuldu.
        </p>

        <div
          style={{
            margin: "22px 0",
            padding: "17px",
            background: "#f8fafc",
            borderRadius: "9px",
          }}
        >
          <small>
            Sipariş Numaranız
          </small>

          <strong
            style={{
              display: "block",
              marginTop: "6px",
              fontSize: "20px",
            }}
          >
            {orderNo}
          </strong>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/hesabim/siparisler"
            className="primary"
          >
            SİPARİŞLERİM
          </Link>

          <Link
            href="/urunler"
            style={{
              padding: "12px 16px",
              border:
                "1px solid #cbd5e1",
              borderRadius: "7px",
              color: "#0f172a",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ALIŞVERİŞE DEVAM ET
          </Link>
        </div>
      </section>
    </main>
  );
}
