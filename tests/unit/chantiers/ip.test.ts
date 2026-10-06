import { describe, it, expect } from 'vitest'
import { clientIpFromHeaders, truncateIp, UNKNOWN_IP } from '@/lib/chantiers/ip'

describe('truncateIp', () => {
  it.each([
    ['203.0.113.42', '203.0.113.0'],
    [' 8.8.8.8 ', '8.8.8.0'],
    ['::ffff:192.0.2.128', '192.0.2.0'],
    ['2001:0db8:85a3:0000:0000:8a2e:0370:7334', '2001:db8:85a3::/48'],
    ['2001:db8::1', '2001:db8:0::/48'],
    ['::1', '0:0:0::/48'],
    ['fe80::', 'fe80:0:0::/48'],
  ])('%s → %s', (ip, expected) => {
    expect(truncateIp(ip)).toBe(expected)
  })

  it.each([null, undefined, '', 'unknown', '999.1.1.1', '1.2.3', 'not-an-ip'])(
    '%s → inconnue',
    (ip) => {
      expect(truncateIp(ip)).toBe(UNKNOWN_IP)
    }
  )
})

describe('clientIpFromHeaders', () => {
  it('prend la première adresse de x-forwarded-for', () => {
    const h = new Headers({ 'x-forwarded-for': '203.0.113.42, 10.0.0.1', 'x-real-ip': '1.1.1.1' })
    expect(clientIpFromHeaders(h)).toBe('203.0.113.42')
  })

  it('se rabat sur x-real-ip', () => {
    expect(clientIpFromHeaders(new Headers({ 'x-real-ip': '1.1.1.1' }))).toBe('1.1.1.1')
  })

  it('null sans en-tête', () => {
    expect(clientIpFromHeaders(new Headers())).toBeNull()
  })
})
