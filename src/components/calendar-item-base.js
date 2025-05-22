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
    }

    setData(itemObject) {
        this.data = itemObject
        this.render()
    }

    setFilterState(filters) {
        this.filterState = filters
        this.updateVisibility()
    }

    getMetadataProperties() {
        if (!this.data) return []

        return Object.entries(this.data)
            .filter(([key, value]) => !CalendarItemBase.EXCLUDED_KEYS.has(key) && value != null)
    }

    render() {
        throw new Error("render() must be implemented by subclass")
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
        // Same month - show "January 5-12"
        if (startMonth === endMonth) {
            const formattedDate = this.formatDate(startMonth, startDay, locale)
            return `${formattedDate}-${endDay}`
        }

        // Different months - show "January 28 - February 3"
        const startFormatted = this.formatDate(startMonth, startDay, locale)
        const endFormatted = this.formatDate(endMonth, endDay, locale)
        return `${startFormatted} - ${endFormatted}`
    }
}
