export class PeriodFilter extends HTMLElement {
    constructor(config) {
        super()
        this.attachShadow({ mode: "open" })
        this.config = config
        this.selectedValue = "all"
        this.storageKey = null
    }

    connectedCallback() {
        this.shadowRoot.addEventListener("change", this.handleChange.bind(this))
        this.generateStorageKey()
        this.loadFromStorage()
        this.render()
    }

    generateStorageKey() {
        const sanitizedPath = location.pathname.replace(/[\/\s]+/g, "-").replace(/^-+|-+$/g, "")
        this.storageKey = `period-filter-${sanitizedPath}`
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: grid;
                    grid-template-columns: 12ch auto 1fr;
                    gap: .5em;
                    align-items: start;
                    padding: .25em;
                }
                #period-filter-name {
                    font-variant: small-caps;
                    font-weight: bold;
                }
                #radio-group {
                    display: flex;
                    gap: 1em;
                }
                label {
                    user-select: none;
                    display: flex;
                    align-items: center;
                    gap: .25em;
                }
            </style>
            <div id="period-filter-name">${this.config.labels.periods}</div>
            <div></div>
            <div id="radio-group">
                <label>
                    <input type="radio" name="periods" value="all" ${this.selectedValue === "all" ? "checked" : ""}>
                    ${this.config.labels.periodsAll}
                </label>
                <label>
                    <input type="radio" name="periods" value="active" ${this.selectedValue === "active" ? "checked" : ""}>
                    ${this.config.labels.periodsActive}
                </label>
            </div>
        `
    }

    handleChange(event) {
        if (event.target.type === "radio") {
            this.selectedValue = event.target.value
            this.saveToStorage()
            this.emitChange()
        }
    }

    saveToStorage() {
        if (this.storageKey) {
            localStorage.setItem(this.storageKey, this.selectedValue)
        }
    }

    loadFromStorage() {
        if (!this.storageKey) return

        const stored = localStorage.getItem(this.storageKey)
        if (stored && (stored === "all" || stored === "active")) {
            this.selectedValue = stored

            // Emit change event if we loaded a non-default value
            if (this.selectedValue !== "all") {
                this.emitChange()
            }
        }
    }

    emitChange() {
        this.dispatchEvent(new CustomEvent("filter-change", {
            detail: {
                type: "periods",
                value: this.selectedValue
            },
            bubbles: true,
            composed: true,
        }))
    }
}

customElements.define("period-filter", PeriodFilter)
