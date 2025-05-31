import { MetadataFilter } from "./controls/metadata-filters.js"
import { PeriodFilter } from './controls/period-filter.js'
import { CalendarEventsContainer } from "./events/calendar-events-container.js"
import { CalendarPeriodsContainer } from "./periods/calendar-periods-container.js"

export class Calendar extends HTMLElement {
    static get observedAttributes() {
        return ["locale"]
    }

    constructor(data = null, locale = null) {
        super()
        this.attachShadow({ mode: "open" })
        this.rawData = null
        this.locale = locale ?? this.getAttribute("locale")
        this.events = []
        this.periods = []

        this.metadataFilters = {}
        this.periodsFilter = "active" // "all" | "active"

        this.eventsContainer = new CalendarEventsContainer(null, this.locale)
        this.periodsContainer = new CalendarPeriodsContainer(null, this.locale)
        this.metadataFilter = new MetadataFilter(null)
        this.periodFilter = new PeriodFilter()

        if (data) this.setData(data)
    }

    connectedCallback() {
        this.shadowRoot.addEventListener("filter-change", this.handleFilterChange.bind(this))
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "locale" && oldValue !== newValue) {
            this.locale = newValue
            if (this.rawData) {
                this.render()
            }
        }
    }

    setData(data) {
        this.rawData = data
        this.processData()
        this.render()
    }

    processData() {
        if (!this.rawData) return

        const { events, periods } = this.splitEventsAndPeriods(this.rawData)
        this.events = events
        this.periods = periods
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

    handleFilterChange(event) {
        if (event.detail.type === "metadata") {
            this.metadataFilters = event.detail.selections
        } else if (event.detail.type === "periods") {
            this.periodsFilter = event.detail.value
        }
        this.updateContainers()
    }

    applyFilters(items, itemType) {
        let filtered = this.applyMetadataFilter(items)

        if (itemType === "periods") {
            filtered = this.applyPeriodsFilter(filtered)
        }

        return filtered
    }

    applyMetadataFilter(items) {
        if (Object.keys(this.metadataFilters).length === 0) return items

        return items.filter(item => {
            return Object.entries(this.metadataFilters).every(([category, selectedValues]) => {
                return selectedValues.length === 0 || selectedValues.includes(item[category])
            })
        })
    }

    applyPeriodsFilter(items) {
        if (this.periodsFilter === "all") return items

        return items.filter(period => this.isPeriodActive(period))
    }

    isPeriodActive(period) {
        const today = new Date()
        const currentYear = today.getFullYear()

        let startDate = new Date(currentYear, period.start_month - 1, period.start_day)
        let endDate = new Date(currentYear, period.end_month - 1, period.end_day)

        // Handle periods that cross year boundary
        if (endDate < startDate) {
            endDate = new Date(currentYear + 1, period.end_month - 1, period.end_day)
        }

        const result = today >= startDate && today <= endDate
        return result
    }

    updateContainers() {
        const filteredEvents = this.applyFilters(this.events)
        const filteredPeriods = this.applyFilters(this.periods, "periods")

        this.eventsContainer.setData(filteredEvents)
        this.periodsContainer.setData(filteredPeriods)
    }

    render() {
        if (!this.rawData) return

        this.metadataFilter.setData(this.rawData)
        this.updateContainers()

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                summary {
                    border-top: 4px solid;
                    min-width: 200px;
                    padding: 0.5em 0;
                    position: relative;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: .5em;
                    white-space: nowrap;
                }
                summary:after {
                    content: "+";
                    position: absolute;
                    font-size: 1.75em;
                    right: 0;
                    font-weight: 200;
                    transform-origin: center;
                    transition: 40ms linear;
                }
                details[open] {
                    > summary {
                        border-bottom: 1px solid;
                    }
                    > summary:after {
                        transform: rotate(45deg);
                    }
                }
            </style>
            <details id="filters" open>
                <summary>Filters</summary>
            </details>
            <details id="events" open>
                <summary>Events</summary>
            </details>
            <details id="periods" open>
                <summary>Periods</summary>
            </details>
        `

        this.shadowRoot.getElementById("events").appendChild(this.eventsContainer)
        this.shadowRoot.getElementById("periods").appendChild(this.periodsContainer)
        this.shadowRoot.getElementById("filters").appendChild(this.metadataFilter)
        this.shadowRoot.getElementById("filters").appendChild(this.periodFilter)
    }
}

customElements.define("year-calendar", Calendar)
