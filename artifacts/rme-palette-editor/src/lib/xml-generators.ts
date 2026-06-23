import { BorderItem, GroundItem, DoodadItem, CarpetItem, WallItem, TilesetItem, CarpetAlignDirection } from "./types";

const CARPET_DIR_ORDER: CarpetAlignDirection[] = [
  "n", "e", "s", "w",
  "cnw", "cne", "cse", "csw",
  "dnw", "dne", "dse", "dsw",
  "center",
];

export function generateBordersXml(borders: BorderItem[]): string {
  let xml = "";
  for (const border of borders) {
    const hasContent =
      border.comment ||
      border.group !== undefined ||
      Object.values(border.items).some((v) => v !== null);
    if (!hasContent) continue;
    const id = border.borderId ?? 0;
    xml += `<border id="${id}"${border.group ? ` group="${border.group}"` : ""}>${border.comment ? ` <!-- ${border.comment} -->` : ""}\n`;
    const directions = ["n", "w", "e", "s", "cnw", "cne", "cse", "csw", "dnw", "dne", "dse", "dsw"] as const;
    for (const dir of directions) {
      const item = border.items[dir];
      if (item !== null && item !== undefined) {
        xml += `  <borderitem edge="${dir}" item="${item}"/>\n`;
      }
    }
    xml += `</border>\n`;
  }
  return xml.trimEnd();
}

export function generateGroundsXml(grounds: GroundItem[]): string {
  let xml = "";
  for (const ground of grounds) {
    if (!ground.name) continue;
    let attrs = `name="${ground.name}" type="ground"`;
    attrs += ` server_lookid="${ground.serverLookId ?? 0}"`;
    if (ground.zOrder !== undefined) attrs += ` z-order="${ground.zOrder}"`;
    xml += `<brush ${attrs}>\n`;
    for (const item of ground.items)
      xml += `  <item id="${item.id}" chance="${item.chance}"/>\n`;
    for (const border of ground.borders) {
      let bAttrs = `align="${border.align}"`;
      if (border.to !== undefined && border.to !== "") bAttrs += ` to="${border.to}"`;
      bAttrs += ` id="${border.id}"`;
      xml += `  <border ${bAttrs}/>\n`;
    }
    for (const friend of ground.friends) {
      if (friend && friend.trim()) xml += `  <friend name="${friend.trim()}"/>\n`;
    }
    xml += `</brush>\n`;
  }
  return xml.trimEnd();
}

export function generateDoodadsXml(doodads: DoodadItem[]): string {
  let xml = "";
  for (const doodad of doodads) {
    if (!doodad.name) continue;
    let attrs = `name="${doodad.name}" type="doodad"`;
    if (doodad.serverLookId)             attrs += ` server_lookid="${doodad.serverLookId}"`;
    if (doodad.draggable !== undefined)  attrs += ` draggable="${doodad.draggable}"`;
    if (doodad.onBlocking !== undefined) attrs += ` on_blocking="${doodad.onBlocking}"`;
    if (doodad.thickness)                attrs += ` thickness="${doodad.thickness}"`;
    xml += `<brush ${attrs}>\n`;

    for (const el of doodad.elements) {
      if (el.type === "simple") {
        if (el.alternate) {
          xml += `  <alternate>\n    <item id="${el.id}" chance="${el.chance}"/>\n  </alternate>\n`;
        } else {
          xml += `  <item id="${el.id}" chance="${el.chance}"/>\n`;
        }
      } else if (el.type === "composite") {
        const lines: string[] = [
          `    <composite chance="${el.chance}">`,
          ...el.tiles.map((t) => `      <tile x="${t.x}" y="${t.y}"> <item id="${t.itemId}"/> </tile>`),
          `    </composite>`,
        ];
        if (el.alternate) {
          xml += `  <alternate>\n${lines.join("\n")}\n  </alternate>\n`;
        } else {
          xml += lines.map((l) => l.trimStart() === l ? "  " + l : l).join("\n").replace(/^    /gm, "  ") + "\n";
        }
      } else if (el.type === "alternate") {
        xml += `  <alternate>\n`;
        for (const item of el.items)
          xml += `    <item id="${item.id}" chance="${item.chance}"/>\n`;
        xml += `  </alternate>\n`;
      }
    }

    xml += `</brush>\n`;
  }
  return xml.trimEnd();
}

export function generateCarpetsXml(carpets: CarpetItem[]): string {
  let xml = "";
  for (const carpet of carpets) {
    if (!carpet.name) continue;
    let attrs = `name="${carpet.name}" type="carpet"`;
    if (carpet.serverLookId) attrs += ` server_lookid="${carpet.serverLookId}"`;
    xml += `<brush ${attrs}>\n`;
    for (const dir of CARPET_DIR_ORDER) {
      const data = carpet.carpets[dir];
      if (!data) continue;
      if (data.type === "single" && data.id) {
        xml += `  <carpet align="${dir}" id="${data.id}"/>\n`;
      } else if (data.type === "multi" && data.items.length > 0) {
        xml += `  <carpet align="${dir}">\n`;
        for (const item of data.items)
          xml += `    <item chance="${item.chance}" id="${item.id}"/>\n`;
        xml += `  </carpet>\n`;
      }
    }
    xml += `</brush>\n`;
  }
  return xml.trimEnd();
}

export function generateWallsXml(walls: WallItem[]): string {
  let xml = "";
  for (const wall of walls) {
    if (!wall.name) continue;
    let attrs = `name="${wall.name}" type="wall"`;
    if (wall.serverLookId)            attrs += ` server_lookid="${wall.serverLookId}"`;
    if (wall.draggable !== undefined) attrs += ` draggable="${wall.draggable}"`;
    if (wall.onBlocking !== undefined) attrs += ` on_blocking="${wall.onBlocking}"`;
    if (wall.thickness)               attrs += ` thickness="${wall.thickness}"`;
    xml += `<brush ${attrs}>\n`;

    if (wall.alternate && wall.alternate.length > 0) {
      xml += `  <alternate>\n`;
      for (const item of wall.alternate)
        xml += `    <item id="${item.id}" chance="${item.chance}"/>\n`;
      xml += `  </alternate>\n`;
    } else if (wall.walls) {
      const types = ["horizontal", "vertical", "corner", "pole"] as const;
      for (const t of types) {
        const data = wall.walls[t];
        if (data && (data.items.length > 0 || data.doors.length > 0)) {
          xml += `  <wall type="${t}">\n`;
          for (const item of data.items)
            xml += `    <item id="${item.id}" chance="${item.chance}"/>\n`;
          for (const door of data.doors) {
            let dAttrs = `id="${door.id}" type="${door.type}"`;
            if (door.open   !== undefined) dAttrs += ` open="${door.open}"`;
            if (door.locked !== undefined) dAttrs += ` locked="${door.locked}"`;
            xml += `    <door ${dAttrs}/>\n`;
          }
          xml += `  </wall>\n`;
        }
      }
    }

    if (wall.friends) {
      for (const friend of wall.friends)
        xml += `  <friend name="${friend.name}"${friend.redirect !== undefined ? ` redirect="${friend.redirect}"` : ""}/>\n`;
    }

    xml += `</brush>\n`;
  }
  return xml.trimEnd();
}

export function generateTilesetsXml(tilesets: TilesetItem[]): string {
  let xml = "";
  for (const tileset of tilesets) {
    if (!tileset.name) continue;
    xml += `<tileset name="${tileset.name}">\n`;
    for (const section of tileset.sections) {
      if (section.entries.length === 0) continue;
      xml += `\t<${section.type}>\n`;
      for (const entry of section.entries) {
        if (entry.kind === "brush") {
          xml += `\t\t<brush name="${entry.name}"/>\n`;
        } else if (entry.kind === "item") {
          xml += `\t\t<item id="${entry.id}"/>\n`;
        } else if (entry.kind === "range") {
          xml += `\t\t<item fromid="${entry.fromid}" toid="${entry.toid}"/>\n`;
        }
      }
      xml += `\t</${section.type}>\n`;
    }
    xml += `</tileset>\n`;
  }
  return xml.trimEnd();
}
