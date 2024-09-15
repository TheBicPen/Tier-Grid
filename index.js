"use strict"

class TierGrid {
    #tier_grid;
    #color_x_layer;
    #color_y_layer;
    #image_bank;
    #image_bank_label;

    static #BASE_COLOR_CSS_NAME = "base-color";

    constructor(tier_grid_element, init_x, init_y, color_x_layer, color_y_layer, image_bank, image_bank_label) {
        this.#tier_grid = tier_grid_element;
        this.#color_x_layer = color_x_layer;
        this.#color_y_layer = color_y_layer;
        this.#image_bank = image_bank;
        this.#image_bank_label = image_bank_label;

        // Fill grid cells per initial dimensions
        for (let i = 0; i < init_y; i++) {
            const row = document.createElement("tr");
            for (let j = 0; j < init_x; j++) {
                TierGrid.#add_cell(row);
            }
            this.#tier_grid.appendChild(row);
        }
        this.#update_tier_grid();
    }

    // Make cells draggable container and set their color
    #update_tier_grid() {
        TierGrid.#set_table_cell_color(this.#tier_grid, this.#color_x_layer, this.#color_y_layer);
        const containers = Array.from(this.#tier_grid.rows).flatMap(
            row => Array.from(row.cells).map(table_cell => table_cell.children[0])).concat([this.#image_bank]);
        dragula(containers);
    }

    static #add_oklch_color(components, a) {
        return `oklch(from var(--${TierGrid.#BASE_COLOR_CSS_NAME}) calc(l + ${components[0]}) calc(c + ${components[1]}) calc(h + ${components[2]}) / ${a})`;
    }

    static #combine_colors(x, y, hue_midpt) {
        return [
            // We don't want the lightness to be more than the sum of its parts
            Math.max(x[0], y[0]),               // L
            Math.max(x[1], y[1]),               // C
            // Take the average hue
            x[2] - y[2] + hue_midpt             // H
        ];
    }

    static #set_table_cell_color(table, x_color, y_color) {
        const hue_midpt = (x_color[2] + y_color[2]) / 2;
        const y = table.rows.length;
        const x = table.rows[y - 1].cells.length;
        for (const [i, row] of Array.from(table.rows).entries()) {
            for (const [j, cell] of Array.from(row.cells).entries()) {
                const colors_x_lch = [
                    x_color[0] * j / x,
                    x_color[1] * j / x,
                    // lerp from H_X to HUE_MIDPT, offset by -HUE_MIDPT
                    (hue_midpt - x_color[2]) * j / x,
                ];
                const colors_y_lch = [
                    y_color[0] * (y - i - 1) / y,
                    y_color[1] * (y - i - 1) / y,
                    // lerp from HUE_MIDPT to Y_H, offset by -HUE_MIDPT
                    (y_color[2] - hue_midpt) * (y - i - 1) / y,
                ];
                const cell_color = TierGrid.#combine_colors(colors_x_lch, colors_y_lch, hue_midpt);
                const new_color = TierGrid.#add_oklch_color(cell_color, 1);
                cell.style.backgroundColor = new_color;
                // for debugging
                // cell.innerText = String(cell_color[2]).slice(0, 4);
            }
        }
    }

    static #add_cell(row) {
        const table_cell = document.createElement("td");
        const cell = document.createElement("div");
        cell.className = "table-cell";
        table_cell.appendChild(cell);
        row.appendChild(table_cell);
    }

    set_cell_opacity(opacity) {
        for (const row of this.#tier_grid.rows) {
            for (const cell of row.cells) {
                const current_background_color = cell.style.backgroundColor;
                const components = Array.from(current_background_color.matchAll(/[\d.]+/g));
                console.assert(components.length == 4);
                const opacity_match = components[3];
                cell.style.backgroundColor = current_background_color.slice(0, opacity_match.index)
                    + opacity
                    + current_background_color.slice(opacity_match.index + opacity_match.length);
            }
        }
    }

    add_row() {
        const x = this.#tier_grid.rows[0].cells.length;
        const row = document.createElement("tr");
        this.#tier_grid.appendChild(row);
        for (let i = 0; i < x; i++) {
            TierGrid.#add_cell(row);
        }
        this.#update_tier_grid();
    }

    add_col() {
        for (const row of Array.from(this.#tier_grid.rows)) {
            TierGrid.#add_cell(row);
        }
        this.#update_tier_grid();
    }

    add_to_drag_zone(ev) {
        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();
        const dt = ev.dataTransfer;
        const files = dt.files;

        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                continue;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                this.#image_bank_label.hidden = true;
                this.#image_bank.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    }

    static drag_zone_prevent_default_drag(ev) {
        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();
    }
}


const AXIS_X_COLOR_OKLCH = [0, 0.1, 330];
const AXIS_Y_COLOR_OKLCH = [0, 0.1, 170];
const TIER_GRID = new TierGrid(
    document.getElementById("tier-grid"),
    7, 7,
    AXIS_X_COLOR_OKLCH, AXIS_Y_COLOR_OKLCH,
    document.getElementById("image-bank"),
    document.getElementById("image-bank-label")
);
