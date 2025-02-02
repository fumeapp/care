import type { Ref } from 'vue'
import type { H3Event } from 'h3'
import type { ModuleOptions as Config } from '../../module'

export type HookType =
  | 'vue:error'
  | 'app:error'
  | 'nitro:error'
  | 'window:unhandledrejection'

export interface ErrorPayload {
  hook: string
  name: string
  message: string
  stack: string
  cause: string
  client: boolean
  environment: string
  os: {
    platform: string
    arch: string
    version: string
  }
  process: {
    pid: number
    version: string
  }
}

export interface ErrorMeta {
  user?: {
    id?: string
    email?: string
    name?: string
    avatar?: string
  }
  agent?: string
  tags?: Record<string, string | number | boolean>
}

export interface CareComposable {
  meta: Ref<ErrorMeta>
  /**
   * Set the current user session
   * @param user  User Object - care will look for nd pluck id, email, name, and avatar
   */
  setUser: (user: Record<string, string>) => void
  /**
   * Set custom meta data that will be tied to your projects issues
   * ex: useCare().tag('page', 'home')
   * @param key key
   * @param value value
   */
  tag: (key: string, value: string) => void
  report: (type: HookType, err: unknown, config: Config, event?: H3Event) => Promise<void>
}
