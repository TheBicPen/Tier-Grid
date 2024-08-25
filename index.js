"use strict"

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
const containers = Array.from(tier_grid.rows).flatMap(row => Array.from(row.cells).map(table_cell => table_cell.children[0])).concat([image_bank]);
const drake = dragula(containers);
