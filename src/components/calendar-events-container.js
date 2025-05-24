// calendar-container.js
import './calendar-event-group.js'

export class CalendarEventsContainer extends HTMLElement {
   constructor(calendarArray = null, locale = null) {
       super()
       this.attachShadow({ mode: "open" })
       if (calendarArray) {
           this.setData(calendarArray, locale)
       }
   }

   setData(calendarArray, locale = null) {
       this.data = calendarArray
       this.locale = locale
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

       return Array.from(grouped.values()).sort((a, b) => {
           if (a.month !== b.month) return a.month - b.month
           return a.day - b.day
       })
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
       return date.toLocaleDateString(locale ?? undefined, { month: "long" })
   }

    render() {
        if (!this.processedData) return

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
            </style>
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
                    const dateGroupElelement = document.createElement('calendar-date-group')
                    dateGroupElelement.setData(item.month, item.day, item.events, this.locale)
                    this.shadowRoot.appendChild(dateGroupElelement)
                    break
            }
        })
    }
}

customElements.define('calendar-events-container', CalendarEventsContainer)
