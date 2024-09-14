"use strict"

const AXIS_X_COLOR_ADDITION_OKLCH = [0, 0.1, 330];
const AXIS_Y_COLOR_ADDITION_OKLCH = [0, 0.1, 170];
const HUE_MIDPOINT = (AXIS_X_COLOR_ADDITION_OKLCH[2] + AXIS_Y_COLOR_ADDITION_OKLCH[2]) / 2;

function add_oklch_color(color_var_name, components, a) {
    return `oklch(from var(--${color_var_name}) calc(l + ${components[0]}) calc(c + ${components[1]}) calc(h + ${components[2]}) / ${a})`;
}

function color_combiner(hue_midpt) {
    return function combine_colors(x, y) {
        // We don't want the lightness to be more than the sum of its parts
        // Raising chroma to a higher power creates a nicer gradient
        // Take the average hue

        return [
            Math.max(x[0], y[0]),       // L
            Math.max(x[1], y[1]),       // C
            x[2] - y[2] + hue_midpt     // H
        ];
    }
}

function set_cell_opacity(table, opacity) {
    for (const row of table.rows) {
        for (const cell of row.cells) {
            const current_background_color = cell.style.backgroundColor;
            const components = Array.from(current_background_color.matchAll(/[\d.]+/g));
            console.assert(components.length == 4);
            const opacity_match = components[3];
            cell.style.backgroundColor = current_background_color.slice(0, opacity_match.index) + opacity + current_background_color.slice(opacity_match.index + opacity_match.length);
        }
    }
}

function set_table_cell_color(table) {
    const y = table.rows.length;
    const x = table.rows[y - 1].cells.length;
    const combine_colors = color_combiner(HUE_MIDPOINT);
    for (const [i, row] of Array.from(table.rows).entries()) {
        for (const [j, cell] of Array.from(row.cells).entries()) {
            const colors_x_lch = [
                AXIS_X_COLOR_ADDITION_OKLCH[0] * j / x,
                AXIS_X_COLOR_ADDITION_OKLCH[1] * j / x,
                // lerp from H_X to HUE_MIDPT, offset by -HUE_MIDPT
                (HUE_MIDPOINT - AXIS_X_COLOR_ADDITION_OKLCH[2]) * j / x,
            ];
            const colors_y_lch = [
                AXIS_Y_COLOR_ADDITION_OKLCH[0] * (y - i - 1) / y,
                AXIS_Y_COLOR_ADDITION_OKLCH[1] * (y - i - 1) / y,
                // lerp from HUE_MIDPT to Y_H, offset by -HUE_MIDPT
                (AXIS_Y_COLOR_ADDITION_OKLCH[2] - HUE_MIDPOINT) * (y - i - 1) / y,
            ];
            const cell_color = combine_colors(colors_x_lch, colors_y_lch);
            const new_color = add_oklch_color("base-color", cell_color, 1);
            cell.style.backgroundColor = new_color;
            // for debugging
            // cell.innerText = String(cell_color[2]).slice(0, 4);
        }
    }
}

function fill_table(table, x, y) {
    for (let i = 0; i < y; i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < x; j++) {
            const table_cell = document.createElement("td");
            const cell = document.createElement("div");
            cell.className = "table-cell";
            table_cell.appendChild(cell);
            row.appendChild(table_cell);
        }
        table.appendChild(row);
    }
}

function add_to_drag_zone(ev) {
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
            image_bank_label.hidden = true;
            image_bank.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}


function drag_zone_prevent_default_drag(ev) {
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
}

const tier_grid = document.getElementById("tier-grid");
const image_bank = document.getElementById("image-bank");
const image_bank_label = document.getElementById("image-bank-label");
fill_table(tier_grid, 7, 7);
set_table_cell_color(tier_grid);
const containers = Array.from(tier_grid.rows).flatMap(
    row => Array.from(row.cells).map(table_cell => table_cell.children[0])).concat([image_bank]);
const drake = dragula(containers);
