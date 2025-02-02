import log from 'consola'
import type { H3Event } from 'h3'
import type { ModuleOptions as Config } from '../../../module'
import { configDefaults, checkConfig } from '../../care'
import type { CareComposable, ErrorMeta, ErrorPayload, HookType } from '#api-utils'
import { useState, computed, useRequestHeader } from '#imports'

/**
 * Composable to interact with care.
 * @see https://github.com/fumeapp/care
 */
export function useCare(): CareComposable {
  const meta = useState<ErrorMeta>('care-meta', () =>
    ({ user: undefined, agent: undefined, tags: {} }))

  const setUser = (user: Record<string, string>) =>
    meta.value.user = user

  const tag = (key: string, value: string) =>
    meta.value.tags = { ...meta.value.tags, [key]: value }

  const setAgent = (agent?: string) =>
    meta.value.agent = agent

  const mergeConfig = (config: Config) => {
    return {
      ...configDefaults,
      ...config,
    }
  }

  const getAgent = (event?: H3Event): string | undefined => {
    try {
      return useRequestHeader('user-agent')
        || window?.navigator?.userAgent
        || event?.headers.get('user-agent') as string
    }
    catch {
      return undefined
    }
  }
  const report = async (type: HookType, err: unknown, unmerged: Config, event?: H3Event) => {
    const config = mergeConfig(unmerged)
    if (!checkConfig(config)) return

    setAgent(getAgent(event))

    const error = err as ErrorPayload
    const payload: ErrorPayload = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      hook: type,
      cause: error.cause,
      client: typeof window !== 'undefined',
      environment: config.env,
      os: {
        platform: process.platform,
        arch: process.arch,
        version: process.version,
      },
      process: {
        pid: process.pid,
        version: process.version,
      },
    }

    if (event) {
      console.log('event is present', event.headers)
    }

    if (config.log) log.info('[fume.care] stored meta being sent:', JSON.stringify(useCare().meta.value))

    const url = `${config.domain}/api/issue`
    try {
      if (config.log) {
        log.info(`[fume.care] Error in ${type} going to ${url}`, payload)
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: config.key,
          payload: JSON.stringify(payload),
          meta: JSON.stringify(useCare().meta.value),
        }),
      })
      const data = await response.json()
      if (config.log) log.success('[fume.care] Error sent successfully:', data.meta)
      return data
    }
    catch (err) {
      if (config.log) log.error(`[fume.care] Failed to send error:`, err)
    }
  }

  return {
    meta: computed(() => meta.value),
    setUser,
    tag,
    report,
  }
}
