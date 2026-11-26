import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro/zod'
import { Resend } from 'resend'
import { env } from 'cloudflare:workers'

const resend = new Resend(env.RESEND_API_KEY)

export const server = {
  contact: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string().trim().min(1, 'Please enter your name.'),
      email: z.email('Enter a valid email address.'),
      message: z.string().trim().min(10, 'Your message should be at least 10 characters.'),
      // Injected by the Turnstile widget as a hidden field.
      'cf-turnstile-response': z.string().min(1, 'Please complete the anti-bot check.'),
    }),
    handler: async (input, context) => {
      async function verifyTurnstile(token: string, secret: string, ip?: string) {
        const body = new FormData()
        body.append('secret', secret)
        body.append('response', token)
        if (ip) body.append('remoteip', ip)

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body,
        })
        const data = (await res.json()) as { success: boolean }
        return data.success

      }
      // inside the contact handler:
      const ip = context.request.headers.get('CF-Connecting-IP') ?? undefined

      const passed = await verifyTurnstile(input['cf-turnstile-response'], env.TURNSTILE_SECRET_KEY, ip)
      if (!passed) {
        throw new ActionError({
          code: 'FORBIDDEN',
          message: 'Anti-bot verification failed. Please try again.',
        })
      }

      const { error } = await resend.emails.send({
        from: env.CONTACT_FROM_EMAIL,
        to: `shannon.hubbell@gmail.com`,
        subject: `New contact message from ${input.name}`,
        text: `From: ${input.name} <${input.email}>\n\n${input.message}`,
      })
      if (error) {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Could not send your message. Please try again later.',
        })
      }

      return { ok: true }

      return { ok: true }
    },
  }),
  joinWaitlist: defineAction({
    accept: 'form',
    input: z.object({
      email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
    }),
    handler: async (input, context) => {
      try {
        await env.forms
          .prepare('INSERT INTO waitlist (email, created_at) VALUES (?, ?)')
          .bind(input.email, new Date().toISOString())
          .run()
      } catch (err) {
        // A UNIQUE violation just means they already signed up, so treat it as success.
        if (!String(err).includes('UNIQUE')) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Could not join the waitlist. Please try again.',
          })
        }
      }

      await resend.emails.send({
        from: env.CONTACT_FROM_EMAIL,
        to: input.email,
        subject: "You're on the waitlist 🎉",
        text: "Thanks for joining! We'll email you the moment we launch.",
      })

      return { ok: true, email: input.email }
    },
  }),
  upload: defineAction({
    accept: 'form',
    input: z.object({
      file: z
        .instanceof(File, { message: 'Please choose a file to upload.' })
        .refine((f) => f.size > 0, 'The selected file is empty.')
        .refine((f) => f.size <= 5 * 1024 * 1024, 'File must be 5 MB or smaller.')
        .refine(
          (f) => ['image/png', 'image/jpeg', 'application/pdf'].includes(f.type),
          'Only PNG, JPEG, or PDF files are allowed.',
        ),
    }),
    handler: async (input, context) => {
      const ext = input.file.name.split('.').pop()?.toLowerCase() ?? 'bin'
      const key = `uploads/${crypto.randomUUID()}.${ext}`

      await env.forms_uploads.put(key, await input.file.arrayBuffer(), {
        httpMetadata: { contentType: input.file.type },
      })

      return { ok: true, key, size: input.file.size }
    },
  }),
}