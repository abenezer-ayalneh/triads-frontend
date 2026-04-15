import { HttpClient, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { Observable } from 'rxjs'

export interface DailyScheduleRow {
	id: number
	puzzleDate: string
	triadGroupId: number
}

@Injectable({
	providedIn: 'root',
})
export class DailyScheduleAdminApi {
	private readonly httpClient = inject(HttpClient)

	getSchedules(offset = 0, limit = 50): Observable<DailyScheduleRow[]> {
		const params = new HttpParams().set('offset', String(offset)).set('limit', String(limit))
		return this.httpClient.get<DailyScheduleRow[]>('triads/daily/schedule', { params })
	}

	createSchedule(puzzleDate: string, triadGroupId: number): Observable<DailyScheduleRow> {
		return this.httpClient.post<DailyScheduleRow>('triads/daily/schedule', { puzzleDate, triadGroupId })
	}

	deleteSchedule(id: number): Observable<void> {
		return this.httpClient.delete<void>(`triads/daily/schedule/${id}`)
	}
}
