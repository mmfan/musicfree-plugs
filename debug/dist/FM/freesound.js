"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");
const CryptoJS = require("crypto-js");
const searchRows = 20;
const host="http://tv.zanlagua.com/";
async function getTopLists() {
        
    const html = await axios_1.default.get(host+"gettoplist.php");
   const obj=html.data;
   return [eval('(' + obj + ')')];
    
}

async function getTopListDetail(topListItem) {
    const data = await axios_1.default.get(host+"gettoplistdetail.php?id="+topListItem.id);
    return eval('(' + data.data + ')');
}

async function getMediaSource(musicItem, quality) {
     const data = await axios_1.default.get(host+"getMediaSource.php?id="+musicItem.id+"&qu="+quality);
      
     return{
      url: data.data,
     };
}

module.exports = {
  /** 用来说明插件信息的属性 */
  platform: "我的FM", // 插件名
  version: "1.0.9", // 插件版本号
  hints: {
        importMusicSheet: [
            "我的FM电台，自己收藏",

        ],
    },
    primaryKey: ["id"],
    cacheControl: "no-cache",
    srcUrl: "http://tv.zanlagua.com/cj.js",
  /** 供给软件在合适的时机调用的函数 */

  getTopLists,
  getTopListDetail,
  getMediaSource,
};