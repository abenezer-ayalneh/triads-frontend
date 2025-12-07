import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'

import { TriadGroupFormData, TriadGroupResponse } from '../interfaces/triad-group.interface'
import { TriadManagementApi } from './triad-management-api'

describe('TriadManagementApi', () => {
	let service: TriadManagementApi
	let httpMock: HttpTestingController

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [TriadManagementApi],
		})
		service = TestBed.inject(TriadManagementApi)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})

	it('should fetch triad groups with pagination', () => {
		const mockResponse: TriadGroupResponse[] = []

		service.getTriadGroups(0, 20).subscribe((response) => {
			expect(response).toEqual(mockResponse)
		})

		const req = httpMock.expectOne(
			(request) => request.url.includes('triads/groups') && request.params.get('offset') === '0' && request.params.get('limit') === '20',
		)
		expect(req.request.method).toBe('GET')
		req.flush(mockResponse)
	})

	it('should fetch triad groups with search', () => {
		const mockResponse: TriadGroupResponse[] = []

		service.getTriadGroups(0, 20, 'test').subscribe((response) => {
			expect(response).toEqual(mockResponse)
		})

		const req = httpMock.expectOne((request) => request.url.includes('triads/groups') && request.params.get('search') === 'test')
		expect(req.request.method).toBe('GET')
		req.flush(mockResponse)
	})

	it('should create a triad group', () => {
		const mockData: TriadGroupFormData = {
			triad1: { keyword: 'TEST', cues: ['TEST1', 'TEST2', 'TEST3'] },
			triad2: { keyword: 'SAMPLE', cues: ['SAMPLE1', 'SAMPLE2', 'SAMPLE3'] },
			triad3: { keyword: 'DEMO', cues: ['DEMO1', 'DEMO2', 'DEMO3'] },
			triad4: { keyword: 'FINAL', cues: ['TEST', 'SAMPLE', 'DEMO'] },
		}
		const mockResponse = { id: 1, active: true, ...mockData }

		service.createTriadGroup(mockData).subscribe((response) => {
			expect(response).toEqual(mockResponse)
		})

		const req = httpMock.expectOne('triads/groups')
		expect(req.request.method).toBe('POST')
		expect(req.request.body).toEqual(mockData)
		req.flush(mockResponse)
	})

	it('should update a triad group', () => {
		const mockData: TriadGroupFormData = {
			triad1: { keyword: 'TEST', cues: ['TEST1', 'TEST2', 'TEST3'] },
			triad2: { keyword: 'SAMPLE', cues: ['SAMPLE1', 'SAMPLE2', 'SAMPLE3'] },
			triad3: { keyword: 'DEMO', cues: ['DEMO1', 'DEMO2', 'DEMO3'] },
			triad4: { keyword: 'FINAL', cues: ['TEST', 'SAMPLE', 'DEMO'] },
		}
		const mockResponse = { id: 1, active: true, ...mockData }

		service.updateTriadGroup(1, mockData).subscribe((response) => {
			expect(response).toEqual(mockResponse)
		})

		const req = httpMock.expectOne('triads/groups/1')
		expect(req.request.method).toBe('PATCH')
		expect(req.request.body).toEqual(mockData)
		req.flush(mockResponse)
	})

	it('should delete a triad group', () => {
		service.deleteTriadGroup(1).subscribe()

		const req = httpMock.expectOne('triads/groups/1')
		expect(req.request.method).toBe('DELETE')
		req.flush(null)
	})

	it('should toggle triad group status', () => {
		const mockResponse: TriadGroupResponse = {
			id: 1,
			active: false,
			triad1: { id: 10, keyword: 'TEST', cues: ['TEST1', 'TEST2', 'TEST3'], fullPhrases: [] },
			triad2: { id: 20, keyword: 'SAMPLE', cues: ['SAMPLE1', 'SAMPLE2', 'SAMPLE3'], fullPhrases: [] },
			triad3: { id: 30, keyword: 'DEMO', cues: ['DEMO1', 'DEMO2', 'DEMO3'], fullPhrases: [] },
			triad4: { id: 40, keyword: 'FINAL', cues: ['TEST', 'SAMPLE', 'DEMO'], fullPhrases: [] },
		}

		service.toggleTriadGroupStatus(1, false).subscribe((response) => {
			expect(response.active).toBe(false)
		})

		const req = httpMock.expectOne('triads/groups/1/status')
		expect(req.request.method).toBe('PATCH')
		expect(req.request.body).toEqual({ active: false })
		req.flush(mockResponse)
	})
})
