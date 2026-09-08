import { Container, Graphics, Text } from 'pixi.js'
import gsap from 'gsap'
import { getCharacterVariant } from '../../game/data/characterVariants'
import { getPlayerColor } from '../../game/data/playerColors'

const MOOD_COLORS = {
  idle: 0xffffff,
  correct: 0x4ade80,
  wrong: 0xf87171,
  celebrate: 0x4ade80,
  shock: 0xfbbf24,
  sad: 0xf87171,
}

const HEAD_X = 0
const HEAD_Y = -55
const HEAD_R = 42

function drawHairBack(g, hairStyle, hairColor) {
  if (hairStyle === 'bald') return
  if (hairStyle === 'curly') {
    const bumps = 7
    for (let i = 0; i < bumps; i++) {
      const angle = Math.PI + (Math.PI * i) / (bumps - 1)
      const bx = HEAD_X + Math.cos(angle) * HEAD_R * 0.95
      const by = HEAD_Y + Math.sin(angle) * HEAD_R * 0.95
      g.circle(bx, by, HEAD_R * 0.4).fill(hairColor)
    }
    return
  }
  if (hairStyle === 'afro') {
    g.circle(HEAD_X, HEAD_Y - HEAD_R * 0.35, HEAD_R * 1.25).fill(hairColor)
    return
  }
  if (hairStyle === 'mohawk') {
    g.ellipse(HEAD_X, HEAD_Y - HEAD_R * 0.55, HEAD_R * 0.65, HEAD_R * 0.55).fill(hairColor)
    g.ellipse(HEAD_X, HEAD_Y - HEAD_R * 1.15, HEAD_R * 0.22, HEAD_R * 0.5).fill(hairColor)
    return
  }
  if (hairStyle === 'side') {
    g.ellipse(HEAD_X - HEAD_R * 0.2, HEAD_Y - HEAD_R * 0.65, HEAD_R * 1.15, HEAD_R * 0.9).fill(hairColor)
    return
  }
  if (hairStyle === 'flat') {
    g.roundRect(HEAD_X - HEAD_R * 1.05, HEAD_Y - HEAD_R * 1.15, HEAD_R * 2.1, HEAD_R * 1.1, 14).fill(hairColor)
    return
  }
  g.ellipse(HEAD_X, HEAD_Y - HEAD_R * 0.65, HEAD_R * 1.1, HEAD_R * 0.85).fill(hairColor)
}

function drawHairFront(g, hairStyle, hairColor, accentColor) {
  if (hairStyle === 'ponytail') {
    g.ellipse(HEAD_X + HEAD_R * 0.85, HEAD_Y + HEAD_R * 0.1, HEAD_R * 0.3, HEAD_R * 0.58).fill(hairColor)
  } else if (hairStyle === 'bun') {
    g.circle(HEAD_X, HEAD_Y - HEAD_R * 1.05, HEAD_R * 0.34).fill(hairColor)
  } else if (hairStyle === 'headband') {
    g.roundRect(HEAD_X - HEAD_R * 0.95, HEAD_Y - HEAD_R * 0.45, HEAD_R * 1.9, HEAD_R * 0.32, 6).fill(accentColor)
  } else if (hairStyle === 'twintails') {
    g.ellipse(HEAD_X - HEAD_R * 0.95, HEAD_Y + HEAD_R * 0.15, HEAD_R * 0.28, HEAD_R * 0.55).fill(hairColor)
    g.ellipse(HEAD_X + HEAD_R * 0.95, HEAD_Y + HEAD_R * 0.15, HEAD_R * 0.28, HEAD_R * 0.55).fill(hairColor)
  } else if (hairStyle === 'braid') {
    for (let i = 0; i < 4; i++) {
      g.ellipse(HEAD_X, HEAD_Y + HEAD_R * (0.95 + i * 0.32), HEAD_R * 0.22, HEAD_R * 0.17).fill(hairColor)
    }
  }
}

export class Character {
  constructor({ scale = 1, variantIndex = 0, colorIndex = 0, name = '' } = {}) {
    this.variantIndex = variantIndex
    this.variant = getCharacterVariant(variantIndex)
    this.colorIndex = colorIndex
    this.color = getPlayerColor(colorIndex).hex
    this.currentMood = 'idle'
    this.container = new Container()
    this.container.scale.set(0)
    gsap.to(this.container.scale, { x: scale, y: scale, duration: 0.5, ease: 'back.out(2.2)' })

    this.shadow = new Graphics()
    this.shadow.ellipse(0, 92, 50, 14).fill({ color: 0x000000, alpha: 0.35 })
    this.art = new Graphics()
    this.face = new Graphics()
    this.nameTag = new Container()
    this.nameTagBg = new Graphics()
    this.nameTagText = new Text({
      text: name,
      resolution: 3,
      style: {
        fontFamily: 'Tajawal, Segoe UI, Tahoma, sans-serif',
        fontSize: 22,
        fontWeight: '700',
        fill: 0xffffff,
      },
    })
    this.nameTagText.anchor.set(0.5)
    this.nameTag.addChild(this.nameTagBg, this.nameTagText)
    this.nameTag.y = -142

    this.container.addChild(this.shadow, this.art, this.face, this.nameTag)

    this.idleTween = null
    this._draw('idle')
    this._layoutNameTag()
    this.playIdle()
  }

  _layoutNameTag() {
    const paddingX = 14
    const paddingY = 6
    const w = this.nameTagText.width + paddingX * 2
    const h = this.nameTagText.height + paddingY * 2
    this.nameTagBg.clear()
    this.nameTagBg
      .roundRect(-w / 2, -h / 2, w, h, h / 2)
      .fill({ color: 0x1b1035, alpha: 0.85 })
      .stroke({ width: 2.5, color: this.color })
  }

  _draw(mood) {
    this.currentMood = mood
    const outline = MOOD_COLORS[mood] ?? 0xffffff
    const { skin, hair, hairStyle, glasses } = this.variant

    this.art.clear()
    drawHairBack(this.art, hairStyle, hair)
    this.art
      .roundRect(-45, -20, 90, 110, 24)
      .fill({ color: this.color })
      .stroke({ width: 4, color: outline })
    this.art.circle(HEAD_X, HEAD_Y, HEAD_R).fill({ color: skin }).stroke({ width: 4, color: outline })
    drawHairFront(this.art, hairStyle, hair, this.color)

    const ink = 0x2b2019
    this.face.clear()
    if (mood === 'shock') {
      this.face.circle(-16, -58, 7).fill(0xffffff).stroke({ width: 2, color: ink })
      this.face.circle(16, -58, 7).fill(0xffffff).stroke({ width: 2, color: ink })
      this.face.circle(-16, -58, 3).fill(ink)
      this.face.circle(16, -58, 3).fill(ink)
      this.face.roundRect(-10, -38, 20, 14, 6).stroke({ width: 3, color: ink })
    } else if (mood === 'sad') {
      this.face.moveTo(-22, -62).lineTo(-8, -58).stroke({ width: 3, color: ink })
      this.face.moveTo(22, -62).lineTo(8, -58).stroke({ width: 3, color: ink })
      this.face.circle(-14, -56, 3.5).fill(ink)
      this.face.circle(14, -56, 3.5).fill(ink)
      this.face.moveTo(-12, -34).quadraticCurveTo(0, -44, 12, -34).stroke({ width: 3, color: ink })
    } else if (mood === 'celebrate' || mood === 'correct') {
      this.face.moveTo(-20, -60).quadraticCurveTo(-14, -54, -8, -60).stroke({ width: 3, color: ink })
      this.face.moveTo(20, -60).quadraticCurveTo(14, -54, 8, -60).stroke({ width: 3, color: ink })
      this.face.moveTo(-14, -36).quadraticCurveTo(0, -24, 14, -36).stroke({ width: 3, color: ink })
    } else {
      this.face.circle(-14, -58, 3.5).fill(ink)
      this.face.circle(14, -58, 3.5).fill(ink)
      this.face.moveTo(-12, -36).lineTo(12, -36).stroke({ width: 3, color: ink })
    }

    if (glasses) {
      this.face.circle(-15, -58, 9).stroke({ width: 2.5, color: ink })
      this.face.circle(15, -58, 9).stroke({ width: 2.5, color: ink })
      this.face.moveTo(-6, -58).lineTo(6, -58).stroke({ width: 2.5, color: ink })
    }
  }

  playIdle() {
    this._draw('idle')
    gsap.killTweensOf(this.container)
    this.container.rotation = 0
    this._startBounce()
  }

  _startBounce() {
    this.idleTween?.kill()
    this.idleTween = gsap.to(this.container, {
      y: '+=8',
      duration: 1.1,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })
  }

  moveTo(y, duration = 0.5) {
    if (Math.abs(this.container.y - y) < 0.5) return
    this.idleTween?.kill()
    gsap.killTweensOf(this.container)
    gsap.to(this.container, {
      y,
      duration,
      ease: 'power2.inOut',
      onComplete: () => this._startBounce(),
    })
  }

  playCorrect() {
    this.idleTween?.kill()
    this._draw('celebrate')
    gsap.killTweensOf(this.container)
    const tl = gsap.timeline({ onComplete: () => this.playIdle() })
    tl.to(this.container, { y: '-=40', duration: 0.22, ease: 'power2.out' })
      .to(this.container, { y: '+=40', duration: 0.35, ease: 'bounce.out' })
      .to(this.container, { rotation: 0.08, duration: 0.15, yoyo: true, repeat: 3 }, '-=0.2')
  }

  playWrong() {
    this.idleTween?.kill()
    this._draw('sad')
    gsap.killTweensOf(this.container)
    const tl = gsap.timeline({ onComplete: () => this.playIdle() })
    tl.to(this.container, { x: '-=12', duration: 0.06 })
      .to(this.container, { x: '+=24', duration: 0.06 })
      .to(this.container, { x: '-=12', duration: 0.06 })
      .to(this.container, { alpha: 0.5, duration: 0.3 })
      .to(this.container, { alpha: 1, duration: 0.3 })
  }

  playShock() {
    this.idleTween?.kill()
    this._draw('shock')
    gsap.killTweensOf(this.container)
    const tl = gsap.timeline({ onComplete: () => this.playIdle() })
    tl.to(this.container.scale, { x: 1.15, y: 1.15, duration: 0.15, yoyo: true, repeat: 3 })
  }

  playVictoryDance() {
    this.idleTween?.kill()
    this._draw('celebrate')
    gsap.killTweensOf(this.container)
    this.container.rotation = 0
    this.idleTween = gsap
      .timeline({ repeat: -1 })
      .to(this.container, { y: '-=32', duration: 0.32, ease: 'power2.out' })
      .to(this.container, { y: '+=32', duration: 0.4, ease: 'bounce.out' })
      .to(this.container, { rotation: 0.16, duration: 0.22, ease: 'sine.inOut' }, '-=0.35')
      .to(this.container, { rotation: -0.16, duration: 0.44, ease: 'sine.inOut' })
      .to(this.container, { rotation: 0, duration: 0.22, ease: 'sine.inOut' })
  }

  playDejected() {
    this.idleTween?.kill()
    this._draw('sad')
    gsap.killTweensOf(this.container)
    gsap.to(this.container, { rotation: 0.09, alpha: 0.8, duration: 0.4, ease: 'power1.out' })
    this.idleTween = gsap.to(this.container, {
      y: '+=5',
      duration: 1.9,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })
  }

  setVariant(variantIndex) {
    if (variantIndex === this.variantIndex) return
    this.variantIndex = variantIndex
    this.variant = getCharacterVariant(variantIndex)
    this._draw(this.currentMood)
    this._layoutNameTag()
    gsap.killTweensOf(this.container.scale)
    const targetScale = this.container.scale.x || 1
    gsap.fromTo(
      this.container.scale,
      { x: targetScale * 0.7, y: targetScale * 1.2 },
      { x: targetScale, y: targetScale, duration: 0.35, ease: 'elastic.out(1, 0.5)' }
    )
  }

  setColor(colorIndex) {
    if (colorIndex === this.colorIndex) return
    this.colorIndex = colorIndex
    this.color = getPlayerColor(colorIndex).hex
    this._draw(this.currentMood)
    this._layoutNameTag()
  }

  setMood(reaction, { final = false } = {}) {
    if (final) {
      if (reaction === 'celebrate') this.playVictoryDance()
      else this.playDejected()
      return
    }
    if (reaction === 'celebrate') this.playCorrect()
    else if (reaction === 'sad') this.playWrong()
    else if (reaction === 'shock') this.playShock()
    else this.playIdle()
  }

  killTweens() {
    this.idleTween?.kill()
    gsap.killTweensOf(this.container)
  }

  destroy() {
    this.killTweens()
    this.container.destroy({ children: true })
  }
}
