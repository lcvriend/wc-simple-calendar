export class CalendarPeriod extends HTMLElement {
    static EXCLUDED_KEYS = new Set([
        "start_month",
        "start_day",
        "end_month",
        "end_day",
        "description",
    ])

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

    getMetadataProperties() {
        if (!this.data) return []

        return Object.entries(this.data)
            .filter(([key, value]) => !CalendarPeriod.EXCLUDED_KEYS.has(key) && value != null)
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

        const description = this.data.description ?? ""
        const dateRange = this.formatDateRange(
            this.data.start_month,
            this.data.start_day,
            this.data.end_month,
            this.data.end_day,
            this.locale
        )
        const metadata = this.renderMetadataHtml()

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                :host([hidden]) { display: none; }
                #date-range { font-weight: bold; }
                #description { }
                #metadata { }
                .metadata-item { font-family: monospace; }
                .metadata-item:not(:last-child)::after {
                    content: " • ";
                }
            </style>
            <div id="date-range">${dateRange}</div>
            <div id="description">${description}</div>
            <div id="metadata">${metadata}</div>
        `
    }

    renderMetadataHtml() {
        return this.getMetadataProperties()
            .map(([, value]) => `<span class="metadata-item">${value}</span>`)
            .join("")
    }
}

customElements.define('calendar-period', CalendarPeriod)
