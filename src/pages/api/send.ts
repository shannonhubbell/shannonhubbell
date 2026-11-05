import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, subject, message } = body;

    const { data, error } = await resend.emails.send({
      from: 'form@shannonhubbell.com', // Replace with your verified domain
      to: [email],
      subject: subject || 'Hello from Astro & Cloudflare',
      html: `<p>${message}</p>`,
    });

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 400 });
    }

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
