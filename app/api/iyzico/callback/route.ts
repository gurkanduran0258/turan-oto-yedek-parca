import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";

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

function siteUrl(request: Request) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  try {
    const apiKey =
      process.env.IYZICO_API_KEY?.trim();

    const secretKey =
      process.env.IYZICO_SECRET_KEY?.trim();

    const baseUrl =
      process.env.IYZICO_BASE_URL?.trim();

    if (
      !apiKey ||
      !secretKey ||
      !baseUrl
    ) {
      return NextResponse.redirect(
        `${siteUrl(request)}/odeme?iyzico=config-error`,
        303
      );
    }

    const formData =
      await request.formData();

    const token =
      String(
        formData.get("token") || ""
      ).trim();

    if (!token) {
      return NextResponse.redirect(
        `${siteUrl(request)}/odeme?iyzico=token-yok`,
        303
      );
    }

    const retrieveBody = {
      locale: "tr",
      token,
    };

    const bodyText =
      JSON.stringify(retrieveBody);

    const { authorization, randomKey } =
      createAuthorization(
        apiKey,
        secretKey,
        ENDPOINT,
        bodyText
      );

    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}${ENDPOINT}`,
      {
        method: "POST",
        headers: {
          Authorization: authorization,
          "x-iyzi-rnd": randomKey,
          "Content-Type": "application/json",
        },
        body: bodyText,
        cache: "no-store",
      }
    );

    const result =
      await response.json();

    const paid =
      response.ok &&
      result.status === "success" &&
      result.paymentStatus === "SUCCESS" &&
      Number(result.fraudStatus) === 1;

    if (!paid) {
      const message = encodeURIComponent(
        result.errorMessage ||
          "Ödeme onaylanmadı."
      );

      return NextResponse.redirect(
        `${siteUrl(request)}/odeme?iyzico=failed&message=${message}`,
        303
      );
    }

    const paymentId =
      encodeURIComponent(
        String(result.paymentId || "")
      );

    const basketId =
      encodeURIComponent(
        String(result.basketId || "")
      );

    return NextResponse.redirect(
      `${siteUrl(request)}/siparis-basarili?paymentId=${paymentId}&basketId=${basketId}`,
      303
    );
  } catch (error) {
    console.error(
      "iyzico callback hatası:",
      error
    );

    return NextResponse.redirect(
      `${siteUrl(request)}/odeme?iyzico=callback-error`,
      303
    );
  }
}
