import { CalendarPeriod } from "./calendar-period.js"

export class CalendarPeriodGroup extends HTMLElement {
   constructor(categoryName = null, periods = null, locale = null) {
       super()
       this.attachShadow({ mode: "open" })
       this.locale = locale ?? undefined
       if (categoryName !== null && periods !== null) {
           this.setData(categoryName, periods)
       }
   }

   setData(categoryName, periods) {
       this.categoryName = categoryName
       this.periods = periods
       this.render()
   }

   render() {
        if (!this.periods) return

        const categoryLabel = this.categoryName || "Uncategorized"

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
                #category-name { font-weight: bold; }
                #periods {
                    display: grid;
                    gap: .5em;
                }
            </style>
            <div id="category-name">${categoryLabel}</div>
            <div id="periods"></div>
        `

        const periodsContainer = this.shadowRoot.getElementById("periods")
        this.periods.forEach(periodData => {
            const period = new CalendarPeriod(periodData, this.locale)
            periodsContainer.appendChild(period)
        })
   }
}

customElements.define("calendar-period-group", CalendarPeriodGroup)
