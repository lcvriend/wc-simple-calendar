import { CalendarItemBase } from './calendar-item-base.js'

export class CalendarEvent extends CalendarItemBase {
    render() {
        if (!this.data) return
        
        const datetime = this.formatDateTimeAttribute(this.data.start_month, this.data.start_day)
        const dateLabel = this.formatDateLabel(this.data.start_month, this.data.start_day)
        const description = this.data.description ?? ""
        const metadata = this.renderMetadataHtml()
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                :host([hidden]) { display: none; }
                time { }
                #description { }
                #metadata { }
                .metadata-item { }
                .metadata-item:not(:last-child)::after {
                    content: " • ";
                }
            </style>
            <time datetime="${datetime}">${dateLabel}</time>
            <div id="description">${description}</div>
            <div id="metadata">${metadata}</div>
        `
    }
}

customElements.define('calendar-event', CalendarEvent)
