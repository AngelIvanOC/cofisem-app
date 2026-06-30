import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const { telefono, folio, nombre } = await req.json();

  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_PHONE_NUMBER");

  const twiml = `<Response>
  <Say language="es-MX">
    Hola ${nombre}. Tienes un nuevo siniestro asignado. Folio ${folio}. Revisa la aplicacion para mas detalles.
  </Say>
</Response>`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;

  const body = new URLSearchParams({
    To: `+52${telefono}`,
    From: from!,
    Twiml: twiml,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + btoa(`${accountSid}:${authToken}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});