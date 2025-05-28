import { CalendarDateGroup } from './calendar-date-group.js'
import { CalendarEvent } from './calendar-event.js'

export class CalendarEventsContainer extends HTMLElement {
   constructor(calendarArray = null, locale = null, pastDays = 30) {
       super()
       this.attachShadow({ mode: "open" })
       this.locale = locale ?? undefined
       this.pastDays = pastDays
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
       const dateGroups = this.groupByDate(data)
       const renderItems = []

       dateGroups.forEach((dateGroup, index, array) => {
           if (this.shouldShowMonthHeader(dateGroup, array, index)) {
               renderItems.push({
                   type: 'month-header',
                   month: dateGroup.month
               })
           }

           if (this.shouldShowWeekNumber(dateGroup, array, index)) {
               renderItems.push({
                   type: 'week-header',
                   weekNumber: this.getISOWeekNumber(dateGroup.month, dateGroup.day)
               })
           }

           renderItems.push({
               type: 'date-group',
               month: dateGroup.month,
               day: dateGroup.day,
               events: dateGroup.events
           })
       })

       return renderItems
   }

   groupByDate(events) {
       const grouped = new Map()

       events.forEach(event => {
           const dateKey = `${event.start_month}-${event.start_day}`
           if (!grouped.has(dateKey)) {
               grouped.set(dateKey, {
                   month: event.start_month,
                   day: event.start_day,
                   events: []
               })
           }
           grouped.get(dateKey).events.push(event)
       })

        // Sort events within each date group by metadata categories
        grouped.forEach(dateGroup => {
            dateGroup.events.sort((a, b) => {
                const aCategories = this.getMetadataCategories(a)
                const bCategories = this.getMetadataCategories(b)

                for (let i = 0; i < Math.max(aCategories.length, bCategories.length); i++) {
                    const aValue = aCategories[i] || ""
                    const bValue = bCategories[i] || ""

                    if (aValue !== bValue) {
                        return aValue.localeCompare(bValue)
                    }
                }
                return 0
            })
        })

        return Array.from(grouped.values()).sort((a, b) => {
            const aDays = this.getDaysFromToday(a.month, a.day)
            const bDays = this.getDaysFromToday(b.month, b.day)
            return aDays - bDays
        })
   }

    getDaysFromToday(month, day) {
        const today = new Date()
        const currentYear = today.getFullYear()
        const targetDate = new Date(currentYear, month - 1, day)
        const todayDate = new Date(currentYear, today.getMonth(), today.getDate())

        const diffTime = targetDate - todayDate
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        // Show past events within our threshold as negative days
        if (diffDays < 0 && Math.abs(diffDays) <= this.pastDays) {
            return diffDays
        }

        // Past events beyond threshold are assumed to be next year
        if (diffDays < -this.pastDays) {
            const nextYearDate = new Date(currentYear + 1, month - 1, day)
            return Math.floor((nextYearDate - todayDate) / (1000 * 60 * 60 * 24))
        }

        return diffDays
    }

    getMetadataCategories(event) {
        return Object.entries(event)
            .filter(([key, value]) => !CalendarEvent.EXCLUDED_KEYS.has(key) && value != null)
            .map(([key, value]) => value)
    }

   shouldShowMonthHeader(current, array, index) {
       return index === 0 || current.month !== array[index - 1].month
   }

   shouldShowWeekNumber(current, array, index) {
       if (index === 0) return true
       const currentWeek = this.getISOWeekNumber(current.month, current.day)
       const prevWeek = this.getISOWeekNumber(array[index - 1].month, array[index - 1].day)
       return currentWeek !== prevWeek
   }

   getISOWeekNumber(month, day) {
       const today = new Date()
       const currentYear = today.getFullYear()

       // Determine which year this date belongs to (current or next)
       const eventDate = new Date(currentYear, month - 1, day)
       const year = eventDate < today ? currentYear + 1 : currentYear

       // Calculate ISO week number
       const date = new Date(year, month - 1, day)
       const thursday = new Date(date.getTime() + (3 - ((date.getDay() + 6) % 7)) * 86400000)
       const yearOfThursday = thursday.getFullYear()
       const firstThursday = new Date(yearOfThursday, 0, 4)
       return Math.ceil(((thursday - firstThursday) / 86400000 + 1) / 7)
   }

   formatMonthHeader(month, locale) {
       const date = new Date(2024, month - 1, 1)
       return date.toLocaleDateString(locale, { month: "long" })
   }

    render() {
        if (!this.processedData) return

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 400px;
                    overflow-y: auto;
                }
                #scroll-to-today {
                    position: sticky;
                    top: 0;
                    float: right;
                    cursor: pointer;
                    z-index: 1;
                }
                calendar-date-group {
                    margin-bottom: 0.5rem;
                }
            </style>
            <button id="scroll-to-today">Today</button>
        `

        this.processedData.forEach(item => {
            switch (item.type) {
                case 'month-header':
                    const monthElement = document.createElement('h2')
                    monthElement.textContent = this.formatMonthHeader(item.month, this.locale)
                    this.shadowRoot.appendChild(monthElement)
                    break

                case 'week-header':
                    const weekElement = document.createElement('h3')
                    weekElement.textContent = `Week ${item.weekNumber}`
                    this.shadowRoot.appendChild(weekElement)
                    break

                case 'date-group':
                    const dateGroupElelement = new CalendarDateGroup(
                        item.month,
                        item.day,
                        item.events,
                        this.locale,
                )
                    this.shadowRoot.appendChild(dateGroupElelement)
                    break
            }
        })

        this.shadowRoot.getElementById('scroll-to-today').addEventListener('click', () => {
            this.scrollToToday()
        })

        setTimeout(() => this.scrollToToday(), 0)
    }

    scrollToToday() {
        const today = new Date()
        const todayMonth = today.getMonth() + 1
        const todayDay = today.getDate()

        const dateGroups = this.shadowRoot.querySelectorAll('calendar-date-group')

        // First try to find today
        let targetGroup = Array.from(dateGroups).find(group =>
            group.month === todayMonth && group.day === todayDay
        )

        // If no today, find the closest future date
        if (!targetGroup) {
            targetGroup = Array.from(dateGroups).find(group => {
                const groupDays = this.getDaysFromToday(group.month, group.day)
                return groupDays > 0 // First positive (future) date
            })
        }

        // Fallback to first date if no future dates
        if (!targetGroup && dateGroups.length > 0) {
            targetGroup = dateGroups[0]
        }

        if (targetGroup) {
            // Get positions relative to the viewport
            const containerRect = this.getBoundingClientRect()
            const targetRect = targetGroup.getBoundingClientRect()

            // Calculate target position relative to container
            const relativeTop = targetRect.top - containerRect.top + this.scrollTop
            this.scrollTop = relativeTop
        }
    }
}

customElements.define('calendar-events-container', CalendarEventsContainer)
