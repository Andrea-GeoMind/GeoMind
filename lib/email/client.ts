import { Resend } from 'resend'
import { env } from '@/lib/env'

// Singleton Resend client — used for transactional emails (analysis complete, plan upgrade, etc.)
// Auth emails (confirm, reset) are sent by Supabase via Resend SMTP configured in the dashboard.
export const resend = new Resend(env.RESEND_API_KEY)
