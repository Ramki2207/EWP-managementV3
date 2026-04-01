import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const emailData: EmailRequest = await req.json();

    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.html) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: to, subject, html"
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get email service configuration from environment
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL");
    const FROM_NAME = Deno.env.get("FROM_NAME") || "EWP Paneelbouw";
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SMTP2GO_API_KEY = Deno.env.get("SMTP2GO_API_KEY");

    // Check if at least one email service is configured
    if (!RESEND_API_KEY && !SMTP2GO_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Email service not configured. Please set up RESEND_API_KEY or SMTP2GO_API_KEY"
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!FROM_EMAIL) {
      return new Response(
        JSON.stringify({
          error: "FROM_EMAIL not configured. Please contact administrator."
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (RESEND_API_KEY) {
      // Use Resend API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      const result = await response.json();

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email sent successfully",
          id: result.id
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fallback: Use SMTP2GO API (another simple email API)
    const SMTP2GO_API_KEY = Deno.env.get("SMTP2GO_API_KEY");

    if (SMTP2GO_API_KEY) {
      const response = await fetch("https://api.smtp2go.com/v3/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: SMTP2GO_API_KEY,
          to: [emailData.to],
          sender: FROM_EMAIL,
          subject: emailData.subject,
          html_body: emailData.html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SMTP2GO API error: ${error}`);
      }

      const result = await response.json();

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email sent successfully",
          data: result
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // If no email service is configured, return error
    return new Response(
      JSON.stringify({
        error: "No email service configured. Please set up RESEND_API_KEY or SMTP2GO_API_KEY"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send email"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
