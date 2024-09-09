"use strict"

const BASE_COLOR = [53, 53, 53];
const AXIS_X_COLOR = [100, 110, 10];
const AXIS_Y_COLOR = [10, 60, 130];

function rgb_to_css(r, g, b, a) {
    return `rgb(${[r, g, b].join(' ')} / ${a})`;
}

function int_lerp(start, end, count) {
    const diff = end - start;
    const inc = diff / count;
    return range(count).map(
        (_, index) => Math.round(start + inc * index)
    );
}

function range(end) {
    return Array.from(Array(end).keys());
}

function combine_colors(a, b) {
    // Really should use a better color space than RGB. Apparently JS supports OKLAB now?
    // With colors that overlap, this produces more vivid colors than arithmetic mean
    return range(3).map((_, index) => Math.round(Math.sqrt(a[index] * b[index])));
}

function set_cell_opacity(table, opacity) {
    for (const row of table.rows) {
        for (const cell of row.cells) {
            const current_background_color = cell.style.backgroundColor;
            const components = current_background_color.match(/[\d.]+/g);
            cell.style.backgroundColor = rgb_to_css(components[0], components[1], components[2], opacity);
        }
    }
}

function set_table_cell_color(table) {
    const y = table.rows.length;
    const x = table.rows[y - 1].cells.length;
    const colors_x_r = int_lerp(BASE_COLOR[0], AXIS_X_COLOR[0], x);
    const colors_x_g = int_lerp(BASE_COLOR[1], AXIS_X_COLOR[1], x);
    const colors_x_b = int_lerp(BASE_COLOR[2], AXIS_X_COLOR[2], x);
    const colors_y_r = int_lerp(BASE_COLOR[0], AXIS_Y_COLOR[0], y);
    const colors_y_g = int_lerp(BASE_COLOR[1], AXIS_Y_COLOR[1], y);
    const colors_y_b = int_lerp(BASE_COLOR[2], AXIS_Y_COLOR[2], y);
    const colors_x_rgb = range(x).map(
        (_, index) => [colors_x_r[index], colors_x_g[index], colors_x_b[index]]
    );
    const colors_y_rgb = range(y).map(
        (_, index) => [colors_y_r[index], colors_y_g[index], colors_y_b[index]]
    );
    for (const [i, row] of Array.from(table.rows).entries()) {
        for (const [j, cell] of Array.from(row.cells).entries()) {
            const cell_color_rgb = combine_colors(colors_x_rgb[j], colors_y_rgb[y - i - 1]);
            cell.style.backgroundColor = rgb_to_css(...cell_color_rgb, 1);
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
fill_table(tier_grid, 10, 10);
set_table_cell_color(tier_grid);
const containers = Array.from(tier_grid.rows).flatMap(
    row => Array.from(row.cells).map(table_cell => table_cell.children[0])).concat([image_bank]);
const drake = dragula(containers);
