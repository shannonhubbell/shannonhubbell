// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { Resend } from 'resend';

export const server = {
  sendEmail: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      message: z.string().min(10, "Message must be at least 10 characters"),
    }),
    handler: async (input) => {
      // In Cloudflare SSR, read from process.env or import.meta.env depending on your config
      const resend = new Resend(import.meta.env.RESEND_API_KEY);

      const { data, error } = await resend.emails.send({
        from: 'Contact Form <onboarding@resend.dev>', // Replace with your verified domain
        to: ['your-email@example.com'], // Where you want to receive notifications
        replyTo: input.email,
        subject: `New Contact Form Submission from ${input.name}`,
        html: `
          <h3>New Message</h3>
          <p><strong>Name:</strong> ${input.name}</p>
          <p><strong>Email:</strong> ${input.email}</p>
          <p><strong>Message:</strong></p>
          <p>${input.message.replace(/\n/g, '<br>')}</p>
        `,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    },
  }),
};
