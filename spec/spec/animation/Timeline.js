/* globals describe, expect, it, beforeEach, afterEach, spyOn, container, jasmine */

import {
  Timeline,
  SVG,
  Runner,
  Spring,
  Animator,
  Queue,
  Rect
} from '../../../src/main.js'
import { getWindow } from '../../../src/utils/window.js'

const { createSpy, any } = jasmine

describe('Timeline.js', () => {
  beforeEach(() => {
    jasmine.RequestAnimationFrame.install(getWindow())
    Animator.timeouts = new Queue()
    Animator.frames = new Queue()
    Animator.immediates = new Queue()
    Animator.nextDraw = null
  })

  afterEach(() => {
    getWindow().cancelAnimationFrame(Animator.nextDraw)
    jasmine.RequestAnimationFrame.uninstall(getWindow())
  })

  describe('()', () => {
    it('creates a new Timeline with a default timesource', () => {
      const timeline = new Timeline()
      expect(timeline.source()).toEqual(any(Function))
    })

    it('creates a new Timeline with the passed timesource', () => {
      const source = createSpy()
      const timeline = new Timeline(source)
      expect(timeline.source()).toBe(source)
    })
  })

  describe('schedule()', () => {
    it('schedules a runner at the start of the queue with a default delay of 0', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000)
      timeline.schedule(runner)
      expect(timeline._runners[0].start).toEqual(0)
    })

    it('sets a reference of the timeline to the runner', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000)
      timeline.schedule(runner)
      expect(runner.timeline()).toBe(timeline)
    })

    it('schedules after when no when is past', () => {
      const timeline = new Timeline().schedule(new Runner(1000))
      const runner = new Runner(1000)
      timeline.schedule(runner)
      expect(timeline._runners[1].start).toBe(1000)
    })

    it('schedules after when when is last', () => {
      const timeline = new Timeline().schedule(new Runner(1000))
      const runner = new Runner(1000)
      timeline.schedule(runner, 0, 'last')
      expect(timeline._runners[1].start).toBe(1000)
    })

    it('schedules after when when is after', () => {
      const timeline = new Timeline().schedule(new Runner(1000))
      const runner = new Runner(1000)
      timeline.schedule(runner, 0, 'after')
      expect(timeline._runners[1].start).toBe(1000)
    })

    it('starts the animation right away when there is no runner to schedule after and when is after', () => {
      const timeline = new Timeline().time(100)
      const runner = new Runner(1000)
      timeline.schedule(runner, 0, 'after')
      expect(timeline._runners[0].start).toBe(100)
    })

    it('schedules with start of the last runner when when is with-last', () => {
      const timeline = new Timeline().schedule(new Runner(1000), 200)
      const runner = new Runner(1000)
      timeline.schedule(runner, 0, 'with-last')
      expect(timeline._runners[1].start).toBe(200)
    })

    it('starts the animation right away when there is no runner to schedule after and when is after', () => {
      const timeline = new Timeline().time(100)
      const runner = new Runner(1000)
      timeline.schedule(runner, 0, 'with-last')
      expect(timeline._runners[0].start).toBe(100)
    })

    it('respects passed delay', () => {
      const timeline = new Timeline().schedule(new Runner(1000), 1000)
      const runner = new Runner(1000)
      timeline.schedule(runner, 0, 'after')
      expect(timeline._runners[1].start).toBe(2000)
    })

    it('schedules the runner absolutely with absolute', () => {
      const timeline = new Timeline().schedule(new Runner(1000))
      const runner = new Runner(1000)
      timeline.schedule(runner, 0, 'absolute')
      expect(timeline._runners[1].start).toBe(0)
    })

    it('schedules the runner absolutely with start', () => {
      const timeline = new Timeline().schedule(new Runner(1000))
      const runner = new Runner(1000)
      timeline.schedule(runner, 0, 'start')
      expect(timeline._runners[1].start).toBe(0)
    })

    it('schedules the runner relatively to old start with relative', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000)
      timeline.schedule(runner, 100).schedule(runner, 100, 'relative')
      expect(timeline._runners[0].start).toBe(200)
    })

    it('schedules the runner as absolute if this runner was not on the timeline', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000)
      timeline.schedule(runner, 100, 'relative')
      expect(timeline._runners[0].start).toBe(100)
    })

    it('throws if when is not supported', () => {
      const timeline = new Timeline().schedule(new Runner(1000), 1000)
      const runner = new Runner(1000)
      expect(() => timeline.schedule(runner, 0, 'not supported')).toThrowError(
        'Invalid value for the "when" parameter'
      )
    })

    it('uses persist value of the runner of present', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000).persist(100)
      timeline.schedule(runner)
      expect(timeline._runners[0].persist).toBe(100)
    })
  })

  describe('unschedule()', () => {
    it('removes a runner from the timeline', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000)
      timeline.schedule(runner).unschedule(runner)
      expect(runner.timeline()).toBe(null)
      expect(timeline._runners).toEqual([])
    })
  })

  describe('getRunnerInfoById()', () => {
    it('gets a runner by its id from the timeline', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000)
      expect(
        timeline.schedule(runner).getRunnerInfoById(runner.id).runner
      ).toBe(runner)
    })

    it('returns null of runner not found', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000)
      expect(timeline.getRunnerInfoById(runner.id)).toBe(null)
    })
  })

  describe('getLastRunnerInfo()', () => {
    it('gets a runner by its id from the timeline', () => {
      const timeline = new Timeline().schedule(new Runner(1000))
      const runner = new Runner(1000)
      expect(timeline.schedule(runner).getLastRunnerInfo().runner).toBe(runner)
    })
  })

  describe('getEndTime()', () => {
    it('returns the end time of the runner which started last', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000)
      const runner2 = new Runner(100)
      timeline.schedule(runner).schedule(runner2, 500, 'start')
      expect(timeline.getEndTime()).toBe(600)
    })

    it('returns the timeline time if no runner is scheduled', () => {
      const timeline = new Timeline().time(100)
      expect(timeline.getEndTime()).toBe(100)
    })
  })

  describe('getEndTimeOfTimeline', () => {
    it('returns 0 if no runners are scheduled', () => {
      const timeline = new Timeline()
      const endTime = timeline.getEndTimeOfTimeline()
      expect(endTime).toEqual(0)
    })

    it('returns the time all runners are finished', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000)
      const runner2 = new Runner(100)
      timeline.schedule(runner).schedule(runner2, 500, 'start')
      expect(timeline.getEndTimeOfTimeline()).toBe(1000)
    })
  })

  describe('finish - issue #964', () => {
    it('settles controller runners at their targets', () => {
      const timeline = new Timeline(() => 0)
      const finished = createSpy('finished')
      const rect = new Rect().x(0)
      const runner = new Runner(new Spring())
        .element(rect)
        .timeline(timeline)
        .x(100)
        .schedule(0, 'absolute')

      timeline.on('finished', finished)
      timeline.finish()

      expect(rect.x()).toBe(100)
      expect(runner.done).toBe(true)
      expect(timeline.active()).toBe(false)
      expect(finished).toHaveBeenCalledTimes(1)
    })

    it('lets the last scheduled runner win over an earlier controller', () => {
      const timeline = new Timeline(() => 0)
      const rect = new Rect().x(0)
      new Runner(new Spring())
        .element(rect)
        .timeline(timeline)
        .x(200)
        .schedule(0, 'absolute')
      new Runner(100)
        .ease('-')
        .element(rect)
        .timeline(timeline)
        .x(50)
        .schedule(1000, 'absolute')

      timeline.finish()

      expect(rect.x()).toBe(50)
    })

    it('lets the last scheduled controller win over an earlier runner', () => {
      const timeline = new Timeline(() => 0)
      const rect = new Rect().x(0)
      new Runner(100)
        .ease('-')
        .element(rect)
        .timeline(timeline)
        .x(50)
        .schedule(0, 'absolute')
      new Runner(new Spring())
        .element(rect)
        .timeline(timeline)
        .x(200)
        .schedule(1000, 'absolute')

      timeline.finish()

      expect(rect.x()).toBe(200)
    })

    it('leaves deactivated runners alone', () => {
      const timeline = new Timeline(() => 0)
      const rect = new Rect().x(0)
      const runner = new Runner(new Spring())
        .element(rect)
        .timeline(timeline)
        .x(100)
        .active(false)
        .schedule(0, 'absolute')

      timeline.finish()

      expect(rect.x()).toBe(0)
      expect(runner.done).toBe(false)
    })

    let canvas

    beforeEach(() => {
      canvas = SVG().addTo(container)
    })

    it('places all elements at the right position - single runner', () => {
      const timeline = new Timeline()

      const rect = canvas.rect(20, 20)
      rect.timeline(timeline)
      rect.animate().move(100, 200)

      timeline.finish()
      expect(rect.x()).toEqual(100)
      expect(rect.y()).toEqual(200)
    })

    it('places all elements at the right position - runner that finishes latest is in first position', () => {
      const timeline = new Timeline()

      const rect1 = canvas.rect(10, 10)
      rect1.timeline(timeline)

      const rect2 = canvas.rect(10, 10)
      rect2.timeline(timeline)

      const rect3 = canvas.rect(10, 10)
      rect3.timeline(timeline)

      rect1.animate(2000, 0, 'now').move(100, 200)
      rect2.animate(1000, 0, 'now').move(100, 200)
      rect3.animate(1000, 500, 'now').move(100, 200)

      timeline.finish()

      expect(rect1.x()).toEqual(100)
      expect(rect1.y()).toEqual(200)

      expect(rect2.x()).toEqual(100)
      expect(rect2.y()).toEqual(200)

      expect(rect3.x()).toEqual(100)
      expect(rect3.y()).toEqual(200)
    })

    it('places all elements at the right position - runner that finishes latest is in middle position', () => {
      const timeline = new Timeline()

      const rect1 = canvas.rect(10, 10)
      rect1.timeline(timeline)

      const rect2 = canvas.rect(10, 10)
      rect2.timeline(timeline)

      const rect3 = canvas.rect(10, 10)
      rect3.timeline(timeline)

      rect2.animate(1000, 0, 'now').move(100, 200)
      rect1.animate(2000, 0, 'now').move(100, 200)
      rect3.animate(1000, 500, 'now').move(100, 200)

      timeline.finish()

      expect(rect1.x()).toEqual(100)
      expect(rect1.y()).toEqual(200)

      expect(rect2.x()).toEqual(100)
      expect(rect2.y()).toEqual(200)

      expect(rect3.x()).toEqual(100)
      expect(rect3.y()).toEqual(200)
    })

    it('places all elements at the right position - runner that finishes latest is in last position', () => {
      const timeline = new Timeline()

      const rect1 = canvas.rect(10, 10)
      rect1.timeline(timeline)

      const rect2 = canvas.rect(10, 10)
      rect2.timeline(timeline)

      const rect3 = canvas.rect(10, 10)
      rect3.timeline(timeline)

      rect2.animate(1000, 0, 'now').move(100, 200)
      rect3.animate(1000, 500, 'now').move(100, 200)
      rect1.animate(2000, 0, 'now').move(100, 200)

      timeline.finish()

      expect(rect1.x()).toEqual(100)
      expect(rect1.y()).toEqual(200)

      expect(rect2.x()).toEqual(100)
      expect(rect2.y()).toEqual(200)

      expect(rect3.x()).toEqual(100)
      expect(rect3.y()).toEqual(200)
    })
  })

  describe('updateTime()', () => {
    it('sets the time to the current time', () => {
      const timeline = new Timeline(() => 200).play()
      expect(timeline._lastSourceTime).toBe(200)
    })
  })

  describe('stop()', () => {
    it('sets the time to 0 and pauses the timeline', () => {
      const timeline = new Timeline().time(100)
      expect(timeline.stop().time()).toBe(0)
      expect(timeline._paused).toBe(true)
    })
  })

  describe('speed()', () => {
    it('gets or sets the speed of the timeline', () => {
      const timeline = new Timeline().speed(2)
      expect(timeline.speed()).toBe(2)
    })
  })

  describe('reverse()', () => {
    it('reverses the timeline with no parameter given', () => {
      const timeline = new Timeline().speed(2)
      const spy = spyOn(timeline, 'speed').and.callThrough()
      timeline.reverse()
      expect(spy).toHaveBeenCalledWith(-2)
      timeline.reverse()
      expect(spy).toHaveBeenCalledWith(2)
    })

    it('reverses the timeline when true was passed', () => {
      const timeline = new Timeline().speed(2)
      const spy = spyOn(timeline, 'speed').and.callThrough()
      timeline.reverse(true)
      expect(spy).toHaveBeenCalledWith(-2)
    })

    it('plays normal direction when false was passed', () => {
      const timeline = new Timeline().speed(-2)
      const spy = spyOn(timeline, 'speed').and.callThrough()
      timeline.reverse(false)
      expect(spy).toHaveBeenCalledWith(2)
    })
  })

  describe('seek()', () => {
    it('seeks the time by a given delta', () => {
      const timeline = new Timeline().time(100).seek(200)
      expect(timeline.time()).toBe(300)
    })
  })

  describe('time()', () => {
    it('gets and sets the current time of the timeline', () => {
      const timeline = new Timeline().time(100)
      expect(timeline.time()).toBe(100)
    })
  })

  describe('persist()', () => {
    it('gets and sets the persist property of the timeline', () => {
      const timeline = new Timeline().persist(true)
      expect(timeline.persist()).toBe(true)
    })
  })

  describe('source()', () => {
    it('gets or sets the time source of the timeline', () => {
      const source = () => 200
      const timeline = new Timeline().source(source)
      expect(timeline.source()).toBe(source)
    })
  })

  describe('terminate()', () => {
    it('retires the runners it drops', () => {
      const timeline = new Timeline(() => 0)
      const runner = new Runner(100)
      timeline.schedule(runner, 0, 'absolute')

      timeline.terminate()

      expect(runner._retired).toBe(true)
    })

    it('does not pile up transform runners across terminate cycles', () => {
      const element = new Rect()

      for (let i = 0; i < 3; ++i) {
        const timeline = element
          .timeline()
          .source(() => 0)
          .persist(true)
        element
          .animate(100, 0, 'absolute')
          .ease('-')
          .transform({ translate: [10, 0] }, true)
        timeline.time(100)
        timeline.time(200)
        jasmine.RequestAnimationFrame.tick(1)
        timeline.terminate()
      }

      // terminate has to retire what it drops, or nothing may ever fold these
      // into the baseline again and every later frame recomposes over them
      expect(element._transformationRunners.length()).toBe(2)
    })

    it('cancels the pending frame and can be reused', () => {
      const timeline = new Timeline()
      const oldRunner = new Runner(1000)
      const finished = createSpy('finished')

      timeline.on('finished', finished).schedule(oldRunner).play()
      expect(timeline.active()).toBe(true)

      timeline.terminate()
      jasmine.RequestAnimationFrame.tick(16)

      expect(timeline.active()).toBe(false)
      expect(oldRunner.time()).toBe(0)
      expect(finished).not.toHaveBeenCalled()

      const newRunner = new Runner(1000)
      timeline.schedule(newRunner).play()
      jasmine.RequestAnimationFrame.tick(16)
      expect(newRunner.time()).toBe(16)
    })

    it('keeps stepping when a callback unschedules a later runner', () => {
      const timeline = new Timeline(() => 0)
      const first = new Runner(10)
      const second = new Runner(20)
      const third = new Runner(20)

      first.on('finished', () => second.unschedule())
      timeline
        .schedule(first, 0, 'absolute')
        .schedule(second, 0, 'absolute')
        .schedule(third, 0, 'absolute')

      expect(() => timeline.time(11)).not.toThrow()
      expect(second.time()).toBe(0)
      expect(third.time()).toBe(11)
    })

    it('keeps stepping when a callback unschedules an earlier runner', () => {
      const timeline = new Timeline(() => 0)
      // first is still running when second retires, so removing it here
      // shifts every later runner down a slot
      const first = new Runner(100)
      const second = new Runner(20)
      const third = new Runner(20)

      second.on('finished', () => first.unschedule())
      timeline
        .schedule(first, 0, 'absolute')
        .schedule(second, 0, 'absolute')
        .schedule(third, 0, 'absolute')

      expect(() => timeline.time(21)).not.toThrow()
      expect(third.time()).toBe(21)
    })

    it('keeps resetting when a callback unschedules runners on a back seek', () => {
      // persist before scheduling, so the runners survive the forward seek
      const timeline = new Timeline(() => 0).persist(true)
      const first = new Runner(10)
      const second = new Runner(10)
      const third = new Runner(10)

      timeline
        .schedule(first, 1000, 'absolute')
        .schedule(second, 1000, 'absolute')
        .schedule(third, 1000, 'absolute')
      timeline.time(2000)

      // reset runs backwards, so this empties the schedule ahead of the index
      third.on('step', () => {
        first.unschedule()
        second.unschedule()
      })

      expect(() => timeline.time(0)).not.toThrow()
    })

    it('leaves untouched runners alone when a callback terminates mid-step', () => {
      const timeline = new Timeline(() => 0).persist(true)
      const first = new Rect().x(0)
      const second = new Rect().x(0)
      const firstRunner = new Runner(1000).ease('-').element(first).x(100)
      const secondRunner = new Runner(1000).ease('-').element(second).x(100)

      timeline
        .schedule(firstRunner, 0, 'absolute')
        .schedule(secondRunner, 0, 'absolute')
      timeline.time(500)
      expect(second.x()).toBe(50)

      // terminating drops the schedule, so the runners behind this one must
      // not be reset by the step that is already walking a copy of it
      firstRunner.on('step', () => timeline.terminate())
      timeline.time(600)

      expect(second.x()).toBe(50)
    })

    it('skips a runner a callback rescheduled out from under the step', () => {
      const timeline = new Timeline(() => 0)
      const first = new Runner(10)
      const second = new Runner(100)

      first.on('finished', () => timeline.schedule(second, 500, 'absolute'))
      timeline
        .schedule(first, 0, 'absolute')
        .schedule(second, 0, 'absolute')
        .play()

      timeline.time(11)

      // second now starts at 500, so the entry we copied is stale and it must
      // not be stepped off the start time it used to have
      expect(timeline.getRunnerInfoById(second.id).start).toBe(500)
      expect(second.time()).toBe(0)
      expect(timeline.active()).toBe(true)
    })

    it('preserves a runner rescheduled by its own finished callback', () => {
      const timeline = new Timeline(() => 0)
      const runner = new Runner(10)

      runner.on('finished', () => timeline.schedule(runner, 500, 'absolute'))
      timeline.schedule(runner, 0, 'absolute').play()

      timeline.time(11)

      expect(timeline.getRunnerInfoById(runner.id).start).toBe(500)
      expect(runner.timeline()).toBe(timeline)
      expect(timeline.active()).toBe(true)
    })

    it('stops an in-flight step when a runner callback terminates it', () => {
      const timeline = new Timeline(() => 0)
      const first = new Runner(10)
      const second = new Runner(20)
      const finished = createSpy('finished')

      first.on('finished', () => timeline.terminate())
      timeline
        .on('finished', finished)
        .schedule(first, 0, 'absolute')
        .schedule(second, 0, 'absolute')

      expect(() => timeline.time(11)).not.toThrow()
      expect(timeline.schedule()).toEqual([])
      expect(second.time()).toBe(0)
      expect(finished).not.toHaveBeenCalled()
    })

    it('stops finish() when a runner callback terminates it', () => {
      const timeline = new Timeline(() => 0)
      const finished = createSpy('finished')
      const runner = new Runner(new Spring()).timeline(timeline).x(100)

      runner.element(new Rect()).schedule(0, 'absolute')
      runner.on('finished', () => timeline.terminate())
      timeline.on('finished', finished)

      timeline.finish()

      expect(finished).not.toHaveBeenCalled()
    })
  })

  describe('_stepFn', () => {
    it('does a step in the timeline and runs all runners', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000)
      timeline.schedule(runner).play() // we have to play because its synchronous here
      jasmine.RequestAnimationFrame.tick(16)
      expect(runner.time()).toBe(16)
    })

    it('doenst run runners which start later', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000)
      timeline.schedule(runner, 100).play() // we have to play because its synchronous here
      jasmine.RequestAnimationFrame.tick(16)
      expect(runner.time()).toBe(0)
    })

    it('reset runner if timeline was seeked backwards', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000)
      timeline.schedule(runner)
      const spy = spyOn(runner, 'reset').and.callThrough()
      jasmine.RequestAnimationFrame.tick(1000)
      timeline.seek(-1000)
      expect(runner.time()).toBe(0)
      expect(spy).toHaveBeenCalled()
    })

    it('does not run runners if they are not active', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000).active(false)
      timeline.schedule(runner).play() // we have to play because its synchronous here
      jasmine.RequestAnimationFrame.tick(16)
      expect(runner.time()).toBe(0)
    })

    it('unschedules runner if its finished', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000)
      timeline.schedule(runner).play() // we have to play because its synchronous here
      jasmine.RequestAnimationFrame.tick(1000)
      jasmine.RequestAnimationFrame.tick(1)
      expect(runner.time()).toBe(1000)
      expect(timeline.getRunnerInfoById(runner.id)).toBe(null)
    })

    it('does not unschedule if runner is persistent forever', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000).persist(true)
      timeline.schedule(runner).play() // we have to play because its synchronous here
      jasmine.RequestAnimationFrame.tick(1000)
      jasmine.RequestAnimationFrame.tick(1)
      expect(runner.time()).toBe(1000)
      expect(timeline.getRunnerInfoById(runner.id)).not.toBe(null)
    })

    it('does not unschedule if runner is persistent for a certain time', () => {
      const timeline = new Timeline()
      const runner = new Runner(1000).persist(100)
      timeline.schedule(runner).play() // we have to play because its synchronous here
      jasmine.RequestAnimationFrame.tick(1000)
      jasmine.RequestAnimationFrame.tick(1)
      expect(runner.time()).toBe(1000)
      expect(timeline.getRunnerInfoById(runner.id)).not.toBe(null)
    })

    it('fires finish if no runners left', () => {
      const spy = createSpy()
      const timeline = new Timeline().on('finished', spy)
      const runner = new Runner(1000)
      spy.calls.reset()
      timeline.schedule(runner).play() // we have to play because its synchronous here
      jasmine.RequestAnimationFrame.tick(1000)
      jasmine.RequestAnimationFrame.tick(1)
      expect(spy).toHaveBeenCalled()
    })

    it('continues if there are still runners left from us when going back in time', () => {
      const spy = createSpy()
      const timeline = new Timeline()
        .on('finished', spy)
        .time(1200)
        .reverse(true)
      const runner = new Runner(1000)
      spy.calls.reset()
      timeline.schedule(runner, 0).play() // we have to play because its synchronous here
      jasmine.RequestAnimationFrame.tick(1)
      expect(spy).not.toHaveBeenCalled()
    })

    it('finishes if time is backwards and 0', () => {
      const spy = createSpy()
      const timeline = new Timeline().on('finished', spy).reverse(true)
      const runner = new Runner(1000)
      spy.calls.reset()
      timeline.schedule(runner, 0).play() // we have to play because its synchronous here
      jasmine.RequestAnimationFrame.tick(1)
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('Element', () => {
    describe('timeline()', () => {
      it('sets and gets the timeline of the element', () => {
        const timeline = new Timeline()
        const rect = new Rect().timeline(timeline)
        expect(rect.timeline()).toBe(timeline)
      })

      it('creates a timeline on the fly when getting it', () => {
        expect(new Rect().timeline()).toEqual(any(Timeline))
      })
    })
  })
})
