import { TestBed } from '@angular/core/testing'

import { DailyRolloverService } from './daily-rollover.service'

describe('DailyRolloverService', () => {
	let service: DailyRolloverService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(DailyRolloverService)
		jasmine.clock().install()
	})

	afterEach(() => {
		jasmine.clock().uninstall()
	})

	it('calls onTimerRollover after crossing Eastern midnight', () => {
		const onTimerRollover = jasmine.createSpy('onTimerRollover')
		const onReentryRollover = jasmine.createSpy('onReentryRollover')
		// 2026-01-16T04:59:58.000Z is 11:59:58 PM in America/New_York (EST).
		jasmine.clock().mockDate(new Date('2026-01-16T04:59:58.000Z'))

		const stopWatcher = service.startEasternDayWatcher({ onTimerRollover, onReentryRollover })

		jasmine.clock().tick(1000)
		expect(onTimerRollover).not.toHaveBeenCalled()

		jasmine.clock().tick(1000)
		expect(onTimerRollover).toHaveBeenCalledTimes(1)
		expect(onReentryRollover).not.toHaveBeenCalled()

		stopWatcher()
	})

	it('does not call onTimerRollover after watcher cleanup', () => {
		const onTimerRollover = jasmine.createSpy('onTimerRollover')
		// 2026-01-16T04:59:58.000Z is 11:59:58 PM in America/New_York (EST).
		jasmine.clock().mockDate(new Date('2026-01-16T04:59:58.000Z'))

		const stopWatcher = service.startEasternDayWatcher({ onTimerRollover })
		stopWatcher()

		jasmine.clock().tick(5000)
		expect(onTimerRollover).not.toHaveBeenCalled()
	})

	it('calls onReentryRollover, not onTimerRollover, when page becomes visible after rollover', () => {
		const onTimerRollover = jasmine.createSpy('onTimerRollover')
		const onReentryRollover = jasmine.createSpy('onReentryRollover')
		// 2026-01-16T04:59:58.000Z is 11:59:58 PM in America/New_York (EST).
		jasmine.clock().mockDate(new Date('2026-01-16T04:59:58.000Z'))

		const stopWatcher = service.startEasternDayWatcher({ onTimerRollover, onReentryRollover })
		spyOnProperty(document, 'visibilityState', 'get').and.returnValue('visible')

		// Move clock past midnight without ticking timers, then trigger visibility change.
		jasmine.clock().mockDate(new Date('2026-01-16T05:00:02.000Z'))
		document.dispatchEvent(new Event('visibilitychange'))

		expect(onReentryRollover).toHaveBeenCalledTimes(1)
		expect(onTimerRollover).not.toHaveBeenCalled()
		stopWatcher()
	})

	it('still fires re-entry rollover even after the timer already advanced the day', () => {
		const onTimerRollover = jasmine.createSpy('onTimerRollover')
		const onReentryRollover = jasmine.createSpy('onReentryRollover')
		jasmine.clock().mockDate(new Date('2026-01-16T04:59:58.000Z'))

		const stopWatcher = service.startEasternDayWatcher({ onTimerRollover, onReentryRollover })
		spyOnProperty(document, 'visibilityState', 'get').and.returnValue('visible')

		// Live timer crosses midnight first.
		jasmine.clock().tick(2000)
		expect(onTimerRollover).toHaveBeenCalledTimes(1)

		// Returning to the tab afterwards must still trigger the re-entry path.
		document.dispatchEvent(new Event('visibilitychange'))
		expect(onReentryRollover).toHaveBeenCalledTimes(1)

		stopWatcher()
	})
})
