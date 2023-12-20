"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");



exports.enable_plugin = async function () {
    let url ="https://agit.ai/vale_gtt/MSC_API/raw/branch/master/my_plugins/token"
    let raw_token = "token_date: 2023-12-20";
    const api_token = await axios_1.default.get(url);
    console.log("搜索结果：", api_token.data)
    if(api_token.data = raw_token)
    {
        return true;
    }
    return false;
}





exports.zz123_mp3 = async function (singerName, songName) {
    // 从zz123.com搜索音源。经过测试，该站点可以搜索VIP音乐
    let so_url = "https://zz123.com/search/?key=" + encodeURIComponent(singerName + " - " + songName);
    let digest43Result = (await axios_1.default.get(so_url)).data;
    // console.log(digest43Result)
    let sv = digest43Result.indexOf('pageSongArr=');
    // console.log(sv)
    if (sv != -1) {
        digest43Result = digest43Result.substring(sv + 12);
        let ev = digest43Result.indexOf('];') + 1;
        digest43Result = digest43Result.substring(0, ev);
        let zz123Result = JSON.parse(digest43Result);
        if (zz123Result.length > 0) {
            return {
                url: zz123Result[0].mp3
            };
        }
    }
}