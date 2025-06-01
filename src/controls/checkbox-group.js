export class CheckboxGroup extends HTMLElement {
    constructor(data = null, config = {}) {
        super()
        this.attachShadow({ mode: "open" })
        this.config = config
        this.selectedItems = new Set()
        this.data = {}
        this.groupLabel = ""
        this.storageKey = null
        if (data) this.setData(data)
    }

    connectedCallback() {
        this.shadowRoot.addEventListener("click", this.handleClick.bind(this))
        if (this.groupLabel) {
            this.loadFromStorage()
            this.render()
        }
    }

    setData(data) {
        this.groupLabel = Object.keys(data)[0]
        this.data = data[this.groupLabel] ?? []

        // Generate storage key with sanitized pathname
        const sanitizedPath = location.pathname.replace(/[\/\s]+/g, "-").replace(/^-+|-+$/g, "")
        const sanitizedLabel = this.groupLabel.toLowerCase().replace(/\s+/g, "-")
        this.storageKey = `checkbox-group-${sanitizedPath}-${sanitizedLabel}`

        this.selectedItems.clear()
        this.loadFromStorage()

        if (this.isConnected) {
            this.render()
        }
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
                #checkboxes {
                    display: flex;
                    flex-wrap: wrap;
                    gap: .5em;
                }
                #category-name {
                    font-variant: small-caps;
                    font-weight: bold;
                }
                label {
                    user-select: none;
                }
            </style>
            <div id="category-name">${this.groupLabel}</div>
            <button type="button" class="select-all">${this.config.labels.filtersAll}</button>
            <div id="checkboxes">
            ${this.data.map(val => `
                <label>
                    <input type="checkbox" value="${val}">
                    ${val}
                </label>
            `).join("")}
            </div>
        `
        this.syncCheckboxes()
    }

    handleClick(event) {
        if (event.target.classList.contains("select-all")) {
            // Toggle all - if all selected, clear; otherwise select all
            const allSelected = this.data.every(val => this.selectedItems.has(val))
            if (allSelected) {
                this.selectedItems.clear()
            } else {
                this.data.forEach(val => this.selectedItems.add(val))
            }
            this.syncCheckboxes()
            this.saveToStorage()
            this.emitChange()
            return
        }

        const checkbox = event.target.type === "checkbox"
            ? event.target
            : event.target.querySelector("input[type=checkbox]")

        if (!checkbox) return

        if (event.shiftKey) {
            this.selectedItems.clear()
            this.selectedItems.add(checkbox.value)
            this.syncCheckboxes()
        } else {
            if (checkbox.checked) {
                this.selectedItems.add(checkbox.value)
            } else {
                this.selectedItems.delete(checkbox.value)
            }
        }

        this.saveToStorage()
        this.emitChange()
    }

    saveToStorage() {
        if (this.storageKey) {
            localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.selectedItems)))
        }
    }

    loadFromStorage() {
        if (!this.storageKey) return

        const stored = localStorage.getItem(this.storageKey)
        if (stored) {
            try {
                const storedItems = JSON.parse(stored)
                // Only keep items that still exist in current data
                this.selectedItems = new Set(storedItems.filter(item => this.data.includes(item)))

                // Emit change event if we loaded any items
                if (this.selectedItems.size > 0) {
                    this.emitChange()
                }
            } catch (e) {
                console.warn("Failed to load from storage:", e)
            }
        }
    }

    syncCheckboxes() {
        const checkboxes = this.shadowRoot.querySelectorAll("input[type=checkbox]")
        checkboxes.forEach(cb => {
            cb.checked = this.selectedItems.has(cb.value)
        })
    }

    emitChange() {
        this.dispatchEvent(new CustomEvent("selectionchange", {
            detail: {
                selected: Array.from(this.selectedItems),
                groupLabel: this.groupLabel
            },
            bubbles: true,
            composed: true,
        }))
    }
}

customElements.define("checkbox-group", CheckboxGroup)
