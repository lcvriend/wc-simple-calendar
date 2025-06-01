import { CalendarPeriodGroup } from './calendar-period-group.js'
import { CalendarPeriod } from './calendar-period.js'

export class CalendarPeriodsContainer extends HTMLElement {
    constructor(calendarArray = null, config = {}) {
        super()
        this.attachShadow({ mode: "open" })
        this.config = config
        if (calendarArray) {
            this.setData(calendarArray)
        }
    }

    setData(calendarArray) {
        this.data = calendarArray
        this.processedData = this.processData(calendarArray)
        this.render()
    }

    processData(data) {
        const grouped = this.groupByFirstCategory(data)

        // Sort groups alphabetically by first category values
        const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b))

        // Sort periods within each group by all categories alphabetically
        sortedGroups.forEach(([categoryName, periods]) => {
            periods.sort((a, b) => this.compareByAllCategories(a, b))
        })

        return sortedGroups
    }

    groupByFirstCategory(periods) {
        const firstMetadataKey = this.getFirstMetadataKey()
        const grouped = new Map()

        periods.forEach(period => {
            const categoryValue = period[firstMetadataKey] ?? "Uncategorized"
            if (!grouped.has(categoryValue)) {
                grouped.set(categoryValue, [])
            }
            grouped.get(categoryValue).push(period)
        })

        return grouped
    }

    getFirstMetadataKey() {
        if (!this.data || this.data.length === 0) return null

        const firstItem = this.data[0]
        const metadataKeys = Object.keys(firstItem)
            .filter(key => !CalendarPeriod.EXCLUDED_KEYS.has(key))

        return metadataKeys[0] ?? null
    }

    getAllMetadataKeys() {
        if (!this.data || this.data.length === 0) return []

        const allKeys = new Set()
        this.data.forEach(item => {
            Object.keys(item)
                .filter(key => !CalendarPeriod.EXCLUDED_KEYS.has(key))
                .forEach(key => allKeys.add(key))
        })

        return Array.from(allKeys)
    }

    compareByAllCategories(a, b) {
        const allMetadataKeys = this.getAllMetadataKeys().sort()

        for (const key of allMetadataKeys) {
            const aValue = a[key] ?? ""
            const bValue = b[key] ?? ""
            if (aValue !== bValue) {
                return aValue.localeCompare(bValue)
            }
        }
        return 0
    }

    render() {
        if (!this.processedData) return

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                calendar-period-group {
                    margin-bottom: 1rem;
                }
            </style>
        `

        this.processedData.forEach(([categoryName, periods]) => {
            const periodGroup = new CalendarPeriodGroup(categoryName, periods, this.config.locale)
            this.shadowRoot.appendChild(periodGroup)
        })
    }
}

customElements.define('calendar-periods-container', CalendarPeriodsContainer)
