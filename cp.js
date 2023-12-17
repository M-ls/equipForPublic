const { rootPath } = require("./settings.json");
//解包目录 注意斜线方向

const path = require("path");
const fs = require("fs");

const map = {
    "/settings/item/Custom_Weapon.tab": "/Custom_Weapon.tab",
    "/settings/item/Custom_Armor.tab": "/Custom_Armor.tab",
    "/settings/item/Custom_Trinket.tab": "/Custom_Trinket.tab",
    "/settings/item/Attrib.tab": "/Attrib.tab",
    "/settings/item/Enchant.tab": "/Enchant.tab",
    "/settings/maplist.tab": "/maplist.tab",
    "/settings/skill/skillevent.tab": "/skillevent.tab",
};

for (let source in map) {
    const target = map[source];
    fs.copyFileSync(path.join(rootPath, source), path.join(__dirname, "/raw/", target));
}
