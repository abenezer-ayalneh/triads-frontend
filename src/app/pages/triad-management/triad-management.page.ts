import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core'
import { Subject, takeUntil } from 'rxjs'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'

import { SnackbarService } from '../../shared/services/snackbar.service'
import { AddTriadGroupDialog } from './components/add-triad-group-dialog/add-triad-group-dialog'
import { DeleteConfirmationDialog } from './components/delete-confirmation-dialog/delete-confirmation-dialog'
import { EditTriadGroupDialog } from './components/edit-triad-group-dialog/edit-triad-group-dialog'
import { TriadGroupCard } from './components/triad-group-card/triad-group-card'
import { TriadGroup, TriadGroupFormData } from './interfaces/triad-group.interface'
import { TriadManagementApi } from './services/triad-management-api'

@Component({
	selector: 'app-triad-management',
	standalone: true,
	imports: [TriadGroupCard, AddTriadGroupDialog, EditTriadGroupDialog, DeleteConfirmationDialog],
	templateUrl: './triad-management.page.html',
	styleUrl: './triad-management.page.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriadManagementPage implements OnInit, AfterViewInit, OnDestroy {
	triadGroups = signal<TriadGroup[]>([])

	isLoading = signal<boolean>(false)

	hasMore = signal<boolean>(true)

	searchQuery = signal<string>('')

	showAddDialog = signal<boolean>(false)

	showEditDialog = signal<boolean>(false)

	showDeleteConfirm = signal<boolean>(false)

	selectedTriadGroup = signal<TriadGroup | null>(null)

	deleteTargetId = signal<number | null>(null)

	private offset = 0

	private readonly limit = 20

	private readonly destroy$ = new Subject<void>()

	private readonly searchSubject = new Subject<string>()

	private readonly api = inject(TriadManagementApi)

	private readonly snackbar = inject(SnackbarService)

	private readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer')

	private scrollHandler: (() => void) | null = null

	ngOnInit() {
		this.setupSearchDebounce()
		this.loadTriadGroups(true)
	}

	ngAfterViewInit() {
		this.setupScrollListener()
	}

	ngOnDestroy() {
		const container = this.scrollContainer()?.nativeElement
		if (container && this.scrollHandler) {
			container.removeEventListener('scroll', this.scrollHandler)
		}
		this.destroy$.next()
		this.destroy$.complete()
		this.searchSubject.complete()
	}

	private setupScrollListener() {
		const container = this.scrollContainer()?.nativeElement
		if (!container) {
			return
		}

		this.scrollHandler = () => {
			this.onScroll()
		}

		container.addEventListener('scroll', this.scrollHandler)
	}

	private setupSearchDebounce() {
		this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe((query) => {
			this.searchQuery.set(query)
			this.loadTriadGroups(true)
		})
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
			next: () => {
				this.snackbar.showSnackbar('Triad group updated successfully')
				this.showEditDialog.set(false)
				this.selectedTriadGroup.set(null)
				this.loadTriadGroups(true)
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
				this.loadTriadGroups(true)
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

	onToggleStatus(id: number, active: boolean) {
		this.api.toggleTriadGroupStatus(id, active).subscribe({
			next: () => {
				this.snackbar.showSnackbar(`Triad group ${active ? 'activated' : 'deactivated'} successfully`)
				this.loadTriadGroups(true)
			},
			error: () => {
				this.snackbar.showSnackbar('Failed to update triad group status')
			},
		})
	}
}
