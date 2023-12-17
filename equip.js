const fs = require("fs");
const lodash = require("lodash");
const settings = require("./settings.json");
const { readTabFile } = require("./utils.js");
const wf = require("./writeFile.js");

const process = async () => {
    //引入文件
    let weapon = await readTabFile("./raw/Custom_Weapon.tab");
    let armor = await readTabFile("./raw/Custom_Armor.tab");
    let trinket = await readTabFile("./raw/Custom_Trinket.tab");
    let attrib = await readTabFile("./raw/Attrib.tab");
    let enchant = await readTabFile("./raw/Enchant.tab");
    const skill_event = await readTabFile("./raw/skillevent.tab");
    const maplist = await readTabFile("./raw/maplist.tab");

    //装备品级，附魔最小ID
    let level = settings.level;
    let enchantLevel = settings.enchantMinID;

    //装备过滤后字典 大概是个对象套数组套对象
    let equips = {};
    let secEquips = {};
    let lasEquips = {};
    //附魔字典
    let enchants = {};
    let secEnchants = {};
    let lasEnchants = {};
    //最终表头组
    let lastEquipHeaders = {};
    let lastEnchantHeaders = {};
    //属性主键
    let attrib_object = {};
    for (let attr of attrib) {
        attrib_object[attr.ID] = attr;
    }

    //装备类型字典 这是个对象套数组
    const headers = {
        subtype: [
            "maozi",
            "shangzhuang",
            "yaodai",
            "hushou",
            "xiazhuang",
            "xiezi",
            "anqi",
            "wuqi",
            "xianglian",
            "yaozhui",
            "jiezhi",
        ],
        list: [armor, armor, armor, armor, armor, armor, weapon, weapon, trinket, trinket, trinket],
        subtypeID: ["3", "2", "6", "10", "8", "9", "1", "0", "4", "7", "5"],
        enchantSubtype: ["帽子", "上装", "腰带", "护手", "下装", "鞋子", "暗器", "武器", "项链", "腰坠", "戒指"],
    };

    //需求有效属性
    let attribNeed = {
        攻击: ["atMagicAttackPowerBase", "atNeutralAttackPowerBase"],
        元气: ["atSpunkBase"],
        加速: ["atHasteBase"],
        会心: ["atAllTypeCriticalStrike", "atNeutralCriticalStrike"],
        会效: ["atAllTypeCriticalDamagePowerBase"],
        破防: ["atMagicOvercome", "atNeutralOvercomeBase"],
        无双: ["atStrainBase"],
        破招: ["atSurplusValueBase"],
        体质: ["atVitalityBase"],
        精简: ["atSpiritBase", "atStrengthBase", "atAgilityBase"],
        特效: ["atSkillEventHandler"],
    };
    let enchantAttribNeed = {
        atMagicAttackPowerBase: ["攻击"],
        atSurplusValueBase: ["破招"],
        atStrainBase: ["无双"],
        atHasteBase: ["加速", "急速"],
        atAllTypeCriticalStrike: ["会心"],
        atMagicOvercome: ["破防"],
        atSpunkBase: ["元气"],
        atVitalityBase: ["体质"],
        atMaxLifeBase: ["生命", "气血"],
        atDamageToLifeForSelf: ["吸血"],
    };

    //整理源表头过滤
    let requires = ["ID", "Name", "Level", "MaxStrengthLevel", "Diamond1", "Diamond2", "Diamond3"];
    //新增Param属性表头和文字属性表头
    for (let i = 1; i <= 12; i++) {
        requires.push("attribModify" + i);
        requires.push("attribParam" + i);
    }
    for (let key in attribNeed) {
        requires.push(key);
    }
    console.time("执行时长:");
    //装备附魔类型初次过滤 武器、戒指特殊过滤
    for (i = 0; i < headers.subtype.length; i++) {
        const commonFilter = (item) =>
            parseInt(item.Level) >= level &&
            item.SubType == headers.subtypeID[i] &&
            item.MapBanEquipItemMask != 1 &&
            item.Name != "测试装备";

        // const filterMap = {
        //     0: (item) => commonFilter(item) && item.IsPVEEquip == 1 && item.DetailType == "5",
        //     5: (item) => commonFilter(item) && (item.IsPVEEquip == 1 || item.MaxStrengthLevel == "8"),
        //     default: (item) => commonFilter(item) && item.IsPVEEquip == 1 && item.Name != "测试装备",
        // };
        // equips[headers.subtype[i]] = headers.list[i].filter(filterMap[headers.subtypeID[i]] || filterMap.default);

        switch (headers.subtypeID[i]) {
            case "0": {
                equips[headers.subtype[i]] = headers.list[i].filter(
                    (item) => commonFilter(item) && item.IsPVEEquip == 1 && item.DetailType == "5"
                );
                break;
            }
            case "5": {
                equips[headers.subtype[i]] = headers.list[i].filter(
                    (item) => commonFilter(item) && (item.IsPVEEquip == 1 || item.MaxStrengthLevel == "8")
                );
                break;
            }
            default: {
                equips[headers.subtype[i]] = headers.list[i].filter(
                    (item) => commonFilter(item) && item.IsPVEEquip == 1 && item.Name != "测试装备"
                );
            }
        }
        //附魔
        enchants[headers.enchantSubtype[i]] = enchant.filter(
            (item) =>
                ((Number(item.ID) >= enchantLevel && item.UIID == headers.enchantSubtype[i]) ||
                    (Number(item.ID) == 420 && headers.enchantSubtype[i] == "武器")) &&
                item.Name != "废弃附魔ID" &&
                Object.keys(enchantAttribNeed).some((attr) => item.Attribute1ID == attr)
        );
    }
    wf.outputJSON("./output/rawEnchant.json", enchants);
    //magicID转属性
    for (const key in equips) {
        for (let equip of equips[key]) {
            //镶嵌
            for (i = 1; i <= 3; i++) {
                if (equip["DiamondAttributeID" + i] > 0) {
                    equip["Diamond" + i] = attrib_object[equip["DiamondAttributeID" + i]].ModifyType;
                }
            }
            //属性
            for (let i = 1; i <= 12; i++) {
                let attr = attrib_object[equip[`Magic${i}Type`]];
                if (attr && attr.ID != 0) {
                    equip["attribModify" + i] = attr.ModifyType;
                    equip["attribParam" + i] = attr.Param1Min;
                }
                for (let [key, value] of Object.entries(attribNeed)) {
                    for (let k of value) {
                        if (k == equip["attribModify" + i]) {
                            equip[key] = equip["attribParam" + i];
                        }
                    }
                }
            }
            equip = lodash.pick(equip, requires);
        }
    }

    // secEquips = equips.map((positions) => positions.filter((item) => parseInt(item.攻击) > 0 && !item.精简));
    // 二次过滤 equips
    for (i = 0; i < headers.subtype.length; i++) {
        secEquips[headers.subtype[i]] = equips[headers.subtype[i]].filter(
            (item) => parseInt(item.攻击) > 0 && !item.精简
        );
    }
    wf.outputJSON("./output/rawData.json", secEquips);

    //三次过滤 输出最终导出格式
    for (let obj in secEquips) {
        let x = headers.subtype.indexOf(obj);
        let subType = headers.enchantSubtype[x];
        let subID = headers.subtypeID[x];
        //最终表头 ID type1 type2 Strength
        let lastRequires = [
            subType + "ID",
            "显示名称",
            "外显名称",
            "装备品质",
            "攻击",
            "元气",
            "加速",
            "会心",
            "会效",
            "破防",
            "无双",
            "破招",
            "体质",
            subID + "type1",
            subID + "type2",
            subID + "type3",
            subID + "Strength",
            "event",
            "level",
            "Use",
            "唯一",
            "装备类型",
        ];
        lastEquipHeaders[subType] = lastRequires;
        lasEquips[subType] = [];

        for (let i = 0; i < secEquips[obj].length; i++) {
            const skill_event_id = secEquips[obj][i]["特效"];
            let eventSkillID = "0",
                eventSkillLevel = "0";
            if (skill_event_id) {
                const skill_event_item = skill_event.find((item) => item.ID == skill_event_id);
                if (skill_event_item) {
                    const { SkillID, SkillLevel } = skill_event_item;
                    eventSkillID = SkillID;
                    eventSkillLevel = SkillLevel;
                }
            }

            lasEquips[subType][i] = {};
            lasEquips[subType][i][lastEquipHeaders[subType][0]] = secEquips[obj][i]["ID"];
            lasEquips[subType][i][lastEquipHeaders[subType][1]] = secEquips[obj][i]["Name"];
            lasEquips[subType][i][lastEquipHeaders[subType][2]] =
                secEquips[obj][i]["Name"] +
                "·" +
                secEquips[obj][i]["Level"] +
                "品" +
                (secEquips[obj][i]["元气"] > 0 ? "" : secEquips[obj][i]["体质"] > 0 ? "·有体精简" : "·无体精简") +
                (settings.schoolSet.some((item) => secEquips[obj][i]["Name"].includes(item)) ? "·套装" : "") +
                (settings.craftSet.some((item) => secEquips[obj][i]["Name"].includes(item)) ? "·切糕" : "") +
                (secEquips[obj][i]["SkillID"] > 0 && subID == "7" ? "·特效" : "") +
                (eventSkillID == "4877" ? "·水特效" : "") +
                "（" +
                (secEquips[obj][i]["加速"] > 0 ? "加速" : "") +
                (secEquips[obj][i]["会效"] > 0 ? "双会" : secEquips[obj][i]["会心"] > 0 ? "会心" : "") +
                (secEquips[obj][i]["破防"] > 0 ? "破防" : "") +
                (secEquips[obj][i]["破招"] > 0 ? "破招" : "") +
                (secEquips[obj][i]["无双"] > 0 ? "无双" : "") +
                "）";
            lasEquips[subType][i][lastEquipHeaders[subType][3]] = secEquips[obj][i]["Level"];
            lasEquips[subType][i][lastEquipHeaders[subType][4]] = secEquips[obj][i]["攻击"] || "0";
            lasEquips[subType][i][lastEquipHeaders[subType][5]] = secEquips[obj][i]["元气"] || "0";
            lasEquips[subType][i][lastEquipHeaders[subType][6]] = secEquips[obj][i]["加速"] || "0";
            lasEquips[subType][i][lastEquipHeaders[subType][7]] = secEquips[obj][i]["会心"] || "0";
            lasEquips[subType][i][lastEquipHeaders[subType][8]] = secEquips[obj][i]["会效"] || "0";
            lasEquips[subType][i][lastEquipHeaders[subType][9]] = secEquips[obj][i]["破防"] || "0";
            lasEquips[subType][i][lastEquipHeaders[subType][10]] = secEquips[obj][i]["无双"] || "0";
            lasEquips[subType][i][lastEquipHeaders[subType][11]] = secEquips[obj][i]["破招"] || "0";
            lasEquips[subType][i][lastEquipHeaders[subType][12]] = secEquips[obj][i]["体质"] || "0";
            lasEquips[subType][i][lastEquipHeaders[subType][13]] = secEquips[obj][i]["Diamond1"];
            lasEquips[subType][i][lastEquipHeaders[subType][14]] = secEquips[obj][i]["Diamond2"];
            lasEquips[subType][i][lastEquipHeaders[subType][15]] = secEquips[obj][i]["Diamond3"];
            lasEquips[subType][i][lastEquipHeaders[subType][16]] = secEquips[obj][i]["MaxStrengthLevel"];

            lasEquips[subType][i][lastEquipHeaders[subType][17]] = subID == "0" ? eventSkillID : undefined;
            lasEquips[subType][i][lastEquipHeaders[subType][18]] = subID == "0" ? eventSkillLevel : undefined;
            lasEquips[subType][i][lastEquipHeaders[subType][19]] =
                subID == "7" ? secEquips[obj][i]["SkillID"] || "0" : undefined;
            lasEquips[subType][i][lastEquipHeaders[subType][20]] =
                subID == "5" ? secEquips[obj][i]["MaxExistAmount"] || "0" : undefined;
            lasEquips[subType][i][lastEquipHeaders[subType][21]] = secEquips[obj][i]["Name"].includes(settings.slEquip)
                ? "2"
                : String(Number(!secEquips[obj][i]["元气"] > 0));
        }
    }
    wf.outputJSON("./output/outputData.json", lasEquips);
    for (let obj in enchants) {
        let x = headers.enchantSubtype.indexOf(obj);
        let subType = obj;
        let subID = headers.subtypeID[x];
        let lastRequires = [(subID != "4" ? subID : "47") + "附魔id", "显示名称", "属性1", "数值", "装分"];
        const [enchantID, displayName, attribute, value, score] = lastRequires;
        lastEnchantHeaders[subType] = lastRequires;
        secEnchants[subType] = [];
        secEnchants[subType][0] = {
            [enchantID]: "0",
            [displayName]: "无",
            [attribute]: "0",
            [value]: "0",
            [score]: "0",
        };

        for (let i = 0; i < enchants[obj].length; i++) {
            secEnchants[subType][i + 1] = {
                [enchantID]: enchants[obj][i]["ID"],
                [displayName]: enchants[obj][i]["AttriName"].replace(/\d+/g, enchants[obj][i]["Attribute1Value1"]),
                [attribute]: enchants[obj][i]["Attribute1ID"],
                [value]: enchants[obj][i]["Attribute1Value1"],
                [score]: enchants[obj][i]["Score"],
            };
            if (
                !enchantAttribNeed[enchants[obj][i]["Attribute1ID"]].some((item) =>
                    enchants[obj][i]["AttriName"].includes(item)
                )
            ) {
                console.warn("注意附魔 " + enchants[obj][i]["ID"] + " 描述与属性可能不符");
            }
        }
    }
    let enchantKeys = ["帽子", "上装", "腰带", "护手", "下装", "鞋子", "暗器", "武器", "戒指", "项链"];
    enchantKeys.forEach((key) => {
        lasEnchants[key] = secEnchants[key];
    });
    wf.outputJSON("./output/outputEnchant.json", lasEnchants);
    //  输出文件
    wf.outputFile("./output/outputData.json", "./output/output.csv");
    wf.outputFile("./output/outputEnchant.json", "./output/outputEnchant.csv");

    console.timeEnd("执行时长:");
};

process();
