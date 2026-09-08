import { useEffect, useRef } from 'react'
import { Application } from 'pixi.js'
import { Character } from './characters/Character'

export function CharacterPreview({ variantIndex, colorIndex, name, scale = 0.78 }) {
  const hostRef = useRef(null)
  const appRef = useRef(null)
  const characterRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const app = new Application()
    app
      .init({
        resizeTo: hostRef.current,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      })
      .then(() => {
        if (cancelled || !hostRef.current) {
          app.destroy(false, { children: true })
          return
        }
        hostRef.current.appendChild(app.canvas)
        appRef.current = app
        const character = new Character({ scale, variantIndex, colorIndex, name })
        character.container.x = app.screen.width / 2
        character.container.y = app.screen.height * 0.6
        app.stage.addChild(character.container)
        characterRef.current = character
      })

    return () => {
      cancelled = true
      if (appRef.current) {
        characterRef.current?.killTweens()
        characterRef.current = null
        appRef.current.destroy(false, { children: true })
        appRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (characterRef.current && characterRef.current.variantIndex !== variantIndex) {
      characterRef.current.setVariant(variantIndex)
    }
  }, [variantIndex])

  useEffect(() => {
    if (characterRef.current && characterRef.current.colorIndex !== colorIndex) {
      characterRef.current.setColor(colorIndex)
    }
  }, [colorIndex])

  return <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />
}
