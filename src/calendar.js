import './controls/metadata-filters.js'
import { CalendarEventsContainer } from './events/calendar-events-container.js'

export class Calendar extends HTMLElement {
    static get observedAttributes() {
        return ['locale']
    }

    constructor(data = null, locale = null) {
        super()
        this.attachShadow({ mode: "open" })
        this.rawData = null
        this.locale = locale ?? this.getAttribute('locale')
        this.events = []
        this.periods = []
        this.activeFilters = {}
        if (data) this.setData(data)
    }

    connectedCallback() {
        this.shadowRoot.addEventListener("filter-change", this.handleFilterChange.bind(this))
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'locale' && oldValue !== newValue) {
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
        console.log("Calendar received filter change:", event.detail)
        if (event.detail.type === "metadata") {
            this.activeFilters = event.detail.selections
            this.updateEventsContainer()
        }
    }

    updateEventsContainer() {
        const filteredEvents = this.applyFilters(this.events)
        const eventsContainer = this.shadowRoot.querySelector("calendar-events-container")
        if (eventsContainer) {
            eventsContainer.setData(filteredEvents)
        }
    }

    render() {
        if (!this.rawData) return

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                #filters { margin-bottom: 20px; }
                details {
                    border-bottom: 1px solid;
                }
                summary {
                    border-top: 4px solid;
                    border-bottom: 1px solid;
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
                details[open] > summary:after {
                    transform: rotate(45deg);
                }
            </style>
            <div id="filters"></div>
            <details id="events"open>
                <summary>Events</summary>
            </details>
        `

        // Create metadata filter
        const filtersContainer = this.shadowRoot.getElementById("filters")
        const metadataFilter = document.createElement("metadata-filter")
        metadataFilter.setData(this.rawData)
        filtersContainer.appendChild(metadataFilter)

        // Create events container with initial filtered data
        const eventsContainer = this.shadowRoot.getElementById("events")
        const filteredEvents = this.applyFilters(this.events)
        const calendarEventsContainer = new CalendarEventsContainer(filteredEvents, this.locale)
        eventsContainer.appendChild(calendarEventsContainer)
    }
}

customElements.define("year-calendar", Calendar)
