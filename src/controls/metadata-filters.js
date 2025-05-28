import { CalendarEvent } from '../events/calendar-event.js'
import { CheckboxGroup } from './checkbox-group.js'


export class MetadataFilter extends HTMLElement {
    constructor(data = null) {
        super()
        this.attachShadow({ mode: "open" })
        this.data = data
        this.selections = {} // { category: ['val1', 'val2'] }
        this.metadata = {}
        if (data) this.setData(data)
    }

    setData(data) {
        this.data = data
        this.metadata = this.extractMetadata(data)
        this.attachEventListeners()
        this.render()
    }

    extractMetadata(data) {
        const metadata = {}
        data.forEach(item => {
            Object.entries(item).forEach(([key, value]) => {
                if (!CalendarEvent.EXCLUDED_KEYS.has(key) && value != null) {
                    if (!metadata[key]) metadata[key] = new Set()
                    metadata[key].add(value)
                }
            })
        })

        // Convert Sets to Arrays and sort for consistent ordering
        return Object.fromEntries(
            Object.entries(metadata).map(([key, valueSet]) => [key, Array.from(valueSet).sort()])
        )
    }

    handleSelectionChange(event) {
        const { selected, groupLabel } = event.detail
        this.selections[groupLabel] = selected
        this.emitFilterChange()
    }

    emitFilterChange() {
        this.dispatchEvent(new CustomEvent("filter-change", {
            detail: {
                type: "metadata",
                selections: this.selections
            },
            bubbles: true
        }))
    }

    render() {
        if (!this.metadata || Object.keys(this.metadata).length === 0) {
            this.shadowRoot.innerHTML = "<div>No filters available</div>"
            return
        }

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                checkbox-group {
                    margin-bottom: 1rem;
                }
                checkbox-group + checkbox-group {
                    border-top: 1px solid currentColor;
                }
            </style>
        `

        // Create and append checkbox groups
        Object.entries(this.metadata).forEach(([category, values]) => {
            const checkboxGroup = new CheckboxGroup({ [category]: values })
            this.shadowRoot.appendChild(checkboxGroup)
        })
    }

    attachEventListeners() {
        this.shadowRoot.addEventListener("selectionchange", this.handleSelectionChange.bind(this))
    }
}

customElements.define("metadata-filter", MetadataFilter)
