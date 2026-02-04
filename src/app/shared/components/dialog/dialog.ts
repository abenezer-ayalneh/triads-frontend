import { Component, input, output } from '@angular/core'

@Component({
	selector: 'app-dialog',
	imports: [],
	templateUrl: './dialog.html',
	styleUrl: './dialog.scss',
})
export class Dialog {
	title = input.required<string>()

	whenClosed = output<void>()

	onClose() {
		this.whenClosed.emit()
	}
}
