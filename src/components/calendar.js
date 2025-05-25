import './metadata-filters.js'
import './calendar-events-container.js'

export class Calendar extends HTMLElement {
    constructor(data = null, locale = null) {
        super()
        this.attachShadow({ mode: "open" })
        this.rawData = null
        this.locale = locale
        this.events = []
        this.periods = []
        this.activeFilters = {}
        if (data) this.setData(data, locale)
    }

    setData(data, locale = null) {
        this.rawData = data
        this.locale = locale
        this.processData()
        this.render()
    }

    processData() {
        if (!this.rawData) return

        const { events, periods } = this.splitEventsAndPeriods(this.rawData)
        this.events = events
        this.periods = periods // computed but not used yet
    }

    splitEventsAndPeriods(data) {
        const events = []
        const periods = []

        data.forEach(item => {
            if (item.end_month != null && item.end_day != null) {
                periods.push(item)
            } else {
                events.push(item)
            }
        })

        return { events, periods }
    }

    applyFilters(items) {
        if (Object.keys(this.activeFilters).length === 0) return items

        return items.filter(item => {
            return Object.entries(this.activeFilters).every(([category, selectedValues]) => {
                return selectedValues.length === 0 || selectedValues.includes(item[category])
            })
        })
    }

    handleFilterChange(event) {
        if (event.detail.type === "metadata") {
            this.activeFilters = event.detail.selections
            this.updateEventsContainer()
        }
    }

    updateEventsContainer() {
        const filteredEvents = this.applyFilters(this.events)
        const eventsContainer = this.shadowRoot.querySelector("calendar-events-container")
        if (eventsContainer) {
            eventsContainer.setData(filteredEvents, this.locale)
        }
    }

    render() {
        if (!this.rawData) return

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                #filters { margin-bottom: 20px; }
            </style>
            <div id="filters"></div>
            <div id="events"></div>
        `

        // Create metadata filter
        const filtersContainer = this.shadowRoot.getElementById("filters")
        const metadataFilter = document.createElement("metadata-filter")
        metadataFilter.setData(this.rawData)
        filtersContainer.appendChild(metadataFilter)

        // Create events container with initial filtered data
        const eventsContainer = this.shadowRoot.getElementById("events")
        const calendarEventsContainer = document.createElement("calendar-events-container")
        const filteredEvents = this.applyFilters(this.events)
        calendarEventsContainer.setData(filteredEvents, this.locale)
        eventsContainer.appendChild(calendarEventsContainer)

        // Attach event listeners
        this.shadowRoot.addEventListener("filter-change", this.handleFilterChange.bind(this))
    }
}

customElements.define("year-calendar", Calendar)
