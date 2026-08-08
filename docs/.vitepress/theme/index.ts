// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BookLanding from './components/BookLanding.vue'
import './style.css'

function scrollActiveSidebarItem() {
  const sidebar = document.querySelector<HTMLElement>('.VPSidebar')
  const activeItem = sidebar?.querySelector<HTMLElement>(
    '.VPSidebarItem.is-active'
  )

  if (!sidebar || !activeItem) return

  const sidebarRect = sidebar.getBoundingClientRect()
  const activeRect = activeItem.getBoundingClientRect()
  const visibleTop = sidebarRect.top + 80
  const visibleBottom = sidebarRect.bottom - 48

  if (activeRect.top >= visibleTop && activeRect.bottom <= visibleBottom) return

  const targetTop =
    sidebar.scrollTop +
    activeRect.top -
    sidebarRect.top -
    (sidebar.clientHeight - activeRect.height) / 2

  sidebar.scrollTo({ top: Math.max(0, targetTop), behavior: 'auto' })
}

function scheduleSidebarScroll() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(scrollActiveSidebarItem)
  })
}

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ app, router, siteData }) {
    app.component('BookLanding', BookLanding)

    if (typeof window !== 'undefined') {
      const previousAfterRouteChange = router.onAfterRouteChange

      router.onAfterRouteChange = async (to) => {
        await previousAfterRouteChange?.(to)
        scheduleSidebarScroll()
      }

      if (document.readyState === 'complete') {
        scheduleSidebarScroll()
      } else {
        window.addEventListener('load', scheduleSidebarScroll, { once: true })
      }
    }
  }
} satisfies Theme
