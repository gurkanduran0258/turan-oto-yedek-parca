import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const supabase = getSupabaseAdmin();

  const result =
    await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });

  const users =
    result.data?.users || [];

  return (
    <div style={{ padding: 34 }}>
      <h1>Müşteriler</h1>

      <p style={{ color: "#64748b" }}>
        {users.length} kayıtlı hesap.
      </p>

      <div
        style={{
          display: "grid",
          gap: 9,
        }}
      >
        {users.map((user: any) => (
          <div
            key={user.id}
            style={{
              background: "#fff",
              border:
                "1px solid #e2e8f0",
              borderRadius: 11,
              padding: 14,
            }}
          >
            <b>
              {user.user_metadata
                ?.full_name ||
                [
                  user.user_metadata
                    ?.first_name,
                  user.user_metadata
                    ?.last_name,
                ]
                  .filter(Boolean)
                  .join(" ") ||
                user.email}
            </b>

            <div
              style={{
                color: "#64748b",
                marginTop: 4,
              }}
            >
              {user.email}
            </div>

            <small>
              Kayıt:{" "}
              {user.created_at
                ? new Date(
                    user.created_at
                  ).toLocaleString(
                    "tr-TR"
                  )
                : "-"}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
