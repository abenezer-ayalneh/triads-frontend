import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'

import { SnackbarService } from '../../shared/services/snackbar.service'
import { TriadManagementApi } from './services/triad-management-api'
import { TriadManagementPage } from './triad-management.page'

describe('TriadManagementPage', () => {
	let component: TriadManagementPage
	let fixture: ComponentFixture<TriadManagementPage>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TriadManagementPage, HttpClientTestingModule],
			providers: [TriadManagementApi, SnackbarService],
		}).compileComponents()

		fixture = TestBed.createComponent(TriadManagementPage)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
