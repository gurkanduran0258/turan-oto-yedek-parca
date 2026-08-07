import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENDPOINT =
  "/payment/iyzipos/checkoutform/auth/ecom/detail";

function createAuthorization(
  apiKey: string,
  secretKey: string,
  uriPath: string,
  bodyText: string
) {
  const randomKey = `${Date.now()}${Math.floor(
    Math.random() *
      1_000_000_000
  )}`;

  const signature =
    createHmac(
      "sha256",
      secretKey
    )
      .update(
        randomKey +
          uriPath +
          bodyText,
        "utf8"
      )
      .digest("hex");

  const authorizationString =
    `apiKey:${apiKey}` +
    `&randomKey:${randomKey}` +
    `&signature:${signature}`;

  return {
    authorization:
      "IYZWSv2 " +
      Buffer.from(
        authorizationString,
        "utf8"
      ).toString("base64"),

    randomKey,
  };
}

function getSiteUrl(
  request: Request
) {
  const configured =
    process.env
      .NEXT_PUBLIC_SITE_URL
      ?.trim();

  if (configured) {
    return configured.replace(
      /\/$/,
      ""
    );
  }

  const url =
    new URL(request.url);

  return `${url.protocol}//${url.host}`;
}

function createOrderNo() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  const random =
    Math.floor(
      100000 +
        Math.random() *
          900000
    );

  return `TO-${year}${month}${day}-${random}`;
}

export async function POST(
  request: Request
) {
  const siteUrl =
    getSiteUrl(request);

  try {
    const apiKey =
      process.env
        .IYZICO_API_KEY
        ?.trim();

    const secretKey =
      process.env
        .IYZICO_SECRET_KEY
        ?.trim();

    const baseUrl =
      process.env
        .IYZICO_BASE_URL
        ?.trim();

    if (
      !apiKey ||
      !secretKey ||
      !baseUrl
    ) {
      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=config-error`,
        303
      );
    }

    /*
     * IYZICO CALLBACK TOKEN
     */
    const formData =
      await request.formData();

    const token =
      String(
        formData.get("token") ||
          ""
      ).trim();

    if (!token) {
      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=token-yok`,
        303
      );
    }

    /*
     * IYZICO'DAN ÖDEMEYİ
     * TEKRAR DOĞRULA
     */
    const retrieveBody = {
      locale: "tr",
      token,
    };

    const bodyText =
      JSON.stringify(
        retrieveBody
      );

    const {
      authorization,
      randomKey,
    } = createAuthorization(
      apiKey,
      secretKey,
      ENDPOINT,
      bodyText
    );

    const response =
      await fetch(
        `${baseUrl.replace(
          /\/$/,
          ""
        )}${ENDPOINT}`,
        {
          method: "POST",

          headers: {
            Authorization:
              authorization,

            "x-iyzi-rnd":
              randomKey,

            "Content-Type":
              "application/json",
          },

          body: bodyText,

          cache: "no-store",
        }
      );

    const result =
      await response.json();

    const paid =
      response.ok &&
      result.status ===
        "success" &&
      result.paymentStatus ===
        "SUCCESS" &&
      Number(
        result.fraudStatus
      ) === 1;

    if (!paid) {
      const message =
        encodeURIComponent(
          result.errorMessage ||
            "Ödeme onaylanmadı."
        );

      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=failed&message=${message}`,
        303
      );
    }

    /*
     * SUPABASE
     */
    const supabase =
      getSupabaseAdmin();

    /*
     * ÖDEME ÖNCESİ SAKLANAN
     * SEPETİ BUL
     */
    const {
      data: checkout,
      error: checkoutError,
    } = await supabase
      .from(
        "checkout_sessions"
      )
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (
      checkoutError ||
      !checkout
    ) {
      console.error(
        "Checkout bulunamadı:",
        checkoutError
      );

      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=checkout-yok`,
        303
      );
    }

    /*
     * CALLBACK TEKRAR GELİRSE
     * İKİNCİ SİPARİŞ OLUŞTURMA.
     */
    if (
      checkout.status ===
        "paid" &&
      checkout.order_id
    ) {
      const {
        data: existingOrder,
      } = await supabase
        .from("orders")
        .select(
          "id,order_no"
        )
        .eq(
          "id",
          checkout.order_id
        )
        .maybeSingle();

      if (existingOrder) {
        return NextResponse.redirect(
          `${siteUrl}/siparis-basarili?order=${encodeURIComponent(
            existingOrder.order_no
          )}&paymentId=${encodeURIComponent(
            String(
              result.paymentId ||
                ""
            )
          )}`,
          303
        );
      }
    }

    const orderNo =
      createOrderNo();

    /*
     * ORDERS TABLOSUNA YAZ
     */
    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .insert({
        user_id:
          checkout.user_id,

        order_no:
          orderNo,

        status:
          "Ödendi",

        subtotal:
          checkout.subtotal,

        shipping:
          checkout.shipping,

        total:
          checkout.total,

        payment_method:
          "Kredi Kartı / iyzico",

        address_snapshot:
          checkout.address_snapshot,
      })
      .select("id,order_no")
      .single();

    if (
      orderError ||
      !order
    ) {
      console.error(
        "Sipariş oluşturma:",
        orderError
      );

      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=order-error`,
        303
      );
    }

    /*
     * ORDER ITEMS
     */
    const checkoutItems =
      Array.isArray(
        checkout.items
      )
        ? checkout.items
        : [];

    const orderItems =
      checkoutItems.map(
        (item: any) => ({
          order_id:
            order.id,

          product_id:
            item.id,

          product_code:
            item.oem ||
            null,

          product_name:
            item.name ||
            "Ürün",

          image_url:
            item.image ||
            null,

          unit_price:
            Number(
              item.price || 0
            ),

          quantity:
            Math.max(
              1,
              Number(
                item.qty || 1
              )
            ),

          line_total:
            Number(
              (
                Number(
                  item.price || 0
                ) *
                Math.max(
                  1,
                  Number(
                    item.qty ||
                      1
                  )
                )
              ).toFixed(2)
            ),
        })
      );

    const {
      error: itemError,
    } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemError) {
      console.error(
        "Sipariş ürünleri:",
        itemError
      );

      /*
       * YARIM SİPARİŞİ GERİ AL.
       */
      await supabase
        .from("orders")
        .delete()
        .eq(
          "id",
          order.id
        );

      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=items-error`,
        303
      );
    }

    /*
     * CHECKOUT SESSION'I
     * ÖDENDİ OLARAK İŞARETLE
     */
    const {
      error: sessionUpdateError,
    } = await supabase
      .from(
        "checkout_sessions"
      )
      .update({
        status:
          "paid",

        payment_id:
          String(
            result.paymentId ||
              ""
          ),

        order_id:
          order.id,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", checkout.id);

    if (
      sessionUpdateError
    ) {
      console.error(
        "Checkout update:",
        sessionUpdateError
      );
    }

    /*
     * BAŞARILI
     */
    return NextResponse.redirect(
      `${siteUrl}/siparis-basarili?order=${encodeURIComponent(
        order.order_no
      )}&paymentId=${encodeURIComponent(
        String(
          result.paymentId ||
            ""
        )
      )}`,
      303
    );
  } catch (error) {
    console.error(
      "iyzico callback:",
      error
    );

    return NextResponse.redirect(
      `${siteUrl}/odeme?iyzico=callback-error`,
      303
    );
  }
}
