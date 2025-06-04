export class CalendarItem extends HTMLElement {
    static EXCLUDED_KEYS = new Set([
        "start_month",
        "start_day",
        "end_month",
        "end_day",
        "label",
        "description",
    ])

    constructor(data = null) {
        super()
        this.attachShadow({ mode: "open" })
        if (data) this.setData(data)
    }

    setData(itemData) {
        this.data = itemData
        this.render()
    }

    getMetadataProperties() {
        if (!this.data) return []

        return Object.entries(this.data)
            .filter(([key, value]) => !CalendarItem.EXCLUDED_KEYS.has(key) && value != null)
    }

    renderMetadataHtml() {
        return this.getMetadataProperties()
            .map(([, value]) => `<span class="metadata-item">${value}</span>`)
            .join("")
    }

    render() {
        if (!this.data) return

        const label = this.data.label ?? ""
        const description = this.data.description ?? ""
        const metadata = this.renderMetadataHtml()

        if (description) {
            this.shadowRoot.innerHTML = `
                <style>
                    :host { display: block; }
                    :host([hidden]) { display: none; }

                    summary {
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
                        font-size: 1.25em;
                        right: 0;
                        transform-origin: center;
                        transition: 40ms linear;
                    }
                    details[open] {
                        > summary {
                            border-bottom: 1px dotted;
                        }
                        > summary:after {
                            transform: rotate(45deg);
                        }
                    }

                    #description { margin-top: 0.5em; }
                    #metadata { }
                    .metadata-item { font-family: monospace; }
                    .metadata-item:not(:last-child)::after {
                        content: " • ";
                    }
                </style>
                <details>
                    <summary>${label}</summary>
                    <div id="description">${description}</div>
                </details>
                <div id="metadata">${metadata}</div>
            `
        } else {
            this.shadowRoot.innerHTML = `
                <style>
                    :host { display: block; }
                    :host([hidden]) { display: none; }
                    #label { }
                    #metadata { }
                    .metadata-item { font-family: monospace; }
                    .metadata-item:not(:last-child)::after {
                        content: " • ";
                    }
                </style>
                <div id="label">${label}</div>
                <div id="metadata">${metadata}</div>
            `
        }
    }
}

customElements.define('calendar-item', CalendarItem)
