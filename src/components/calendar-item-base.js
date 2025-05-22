export class CalendarItemBase extends HTMLElement {
    static EXCLUDED_KEYS = new Set([
        "start_month",
        "start_day",
        "end_month",
        "end_day",
        "description",
    ])

    constructor() {
        super()
        this.attachShadow({ mode: "open" })
        this.data = null
        this.filterState = {}
        this.isVisible = true

        this.createTemplate()
        this.setupShadowDOM()
    }

    createTemplate() {
        this.template = `
            <style>
                :host {
                    display: block;
                }

                :host([hidden]) {
                    display: none;
                }

                #date {}

                #description {}

                #metadata {}
            </style>
            <div id="date"></div>
            <div id="description"></div>
            <div id="metadata"></div>
        `
    }

    setupShadowDOM() {
        this.shadowRoot.innerHTML = this.template

        this.elems = {
            date: this.shadowRoot.querySelector("#date"),
            description: this.shadowRoot.querySelector("#description"),
            metadata: this.shadowRoot.querySelector("#metadata")
        }
    }

    setData(itemObject) {
        this.data = itemObject
        this.render()
    }

    setFilterState(filters) {
        this.filterState = filters
        this.updateVisibility()
    }

    render() {
        if (!this.data) return

        this.renderDate()
        this.renderDescription()
        this.renderMetadata()
        this.updateVisibility()
    }

    renderDate() {
        // To be implemented by subclasses
        throw new Error("renderDate must be implemented by subclass")
    }

    renderDescription() {
        this.elems.description.textContent = this.data.description ?? ""
    }

    renderMetadata() {
        const metadata = this.getMetadataProperties()
        if (metadata.length > 0) {
            this.elems.metadata.innerHTML = metadata
                .map(([key, value]) => `<span class="metadata-item">${key}: ${value}</span>`)
                .join("")
        } else {
            this.elems.metadata.innerHTML = ""
        }
    }

    getMetadataProperties() {
        if (!this.data) return []

        return Object.entries(this.data)
            .filter(([key, value]) => !CalendarItemBase.EXCLUDED_KEYS.has(key) && value != null)
    }

    updateVisibility() {
        const shouldShow = this.evaluateFilters()

        if (shouldShow !== this.isVisible) {
            this.isVisible = shouldShow
            this.toggleAttribute("hidden", !shouldShow)
        }
    }

    evaluateFilters() {
        if (!this.data || Object.keys(this.filterState).length === 0) {
            return true
        }

        return Object.entries(this.filterState).every(([filterKey, filterValue]) => {
            const itemValue = this.data[filterKey]
            return itemValue != null && filterValue.includes(itemValue)
        })
    }

    formatDate(month, day, locale) {
        // Create a date object for the current year (arbitrary, we just need month/day)
        const date = new Date(2024, month - 1, day)

        return date.toLocaleDateString(locale, {
            month: "long",
            day: "numeric"
        })
    }

    formatDateRange(startMonth, startDay, endMonth, endDay, locale) {
        const startDate = new Date(2024, startMonth - 1, startDay)
        const endDate = new Date(2024, endMonth - 1, endDay)

        // Same month - show "January 5-12"
        if (startMonth === endMonth) {
            const monthName = startDate.toLocaleDateString(locale, { month: "long" })
            return `${monthName} ${startDay}-${endDay}`
        }

        // Different months - show "January 28 - February 3"
        const startFormatted = this.formatDate(startMonth, startDay, locale)
        const endFormatted = this.formatDate(endMonth, endDay, locale)
        return `${startFormatted} - ${endFormatted}`
    }
}
