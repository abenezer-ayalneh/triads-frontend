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

	it('calls onDateChange after crossing Eastern midnight', () => {
		const onDateChange = jasmine.createSpy('onDateChange')
		// 2026-01-16T04:59:58.000Z is 11:59:58 PM in America/New_York (EST).
		jasmine.clock().mockDate(new Date('2026-01-16T04:59:58.000Z'))

		const stopWatcher = service.startEasternDayWatcher(onDateChange)

		jasmine.clock().tick(1000)
		expect(onDateChange).not.toHaveBeenCalled()

		jasmine.clock().tick(1000)
		expect(onDateChange).toHaveBeenCalledTimes(1)

		stopWatcher()
	})

	it('does not call onDateChange after watcher cleanup', () => {
		const onDateChange = jasmine.createSpy('onDateChange')
		// 2026-01-16T04:59:58.000Z is 11:59:58 PM in America/New_York (EST).
		jasmine.clock().mockDate(new Date('2026-01-16T04:59:58.000Z'))

		const stopWatcher = service.startEasternDayWatcher(onDateChange)
		stopWatcher()

		jasmine.clock().tick(5000)
		expect(onDateChange).not.toHaveBeenCalled()
	})

	it('rechecks rollover when page becomes visible', () => {
		const onDateChange = jasmine.createSpy('onDateChange')
		// 2026-01-16T04:59:58.000Z is 11:59:58 PM in America/New_York (EST).
		jasmine.clock().mockDate(new Date('2026-01-16T04:59:58.000Z'))

		const stopWatcher = service.startEasternDayWatcher(onDateChange)
		spyOnProperty(document, 'visibilityState', 'get').and.returnValue('visible')

		// Move clock past midnight without ticking timers, then trigger visibility change.
		jasmine.clock().mockDate(new Date('2026-01-16T05:00:02.000Z'))
		document.dispatchEvent(new Event('visibilitychange'))

		expect(onDateChange).toHaveBeenCalledTimes(1)
		stopWatcher()
	})
})
