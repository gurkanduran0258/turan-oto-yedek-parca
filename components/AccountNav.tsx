"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, MapPin, Package } from "lucide-react";

const items = [
  {
    href: "/hesabim",
    label: "Profilim",
    icon: User,
  },
  {
    href: "/hesabim/adresler",
    label: "Adreslerim",
    icon: MapPin,
  },
  {
    href: "/hesabim/siparisler",
    label: "Siparişlerim",
    icon: Package,
  },
];

export default function AccountNav() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        background: "#ffffff",
        overflow: "hidden",
        height: "fit-content",
      }}
    >
      <div
        style={{
          padding: "18px 20px",
          fontWeight: 800,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        Hesabım
      </div>

      {items.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/hesabim" &&
            pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 18px",
              textDecoration: "none",
              color: active ? "#c90020" : "#0f172a",
              background: active ? "#fff1f2" : "#ffffff",
              borderBottom: "1px solid #f1f5f9",
              fontWeight: active ? 800 : 600,
            }}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
