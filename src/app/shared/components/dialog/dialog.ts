import { afterNextRender, Component, ElementRef, inject, Injector, input, output, ViewChild } from '@angular/core'

@Component({
	selector: 'app-dialog',
	imports: [],
	templateUrl: './dialog.html',
	styleUrl: './dialog.scss',
	host: {
		class: 'flex h-full max-h-full min-h-0 flex-col',
	},
})
export class Dialog {
	title = input.required<string>()

	whenClosed = output<void>()

	private readonly injector = inject(Injector)

	@ViewChild('scrollContainer', { read: ElementRef }) private scrollContainer?: ElementRef<HTMLElement>

	onClose() {
		this.whenClosed.emit()
	}

	scrollToTop(): void {
		afterNextRender(
			() => {
				const scrollHost = this.findScrollableAncestor(this.scrollContainer?.nativeElement)
				scrollHost?.scrollTo({ top: 0, behavior: 'smooth' })
			},
			{ injector: this.injector },
		)
	}

	private findScrollableAncestor(start?: HTMLElement | null): HTMLElement | null {
		let node = start?.parentElement ?? null

		while (node) {
			const style = getComputedStyle(node)
			const canScrollY = /auto|scroll|overlay/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1

			if (canScrollY) {
				return node
			}

			node = node.parentElement
		}

		return start ?? null
	}
}
