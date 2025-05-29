import { CalendarEvent } from "./calendar-event.js"

export class CalendarDateGroup extends HTMLElement {
    constructor(month = null, day = null, events = null, locale = null) {
        super()
        this.attachShadow({ mode: "open" })
        this.locale = locale ?? undefined
        if (month !== null && day !== null && events !== null) {
            this.setData(month, day, events)
        }
    }

    setData(month, day, events) {
        this.month = month
        this.day = day
        this.events = events
        this.render()
    }

    formatDateTimeAttribute(month, day) {
        const monthStr = String(month).padStart(2, '0')
        const dayStr = String(day).padStart(2, '0')
        return `${monthStr}-${dayStr}`
    }

    formatDateLabel(month, day, locale) {
        const date = new Date(2024, month - 1, day)
        return date.toLocaleDateString(locale, {
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
                * {
                    padding: 0;
                    margin: 0;
                    box-sizing: border-box;
                }
                :host {
                    display: block;
                    padding: .5em;
                }
                time { font-weight: bold; }
                #events {
                    display: grid;
                    gap: .5em;
                }
            </style>
            <time datetime="${datetime}">${dateLabel}</time>
            <div id="events"></div>
        `

        const eventsContainer = this.shadowRoot.getElementById("events")
        this.events.forEach(eventData => {
            const event = new CalendarEvent(eventData)
            eventsContainer.appendChild(event)
        })
    }
}

customElements.define("calendar-date-group", CalendarDateGroup)
