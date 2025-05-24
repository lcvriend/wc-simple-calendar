export class CalendarDateGroup extends HTMLElement {
    constructor(month = null, day = null, events = null, locale = null) {
        super()
        this.attachShadow({ mode: "open" })
        if (month !== null && day !== null && events !== null) {
            this.setData(month, day, events, locale)
        }
    }

    setData(month, day, events, locale) {
        this.month = month
        this.day = day
        this.events = events
        this.locale = locale
        this.render()
    }

    formatDateTimeAttribute(month, day) {
        const monthStr = String(month).padStart(2, '0')
        const dayStr = String(day).padStart(2, '0')
        return `${monthStr}-${dayStr}`
    }

    formatDateLabel(month, day, locale) {
        const date = new Date(2024, month - 1, day)
        return date.toLocaleDateString(locale ?? undefined, {
            month: "short",
            day: "numeric"
        })
    }

    render() {
        if (!this.events) return

        const dateLabel = this.formatDateLabel(this.month, this.day, this.locale)
        const datetime = this.formatDateTimeAttribute(this.month, this.day)

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                time { font-weight: bold; }
            </style>
            <time datetime="${datetime}">${dateLabel}</time>
            <div id="events"></div>
        `

        // Add event elements to the events container
        const eventsContainer = this.shadowRoot.getElementById("events")
        this.events.forEach(eventData => {
            const eventEl = document.createElement("calendar-event")
            eventEl.setData(eventData)
            eventsContainer.appendChild(eventEl)
        })
    }
}

customElements.define("calendar-date-group", CalendarDateGroup)
