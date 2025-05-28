export class CalendarEvent extends HTMLElement {
    static EXCLUDED_KEYS = new Set([
        "start_month",
        "start_day",
        "end_month",
        "end_day",
        "description",
    ])

    constructor(data = null) {
        super()
        this.attachShadow({ mode: "open" })
        if (data) this.setData(data)
    }

    setData(itemObject) {
        this.data = itemObject
        this.render()
    }

    getMetadataProperties() {
        if (!this.data) return []

        return Object.entries(this.data)
            .filter(([key, value]) => !CalendarEvent.EXCLUDED_KEYS.has(key) && value != null)
    }

    render() {
        if (!this.data) return

        const description = this.data.description ?? ""
        const metadata = this.renderMetadataHtml()

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                :host([hidden]) { display: none; }
                #description { }
                #metadata { }
                .metadata-item { font-family: monospace; }
                .metadata-item:not(:last-child)::after {
                    content: " • ";
                }
            </style>
            <div id="description">${description}</div>
            <div id="metadata">${metadata}</div>
        `
    }

    renderMetadataHtml() {
        return this.getMetadataProperties()
            .map(([, value]) => `<span class="metadata-item">${value}</span>`)
            .join("")
    }
}

customElements.define('calendar-event', CalendarEvent)
