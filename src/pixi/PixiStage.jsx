import { useEffect, useRef } from 'react'
import { Application } from 'pixi.js'
import gsap from 'gsap'
import { ParallaxBackground } from './backgrounds/ParallaxBackground'
import { Character } from './characters/Character'
import { spawnParticleBurst } from './effects/ParticleBurst'
import { spawnConfetti, spawnPoof } from './effects/Confetti'
import { shakeStage } from './effects/screenShake'
import { spawnFlyingThings } from './effects/FlyingThings'
import { GamePhase } from '../game/constants/gameStates'

const INTRO_FLOURISH_COLORS = [0xfacc15, 0xa855f7, 0x60a5fa, 0x4ade80]
const MINIGAME_FLOURISH_COLORS = [0xf87171, 0xfb923c, 0xfacc15, 0xef4444]

export function PixiStage({ players, phase, shakeSeq = 0, flourishSeq = 0, compact = false }) {
  const hostRef = useRef(null)
  const appRef = useRef(null)
  const charactersRef = useRef(new Map())
  const prevReactionsRef = useRef(new Map())
  const playersRef = useRef(players)
  const phaseRef = useRef(phase)
  const shakeSeqRef = useRef(shakeSeq)
  const prevPhaseRef = useRef(phase)
  const compactRef = useRef(compact)
  const flourishSeqRef = useRef(flourishSeq)

  useEffect(() => {
    playersRef.current = players
  }, [players])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    compactRef.current = compact
    layoutCharacters()
  }, [compact])

  function layoutCharacters() {
    const app = appRef.current
    if (!app) return
    const width = app.screen.width
    const height = app.screen.height
    const currentPlayers = playersRef.current
    const count = currentPlayers.length
    const spacing = width / (count + 1)
    const isCompact = compactRef.current
    const isDeathGame = phaseRef.current === GamePhase.DEATH_GAME
    const baseScale = Math.min(1.3, Math.max(0.75, height / 620))
    const scale = isCompact ? baseScale * 0.62 : baseScale
    const yFraction = isDeathGame ? 0.8 : isCompact ? 0.855 : 0.64
    const targetY = height * yFraction

    currentPlayers.forEach((player, i) => {
      const x = spacing * (count - i)
      let character = charactersRef.current.get(player.id)
      if (!character) {
        character = new Character({
          scale,
          variantIndex: player.variantIndex,
          colorIndex: player.colorIndex,
          name: player.name,
        })
        character.container.x = x
        character.container.y = targetY
        app.stage.addChild(character.container)
        charactersRef.current.set(player.id, character)
      } else {
        if (character.variantIndex !== player.variantIndex) character.setVariant(player.variantIndex)
        if (character.colorIndex !== player.colorIndex) character.setColor(player.colorIndex)
        character.container.x = x
        character.moveTo(targetY)
        gsap.to(character.container.scale, { x: scale, y: scale, duration: 0.4, ease: 'power2.out' })
      }
    })

    for (const [id, character] of charactersRef.current) {
      if (!currentPlayers.find((p) => p.id === id)) {
        character.destroy()
        charactersRef.current.delete(id)
      }
    }
  }

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

        const background = new ParallaxBackground(app.screen.width, app.screen.height)
        app.stage.addChild(background.container)
        app.__background = background

        app.__ready = true
        layoutCharacters()

        const resizeObserver = new ResizeObserver(() => {
          app.resize()
          layoutCharacters()
        })
        resizeObserver.observe(hostRef.current)
        app.__resizeObserver = resizeObserver
      })

    return () => {
      cancelled = true
      if (appRef.current) {
        appRef.current.__resizeObserver?.disconnect()
        appRef.current.__background?.destroy()
        charactersRef.current.forEach((c) => c.killTweens())
        charactersRef.current.clear()
        appRef.current.destroy(false, { children: true })
        appRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const app = appRef.current
    if (!app || !app.__ready) return
    layoutCharacters()

    const isMinigame = phaseRef.current === GamePhase.DEATH_GAME

    if (phaseRef.current === GamePhase.FINAL) return

    players.forEach((player) => {
      const character = charactersRef.current.get(player.id)
      if (!character) return
      const prev = prevReactionsRef.current.get(player.id)
      if (prev === player.reaction) return
      prevReactionsRef.current.set(player.id, player.reaction)
      character.setMood(player.reaction)

      if (player.reaction === 'celebrate') {
        if (isMinigame) {
          spawnConfetti(app.stage, character.container.x, character.container.y - 80, 50)
        } else {
          spawnParticleBurst(app.stage, character.container.x, character.container.y - 60)
        }
      } else if (player.reaction === 'sad' && isMinigame) {
        spawnPoof(app.stage, character.container.x, character.container.y - 30)
      }
    })
  }, [players])

  useEffect(() => {
    const app = appRef.current
    if (!app || !app.__ready) return
    if (phase === GamePhase.FINAL && prevPhaseRef.current !== GamePhase.FINAL) {
      spawnConfetti(app.stage, app.screen.width / 2, app.screen.height * 0.3, 70)
      players.forEach((player) => {
        const character = charactersRef.current.get(player.id)
        if (!character) return
        character.setMood(player.reaction, { final: true })
        if (player.reaction === 'celebrate') {
          spawnConfetti(app.stage, character.container.x, character.container.y - 80, 40)
        }
      })
    }
    prevPhaseRef.current = phase
  }, [phase])

  useEffect(() => {
    const app = appRef.current
    if (!app || !app.__ready) return
    if (shakeSeqRef.current === shakeSeq) return
    shakeSeqRef.current = shakeSeq
    shakeStage(app.stage)
  }, [shakeSeq])

  useEffect(() => {
    const app = appRef.current
    if (!app || !app.__ready) return
    if (flourishSeqRef.current === flourishSeq) return
    flourishSeqRef.current = flourishSeq
    const colors = phase === GamePhase.DEATH_GAME ? MINIGAME_FLOURISH_COLORS : INTRO_FLOURISH_COLORS
    spawnFlyingThings(app, colors, phase === GamePhase.DEATH_GAME ? 8 : 6)
  }, [flourishSeq, phase])

  return <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />
}
