import { useEffect, useCallback, useState } from 'react'
import { inView, smoothScroll, getWindow, getRect } from '@reactour/utils'
import { StepType } from './types'

let initialState = {
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  windowWidth: 0,
  windowHeight: 0,
}

export function useSizes(
  step: StepType,
  scrollOptions: ScrollIntoViewOptions & { inViewThreshold?: number } = {
    block: 'center',
    behavior: 'smooth',
    inViewThreshold: 0,
  }
) {
  const [transition, setTransition] = useState(false)
  const [observing, setObserving] = useState(false)
  const [refresher, setRefresher] = useState(null as any)
  const target = document.querySelector(step?.selector)
  const [dimensions, setdDimensions] = useState(initialState)

  const handleResize = useCallback(() => {
    if (!target) return
    setdDimensions(getHighlightedRect(target, step?.highlightedSelectors))
  }, [target])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [target, refresher])

  useEffect(() => {
    const isInView = inView({
      ...dimensions,
      threshold: scrollOptions.inViewThreshold,
    })
    if (!isInView) {
      setTransition(true)
      smoothScroll(target, scrollOptions)
        .then(() => {
          if (!observing) setRefresher(Date.now())
        })
        .finally(() => {
          setTransition(false)
        })
    }
  }, [dimensions])

  function observableRefresher() {
    setObserving(true)
    setdDimensions(getHighlightedRect(target, step?.highlightedSelectors))
    setObserving(false)
  }

  return { sizes: dimensions, transition, target, observableRefresher }
}

function getHighlightedRect(
  node: Element | null,
  highlightedSelectors: string[] = [],
  bypassElem = true
) {
  const { w: windowWidth, h: windowHeight } = getWindow()
  if (!highlightedSelectors) {
    return {
      ...getRect(node),
      windowWidth,
      windowHeight,
    }
  }

  let attrs = getRect(node)
  let altAttrs = {
    bottom: 0,
    height: 0,
    left: windowWidth,
    right: 0,
    top: windowHeight,
    width: 0,
  }

  for (const selector of highlightedSelectors) {
    const element = document.querySelector(selector) as HTMLElement
    if (
      !element ||
      element.style.display === 'none' ||
      element.style.visibility === 'hidden'
    ) {
      continue
    }

    const rect = getRect(element)

    if (bypassElem) {
      if (rect.top < altAttrs.top) {
        altAttrs.top = rect.top
      }

      if (rect.right > altAttrs.right) {
        altAttrs.right = rect.right
      }

      if (rect.bottom > altAttrs.bottom) {
        altAttrs.bottom = rect.bottom
      }

      if (rect.left < altAttrs.left) {
        altAttrs.left = rect.left
      }

      altAttrs.width = altAttrs.right - altAttrs.left
      altAttrs.height = altAttrs.bottom - altAttrs.top
    } else {
      if (rect.top < attrs.top) {
        attrs.top = rect.top
      }

      if (rect.right > attrs.right) {
        attrs.right = rect.right
      }

      if (rect.bottom > attrs.bottom) {
        attrs.bottom = rect.bottom
      }

      if (rect.left < attrs.left) {
        attrs.left = rect.left
      }

      attrs.width = attrs.right - attrs.left
      attrs.height = attrs.bottom - attrs.top
    }
  }

  const bypassable = bypassElem
    ? altAttrs.width > 0 && altAttrs.height > 0
    : false

  return {
    left: (bypassable ? altAttrs : attrs).left,
    top: (bypassable ? altAttrs : attrs).top,
    right: (bypassable ? altAttrs : attrs).right,
    bottom: (bypassable ? altAttrs : attrs).bottom,
    width: (bypassable ? altAttrs : attrs).width,
    height: (bypassable ? altAttrs : attrs).height,
    windowWidth,
    windowHeight,
  }
}
