import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let token: string | null = null;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        token = body.token || body.value || null;
      } catch (_e) {}
    }

    if (!token) {
      const url = new URL(req.url);
      token = url.searchParams.get("token") || url.searchParams.get("value");
    }

    if (!token) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "TOKEN_MISSING",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const uid = Deno.env.get("PAGADITO_UID");
    const wsk = Deno.env.get("PAGADITO_WSK");

    if (!uid || !wsk) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "PAGADITO_CREDENTIALS_MISSING",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authHeader = "Basic " + btoa(`${uid}:${wsk}`);

    const response = await fetch(
      "https://sandbox-connect.pagadito.com/api/v2/get-status",
      {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          country_code: "SV",
        }),
      }
    );

    const data = await response.json();

    console.log(
      "PAGADITO STATUS RESPONSE:",
      JSON.stringify(data)
    );

    const completed =
      data?.code === "PG1003" &&
      data?.data?.status === "COMPLETED";

    return new Response(
      JSON.stringify({
        ok: true,
        completed: completed,
        token: token,
        pagadito_data: data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("ERROR VERIFICAR PAGO:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message || String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
