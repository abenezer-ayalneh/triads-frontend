import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core'
import { IonModal } from '@ionic/angular/standalone'
import { Subject, takeUntil } from 'rxjs'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'

import { DailyScheduleAdminApi, DailyScheduleRow } from '../../shared/services/daily-schedule-admin-api'
import { SnackbarService } from '../../shared/services/snackbar.service'
import { AddTriadGroupDialog } from './components/add-triad-group-dialog/add-triad-group-dialog'
import { DeleteConfirmationDialog } from './components/delete-confirmation-dialog/delete-confirmation-dialog'
import { EditTriadGroupDialog } from './components/edit-triad-group-dialog/edit-triad-group-dialog'
import { TriadDailyScheduleHint, TriadGroupCard } from './components/triad-group-card/triad-group-card'
import { TriadGroup, TriadGroupFormData } from './interfaces/triad-group.interface'
import { TriadManagementApi } from './services/triad-management-api'

@Component({
	selector: 'app-triad-management',
	standalone: true,
	imports: [TriadGroupCard, AddTriadGroupDialog, EditTriadGroupDialog, DeleteConfirmationDialog, IonModal],
	templateUrl: './triad-management.page.html',
	styleUrl: './triad-management.page.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriadManagementPage implements OnInit, OnDestroy {
	triadGroups = signal<TriadGroup[]>([])

	isLoading = signal<boolean>(false)

	hasMore = signal<boolean>(true)

	searchQuery = signal<string>('')

	showAddDialog = signal<boolean>(false)

	showEditDialog = signal<boolean>(false)

	showDeleteConfirm = signal<boolean>(false)

	selectedTriadGroup = signal<TriadGroup | null>(null)

	deleteTargetId = signal<number | null>(null)

	dailySchedules = signal<DailyScheduleRow[]>([])

	/** Passed to triad cards to clear date inputs after a successful schedule. */
	scheduleDraftResetVersion = signal(0)

	/** Earliest scheduled Eastern date per triad group (for display + unschedule). */
	readonly scheduleHintByGroupId = computed(() => {
		const rows = this.dailySchedules()
		const grouped = new Map<number, DailyScheduleRow[]>()
		for (const r of rows) {
			const list = grouped.get(r.triadGroupId) ?? []
			list.push(r)
			grouped.set(r.triadGroupId, list)
		}
		const out = new Map<number, TriadDailyScheduleHint>()
		for (const [groupId, list] of grouped) {
			list.sort((a, b) => a.puzzleDate.localeCompare(b.puzzleDate))
			const row = list[0]
			out.set(groupId, { dateYmd: row.puzzleDate, rowId: row.id })
		}
		return out
	})

	private offset = 0

	private readonly limit = 20

	private readonly destroy$ = new Subject<void>()

	private readonly searchSubject = new Subject<string>()

	private readonly api = inject(TriadManagementApi)

	private readonly dailyScheduleApi = inject(DailyScheduleAdminApi)

	private readonly snackbar = inject(SnackbarService)

	private readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer')

	ngOnInit() {
		this.setupSearchDebounce()
		this.loadTriadGroups(true)
		this.loadDailySchedules()
	}

	ngOnDestroy() {
		this.destroy$.next()
		this.destroy$.complete()
		this.searchSubject.complete()
	}

	onSearchInput(event: Event) {
		const value = (event.target as HTMLInputElement).value
		this.searchSubject.next(value)
	}

	onClearSearch() {
		this.searchSubject.next('')
	}

	loadTriadGroups(reset: boolean) {
		if (reset) {
			this.offset = 0
			this.triadGroups.set([])
		}

		if (this.isLoading()) {
			return
		}

		this.isLoading.set(true)

		this.api.getTriadGroups(this.offset, this.limit, this.searchQuery()).subscribe({
			next: (response) => {
				if (reset) {
					this.triadGroups.set(response)
				} else {
					this.triadGroups.update((groups) => [...groups, ...response])
				}
				// End-of-data detection: If response.length < limit, there are no more items
				this.hasMore.set(response.length >= this.limit)
				// Track offset: Increment offset by limit after each successful load
				this.offset += this.limit
				this.isLoading.set(false)
			},
			error: () => {
				this.snackbar.showSnackbar('Failed to load triad groups')
				this.isLoading.set(false)
			},
		})
	}

	onScroll() {
		if (this.isLoading() || !this.hasMore()) {
			return
		}

		const container = this.scrollContainer()?.nativeElement
		if (!container) {
			return
		}

		const scrollPosition = container.scrollTop + container.clientHeight
		const scrollHeight = container.scrollHeight

		if (scrollPosition >= scrollHeight - 200) {
			this.loadTriadGroups(false)
		}
	}

	onAdd() {
		this.showAddDialog.set(true)
	}

	onAddDialogCreated(data: TriadGroupFormData) {
		this.api.createTriadGroup(data).subscribe({
			next: () => {
				this.snackbar.showSnackbar('Triad group created successfully')
				this.showAddDialog.set(false)
				this.loadTriadGroups(true)
			},
			error: () => {
				this.snackbar.showSnackbar('Failed to create triad group')
			},
		})
	}

	onAddDialogCanceled() {
		this.showAddDialog.set(false)
	}

	onEdit(triadGroup: TriadGroup) {
		this.selectedTriadGroup.set(triadGroup)
		this.showEditDialog.set(true)
	}

	onEditDialogSaved(data: TriadGroupFormData) {
		const group = this.selectedTriadGroup()
		if (!group) {
			return
		}

		this.api.updateTriadGroup(group.id, data).subscribe({
			next: (updatedGroup) => {
				this.snackbar.showSnackbar('Triad group updated successfully')
				this.showEditDialog.set(false)
				this.selectedTriadGroup.set(null)
				// Update the local state instead of refetching to preserve pagination
				this.triadGroups.update((groups) => groups.map((g) => (g.id === group.id ? updatedGroup : g)))
			},
			error: () => {
				this.snackbar.showSnackbar('Failed to update triad group')
			},
		})
	}

	onEditDialogCanceled() {
		this.showEditDialog.set(false)
		this.selectedTriadGroup.set(null)
	}

	onDelete(id: number) {
		this.deleteTargetId.set(id)
		this.showDeleteConfirm.set(true)
	}

	onDeleteConfirmed() {
		const id = this.deleteTargetId()
		if (!id) {
			return
		}

		this.api.deleteTriadGroup(id).subscribe({
			next: () => {
				this.snackbar.showSnackbar('Triad group deleted successfully')
				this.showDeleteConfirm.set(false)
				this.deleteTargetId.set(null)
				// Remove the deleted group from local state instead of refetching to preserve pagination
				this.triadGroups.update((groups) => groups.filter((g) => g.id !== id))
			},
			error: () => {
				this.snackbar.showSnackbar('Failed to delete triad group')
			},
		})
	}

	onDeleteCanceled() {
		this.showDeleteConfirm.set(false)
		this.deleteTargetId.set(null)
	}

	loadDailySchedules() {
		this.dailyScheduleApi.getSchedules(0, 100).subscribe({
			next: (rows) => {
				this.dailySchedules.set(rows)
			},
			error: () => {
				this.snackbar.showSnackbar('Failed to load daily schedule')
			},
		})
	}

	scheduleHintForGroup(groupId: number): TriadDailyScheduleHint | null {
		return this.scheduleHintByGroupId().get(groupId) ?? null
	}

	onUnscheduleDailyRow(rowId: number) {
		this.dailyScheduleApi.deleteSchedule(rowId).subscribe({
			next: () => {
				this.snackbar.showSnackbar('Schedule entry removed')
				this.scheduleDraftResetVersion.update((v) => v + 1)
				this.loadDailySchedules()
			},
			error: () => {
				// Error message shown by HTTP interceptor
			},
		})
	}

	onDailyScheduleSubmit(payload: { triadGroup: TriadGroup; puzzleDate: string }) {
		const { triadGroup, puzzleDate } = payload
		this.dailyScheduleApi.createSchedule(puzzleDate, triadGroup.id).subscribe({
			next: () => {
				this.snackbar.showSnackbar('Daily puzzle scheduled')
				this.scheduleDraftResetVersion.update((v) => v + 1)
				this.loadDailySchedules()
			},
			error: () => {
				// Error message shown by HTTP interceptor
			},
		})
	}

	onToggleStatus(id: number, active: boolean) {
		this.api.toggleTriadGroupStatus(id, active).subscribe({
			next: (updatedGroup) => {
				this.snackbar.showSnackbar(`Triad group ${active ? 'activated' : 'deactivated'} successfully`)
				// Update only the active property to preserve all existing data and pagination
				this.triadGroups.update((groups) => groups.map((group) => (group.id === id ? { ...group, active: updatedGroup.active } : group)))
			},
			error: () => {
				this.snackbar.showSnackbar('Failed to update triad group status')
			},
		})
	}

	private setupSearchDebounce() {
		this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe((query) => {
			this.searchQuery.set(query)
			this.loadTriadGroups(true)
		})
	}

	protected readonly Boolean = Boolean
}
