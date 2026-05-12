import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// ── Signup schema ─────────────────────────────────────────────────────────────
const signUpSchema = z
  .object({
    email: z.string().email('Adresse email invalide'),
    password: z.string().min(8, 'Mot de passe trop court (min. 8 caractères)'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

// ── Login schema ──────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

// ── Update-password schema ────────────────────────────────────────────────────
const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Mot de passe trop court (min. 8 caractères)'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

describe('signUpSchema', () => {
  it('accepts valid data', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = signUpSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Adresse email invalide')
  })

  it('rejects password shorter than 8 characters', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe(
      'Mot de passe trop court (min. 8 caractères)'
    )
  })

  it('rejects mismatched passwords', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'different456',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe(
      'Les mots de passe ne correspondent pas'
    )
    expect(result.error?.issues[0].path).toEqual(['confirmPassword'])
  })
})

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'anything',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Mot de passe requis')
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'bad',
      password: 'password',
    })
    expect(result.success).toBe(false)
  })
})

describe('updatePasswordSchema', () => {
  it('accepts matching passwords of at least 8 characters', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'newpassword1',
      confirmPassword: 'newpassword1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'newpassword1',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['confirmPassword'])
  })

  it('rejects short passwords', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })
})
