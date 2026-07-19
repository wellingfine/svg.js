import {
  Animator,
  Matrix,
  PointArray,
  Rect,
  SVG,
  Svg,
  Timeline,
  makeMorphable,
  off,
  on,
  registerMorphableType,
  registerWindow
} from '@svgdotjs/svg.js'

declare module '@svgdotjs/svg.js' {
  interface SVGEventMap {
    'svgjs:test': CustomEvent<{ value: number }>
  }
}

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
type Expect<T extends true> = T

registerWindow(window, document)

const animationClock: Performance | DateConstructor = Animator.timer()
animationClock.now()

const drawing: Svg = SVG()
const rect: Rect = drawing.rect(12, 34)
rect.move(5, 6).fill('#f06')
rect.css('fontSize', '12px')
rect.css('font-size', null)
rect.css({ strokeWidth: '2px', fill: null })
const fontSize: string = rect.css('fontSize')

rect.on('dragover', (event) => {
  type DragEventIsInferred = Expect<Equal<typeof event, DragEvent>>
  const inferred: DragEventIsInferred = true
  event.dataTransfer
  void inferred
})
rect.on('click', (event) => {
  type PointerEventIsInferred = Expect<Equal<typeof event, PointerEvent>>
  const inferred: PointerEventIsInferred = true
  event.pointerId
  void inferred
})
rect.on('svgjs:test', (event) => {
  type CustomEventIsInferred = Expect<
    Equal<typeof event, CustomEvent<{ value: number }>>
  >
  const inferred: CustomEventIsInferred = true
  event.detail.value
  void inferred
})
rect.on('click.menu', (event) => {
  type NamespacedEventIsGeneric = Expect<Equal<typeof event, Event>>
  const inferred: NamespacedEventIsGeneric = true
  void inferred
})
rect.on(['click', 'dragover'], (event) => {
  type EventArrayIsGeneric = Expect<Equal<typeof event, Event>>
  const inferred: EventArrayIsGeneric = true
  void inferred
})
rect.off('dragover', (event) => {
  type DragEventIsInferred = Expect<Equal<typeof event, DragEvent>>
  const inferred: DragEventIsInferred = true
  void inferred
})

on(
  rect,
  'dragover',
  (event) => {
    type GlobalDragEventIsInferred = Expect<Equal<typeof event, DragEvent>>
    const inferred: GlobalDragEventIsInferred = true
    void inferred
  },
  undefined,
  true
)
on(window, 'hashchange', (event) => {
  type WindowEventIsInferred = Expect<Equal<typeof event, HashChangeEvent>>
  const inferred: WindowEventIsInferred = true
  void inferred
})
on(new AbortController().signal, 'abort', (event) => {
  type NativeEventTargetFallsBackToEvent = Expect<Equal<typeof event, Event>>
  const inferred: NativeEventTargetFallsBackToEvent = true
  void inferred
})
rect.off('click', 1)
off(rect, 'click', 1, true)

const timeline = new Timeline()
timeline.reverse().terminate()

new PointArray([[0, 0]]).transformO(new Matrix())
drawing.gradient('linear').stop(0, '#000')

class Pair {
  constructor(public value: number[] = [0, 0]) {}

  init(value: number[]) {
    this.value = value
    return this
  }

  toArray() {
    return this.value
  }
}

registerMorphableType(Pair)
makeMorphable()
