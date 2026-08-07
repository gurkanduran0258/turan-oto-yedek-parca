import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutItem = {
  id: number;
  name: string;
  oem?: string;
  image?: string;
  price: number;
  qty: number;
};

type CheckoutBody = {
  userId: string;
  email: string;

  address: {
    title?: string;
    first_name: string;
    last_name: string;
    phone: string;
    city: string;
    district: string;
    neighborhood?: string | null;
    address_line: string;
    postal_code?: string | null;
  };

  items: CheckoutItem[];
};

const ENDPOINT =
  "/payment/iyzipos/checkoutform/initialize/auth/ecom";

function formatAmount(value: number) {
  return Number(value || 0).toFixed(2);
}

function createAuthorization(
  apiKey: string,
  secretKey: string,
  uriPath: string,
  bodyText: string
) {
  const randomKey = `${Date.now()}${Math.floor(
    Math.random() * 1_000_000_000
  )}`;

  const signature = createHmac(
    "sha256",
    secretKey
  )
    .update(
      randomKey + uriPath + bodyText,
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

function getSiteUrl(request: Request) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const url = new URL(request.url);

  return `${url.protocol}//${url.host}`;
}

function normalizePhone(phone: string) {
  let value = String(phone || "")
    .replace(/[^\d+]/g, "")
    .trim();

  if (value.startsWith("0")) {
    value = `+90${value.slice(1)}`;
  } else if (
    value.startsWith("90") &&
    !value.startsWith("+")
  ) {
    value = `+${value}`;
  }

  return value || "+905000000000";
}

export async function POST(
  request: Request
) {
  try {
    const apiKey =
      process.env.IYZICO_API_KEY?.trim();

    const secretKey =
      process.env.IYZICO_SECRET_KEY?.trim();

    const baseUrl =
      process.env.IYZICO_BASE_URL?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "IYZICO_API_KEY tanımlı değil.",
        },
        { status: 500 }
      );
    }

    if (!secretKey) {
      return NextResponse.json(
        {
          error:
            "IYZICO_SECRET_KEY tanımlı değil.",
        },
        { status: 500 }
      );
    }

    if (!baseUrl) {
      return NextResponse.json(
        {
          error:
            "IYZICO_BASE_URL tanımlı değil.",
        },
        { status: 500 }
      );
    }

    const body =
      (await request.json()) as CheckoutBody;

    if (!body.userId) {
      return NextResponse.json(
        {
          error:
            "Kullanıcı bilgisi bulunamadı.",
        },
        { status: 400 }
      );
    }

    if (!body.email) {
      return NextResponse.json(
        {
          error:
            "E-posta bilgisi bulunamadı.",
        },
        { status: 400 }
      );
    }

    if (!body.address) {
      return NextResponse.json(
        {
          error:
            "Teslimat adresi bulunamadı.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Sepetiniz boş.",
        },
        { status: 400 }
      );
    }

    const subtotal =
      body.items.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Math.max(
              1,
              Number(item.qty || 1)
            ),
        0
      );

    const shipping =
      subtotal === 0 ||
      subtotal >= 1500
        ? 0
        : 99.9;

    const total =
      subtotal + shipping;

    const conversationId =
      crypto.randomUUID();

    const basketId =
      `TO-${Date.now()}`;

    const basketItems =
      body.items.map((item) => ({
        id: String(item.id),

        name: String(
          item.name || "Ürün"
        ).slice(0, 100),

        category1:
          "Oto Yedek Parça",

        category2: String(
          item.oem || "Diğer"
        ).slice(0, 100),

        itemType: "PHYSICAL",

        price: Number(
          formatAmount(
            Number(
              item.price || 0
            ) *
              Math.max(
                1,
                Number(
                  item.qty || 1
                )
              )
          )
        ),
      }));

    if (shipping > 0) {
      basketItems.push({
        id: "shipping",
        name: "Kargo",
        category1: "Kargo",
        category2: "Teslimat",
        itemType: "PHYSICAL",
        price: Number(
          formatAmount(shipping)
        ),
      });
    }

    const siteUrl =
      getSiteUrl(request);

    const iyzicoBody = {
      locale: "tr",

      conversationId,

      price: Number(
        formatAmount(total)
      ),

      paidPrice: Number(
        formatAmount(total)
      ),

      currency: "TRY",

      basketId,

      paymentGroup: "PRODUCT",

      callbackUrl:
        `${siteUrl}/api/iyzico/callback`,

      enabledInstallments: [
        1, 2, 3, 6, 9,
      ],

      paymentSource:
        "TuranOtoWeb",

      buyer: {
        id: body.userId,

        name:
          body.address.first_name ||
          "Turan",

        surname:
          body.address.last_name ||
          "Oto",

        identityNumber:
          "11111111111",

        email:
          body.email,

        gsmNumber:
          normalizePhone(
            body.address.phone
          ),

        registrationAddress:
          body.address.address_line,

        ip:
          request.headers
            .get(
              "x-forwarded-for"
            )
            ?.split(",")[0]
            ?.trim() ||
          "127.0.0.1",

        city:
          body.address.city ||
          "Istanbul",

        country:
          "Turkey",

        zipCode:
          body.address
            .postal_code ||
          "34000",
      },

      shippingAddress: {
        contactName:
          `${body.address.first_name} ${body.address.last_name}`.trim(),

        city:
          body.address.city ||
          "Istanbul",

        country:
          "Turkey",

        address:
          `${body.address.address_line} ${body.address.district}`.trim(),

        zipCode:
          body.address
            .postal_code ||
          "34000",
      },

      billingAddress: {
        contactName:
          `${body.address.first_name} ${body.address.last_name}`.trim(),

        city:
          body.address.city ||
          "Istanbul",

        country:
          "Turkey",

        address:
          `${body.address.address_line} ${body.address.district}`.trim(),

        zipCode:
          body.address
            .postal_code ||
          "34000",
      },

      basketItems,
    };

    const bodyText =
      JSON.stringify(iyzicoBody);

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

    const responseText =
      await response.text();

    let result: any;

    try {
      result =
        JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error:
            "iyzico geçersiz cevap döndürdü.",
        },
        { status: 502 }
      );
    }

    if (
      !response.ok ||
      result.status !== "success"
    ) {
      return NextResponse.json(
        {
          error:
            result.errorMessage ||
            "iyzico ödeme ekranı oluşturulamadı.",

          errorCode:
            result.errorCode ||
            null,
        },
        {
          status:
            response.status >= 400
              ? response.status
              : 400,
        }
      );
    }

    if (!result.token) {
      return NextResponse.json(
        {
          error:
            "iyzico ödeme tokeni döndürmedi.",
        },
        { status: 500 }
      );
    }

    /*
     * ÖDEME ÖNCESİ SEPETİ
     * SUNUCUDA SAKLIYORUZ.
     */
    const supabase =
      getSupabaseAdmin();

    const addressSnapshot = {
      title:
        body.address.title ||
        "Teslimat",

      first_name:
        body.address.first_name,

      last_name:
        body.address.last_name,

      phone:
        body.address.phone,

      city:
        body.address.city,

      district:
        body.address.district,

      neighborhood:
        body.address.neighborhood ||
        null,

      address_line:
        body.address.address_line,

      postal_code:
        body.address.postal_code ||
        null,
    };

    const storedItems =
      body.items.map((item) => ({
        id: item.id,

        name: item.name,

        oem:
          item.oem || null,

        image:
          item.image || null,

        price: Number(
          Number(
            item.price || 0
          ).toFixed(2)
        ),

        qty: Math.max(
          1,
          Number(item.qty || 1)
        ),
      }));

    const {
      error: sessionError,
    } = await supabase
      .from("checkout_sessions")
      .insert({
        token:
          result.token,

        user_id:
          body.userId,

        basket_id:
          basketId,

        conversation_id:
          conversationId,

        email:
          body.email,

        address_snapshot:
          addressSnapshot,

        items:
          storedItems,

        subtotal:
          Number(
            subtotal.toFixed(2)
          ),

        shipping:
          Number(
            shipping.toFixed(2)
          ),

        total:
          Number(
            total.toFixed(2)
          ),

        status:
          "pending",
      });

    if (sessionError) {
      console.error(
        "Checkout session:",
        sessionError
      );

      return NextResponse.json(
        {
          error:
            "Ödeme oturumu kaydedilemedi: " +
            sessionError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      conversationId,

      basketId,

      token:
        result.token,

      paymentPageUrl:
        result.paymentPageUrl,

      checkoutFormContent:
        result.checkoutFormContent,
    });
  } catch (error) {
    console.error(
      "iyzico initialize:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ödeme başlatılamadı.",
      },
      { status: 500 }
    );
  }
}
