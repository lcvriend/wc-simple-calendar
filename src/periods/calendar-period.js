import { CalendarItem } from '../calendar-item.js'

export class CalendarPeriod extends HTMLElement {
    constructor(data = null, locale = null) {
        super()
        this.attachShadow({ mode: "open" })
        this.locale = locale ?? undefined
        if (data) this.setData(data)
    }

    setData(periodData) {
        this.data = periodData
        this.render()
    }

    formatDateRange(startMonth, startDay, endMonth, endDay, locale) {
        const start = new Date(2024, startMonth - 1, startDay)
        const end = new Date(2024, endMonth - 1, endDay)

        const startStr = start.toLocaleDateString(locale, { month: "short", day: "numeric" })
        const endStr = end.toLocaleDateString(locale, { month: "short", day: "numeric" })

        return `${startStr} - ${endStr}`
    }

    render() {
        if (!this.data) return

        const dateRange = this.formatDateRange(
            this.data.start_month,
            this.data.start_day,
            this.data.end_month,
            this.data.end_day,
            this.locale
        )

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                #date-range { font-weight: bold; margin-bottom: 0.25em; }
            </style>
            <div id="date-range">${dateRange}</div>
        `

        const item = new CalendarItem(this.data)
        this.shadowRoot.appendChild(item)
    }
}

customElements.define('calendar-period', CalendarPeriod)
