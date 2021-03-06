import 'jest'

import { FormStore } from '..'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

describe('FormStore', () => {
  it('set', () => {
    const store = new FormStore()

    store.set('key', 'value')
    expect(store.get('key')).toBe('value')

    store.set({ a: 1, b: 2 })
    expect(store.get('a')).toBe(1)
    expect(store.get('b')).toBe(2)

    store.set('this.is.a.deep.key', 'value')
    expect(store.get()).toHaveProperty('this.is.a.deep.key', 'value')
    expect(store.get('this.is.a.deep.key')).toBe('value')
  })

  it('reset', () => {
    const store = new FormStore({ default: 'value' })

    store.set('default', 'modifiedValue')
    store.set('new', 'value')
    store.reset()

    expect(store.get()).toEqual({ default: 'value' })
  })

  it('error', () => {
    const store = new FormStore()

    store.error('key0', 'error0')
    store.error('key1', 'error1')
    store.error('deep.key', 'error2')

    expect(store.error('key1')).toBe('error1')
    expect(store.error('deep.key')).toBe('error2')
    expect(store.error(0)).toBe('error0')
    expect(store.error()).toEqual({ key0: 'error0', key1: 'error1', 'deep.key': 'error2' })
  })

  it('validate', async () => {
    const store = new FormStore(
      {
        username: '',
        password: '',
        contacts: {
          phone: '123456',
          email: 'email'
        }
      },
      {
        username: (val) => assert(val.length > 0, 'Username is required'),
        password: (val) =>
          assert(val.length >= 6 && val.length <= 18, 'Password length is invalid'),
        'contacts.email': (email) => assert(email.includes('@'), 'Email is invalid')
      }
    )

    await store.set('username', 'Harrie', true)
    await store.set('password', '123', true)

    expect(store.error('username')).toBe(undefined)
    expect(store.error('password')).toBe('Password length is invalid')

    const error = await store.validate('password').catch((err) => err)

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Password length is invalid')

    await store.set('password', '123456')
    const error2 = await store.validate().catch((err) => err)
    const values = store.get()

    expect(error2).toBeInstanceOf(Error)
    expect(error2.message).toBe('Email is invalid')
    expect(values).toEqual({
      username: 'Harrie',
      password: '123456',
      contacts: { phone: '123456', email: 'email' }
    })
  })

  it('subscribe', () => {
    const store = new FormStore()

    store.subscribe((name) => {
      expect(name).toBe('username')
      expect(store.get(name)).toBe('Harrie')
    })

    store.set('username', 'Harrie')
  })
})
