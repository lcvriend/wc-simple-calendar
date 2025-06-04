import { CalendarItem } from '../calendar-item.js'

export class CalendarEvent extends HTMLElement {
    constructor(data = null) {
        super()
        this.attachShadow({ mode: "open" })
        if (data) this.setData(data)
    }

    setData(itemObject) {
        this.data = itemObject
        this.render()
    }

    render() {
        if (!this.data) return

        this.shadowRoot.innerHTML = `<style>:host { display: block; }</style>`

        const item = new CalendarItem(this.data)
        this.shadowRoot.appendChild(item)
    }
}

customElements.define('calendar-event', CalendarEvent)
