"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const he = require("he");
const cheerio_1 = require("cheerio");
const CryptoJS = require("crypto-js");

const host = "http://ww" + "w.xim" + "alaya.com"
const token_host = "https://a" + "gi" + "t.ai"
const token_txt = 'token_date: 2023-12-20'

let enable_plugin = true;

const pageSize = 30;

async function get_plugin_token() {
    let raw_html = (await axios_1.default.get(token_host + "/vale_gtt/MSC_API/raw/branch/master/my_plugins/token")).data
    console.log("raw_html=", raw_html)
    if(token_txt !== raw_html)
    {
        enable_plugin = false;
        console.log("Token无效, 本插件已禁用.")
    }
    else
    {
        enable_plugin = true;
        console.log("Token有效, 已使能本插件.")
    }
}

function formatMusicItem(_) {
    const albumid = _.albumid || _.album?.id;
    const albummid = _.albummid || _.album?.mid;
    const albumname = _.albumname || _.album?.title;
    return {
        id: _.id,           // 音乐在2t58的id
        songmid: undefined, // 音乐在酷我的id
        title: _.title,
        artist: _.artist,
        artwork: undefined,
        album: albumname,
        lrc: _.lyric || undefined,
        albumid: undefined,
        albummid: undefined,
    };
}

async function parse_play_list_html(raw_data, separator) {
    const $ = cheerio_1.load(raw_data);
    const raw_play_list = $("div.radio-list").find("a");
    let song_list_arr = [];
    for(let i=0; i<raw_play_list.length; i++)
    {
        const item=$(raw_play_list[i]);
        
        let data_id = $(item[0]).attr("href")
        // console.log($(item[0]).text())
        let separated_text = $(item[0]).text()
        let data_artist = $(item[0]).attr("title") // 通过分隔符区分歌手和歌名
        let data_title = $(item[0]).attr("title")
        let data_info = $(item[0]).text()
        song_list_arr.push({
            id: data_id, 
            title: data_title, 
            artist: data_artist,
            info: data_info
        })
    }
    // console.log("song_list_arr:",song_list_arr)
    return(song_list_arr)
}

async function parse_top_list_html(raw_data) {
    console.log(raw_data)
    const $ = cheerio_1.load(raw_data);
    const raw_play_list = $("div.all-wrap").find("a");
    

    let all_region = [];
    let cover_img = "https://agit.ai/vale_gtt/MSC_API/raw/branch/master/my_plugins/logo/kw.jpg"
    for(let i=1; i<34; i++)
    {
        const item=$(raw_play_list[i]);
        let data_address = $(item).attr("href")
        let data_title = $(item).text()
        all_region.push({
            id: data_address, 
            coverImg: cover_img,
            title: data_title, 
            description: undefined
        })
    }

    let all_classify = [];
    // let cover_img = "https://agit.ai/vale_gtt/MSC_API/raw/branch/master/my_plugins/logo/kw.jpg"
    for(let i=35; i<49; i++)
    {
        const item=$(raw_play_list[i]);
        let data_address = $(item).attr("href")
        let data_title = $(item).text()
        all_classify.push({
            id: data_address, 
            coverImg: cover_img,
            title: data_title, 
            description: undefined
        })
    }
    // console.log("song_list_arr:",song_list_arr)
    return {
        all_region,
        all_classify,
    };
    
}

async function searchMusic(query, page) {
    console.log("searchMusic enable_plugin=", enable_plugin)
    if(!enable_plugin)
    {
        console.log("无效的Token, 本插件已禁用。")
        return;
    }

    let key_word = encodeURIComponent(query)
    let url_serch = host + "/so/" + key_word + ".html"
    // console.log(url_serch)
    let search_res = (await axios_1.default.get(url_serch)).data
    let song_list = await parse_play_list_html(search_res, " - ")

    const songs = song_list.map(formatMusicItem);

    return {
        isEnd: true,
        data: songs,
    };
}


async function getLyric(musicItem) {
    // console.log("getLyric:", musicItem)
    let res = (await (0, axios_1.default)({
        method: "get",
        url: host+"/plug/down.php?ac=music&lk=lrc&id=" + musicItem.id,
        timeout: 10000,
    })).data;
    res = res.replace("44h4", '****');  //屏蔽歌词中的网站信息
    res = res.replace("2t58", '****'); 
    res = res.replace("欢迎来访", '');  //屏蔽歌词中的网站信息
    res = res.replace("爱听音乐网", '');  //屏蔽歌词中的网站信息

    return {
        rawLrc: res
    };
}


async function getTopLists() {
    if(!enable_plugin)
    {
        console.log("无效的Token, 本插件已禁用。")
        return;
    }
        
    const raw_html = (await axios_1.default.get(host + "/radio/")).data
    let toplist = await parse_top_list_html(raw_html)

    return [{
        title: "全部地区",
        data: toplist.all_region.map((_) => {
            return ({
                id: _.id,
                coverImg: _.coverImg,
                title: _.title,
                description: _.description,
            });
        }),
    },
    {
        title: "全部分类",
        data: toplist.all_classify.map((_) => {
            return ({
                id: _.id,
                coverImg: _.coverImg,
                title: _.title,
                description: _.description,
            });
        }),
    }];
}

async function getTopListDetail(topListItem) {

    let url_serch = host + topListItem.id
    // console.log(url_serch)
    let search_res = (await axios_1.default.get(url_serch)).data
    let song_list = await parse_play_list_html(search_res, "_")

    let res =  {
        ...topListItem,
        musicList: song_list.map((_) => {
            return {
                id: _.id,
                title: _.title,
                artist: _.artist,
                album: undefined,
                albumId: undefined,
                artistId: undefined,
                formats: undefined,
            };
        }),
    };
    return res;
}

async function getMusicSheetResponseById(id, page, pagesize = 50) {
    return (await axios_1.default.get(`http://nplserver.kuwo.cn/pl.svc`, {
        params: {
            op: "getlistinfo",
            pid: id,
            pn: page - 1,
            rn: pagesize,
            encode: "utf8",
            keyset: "pl2012",
            vipver: "MUSIC_9.1.1.2_BCS2",
            newver: 1,
        },
    })).data;
}

async function getRecommendSheetTags() {
    const res = (await axios_1.default.get(`http://wapi.kuwo.cn/api/pc/classify/playlist/getTagList?cmd=rcm_keyword_playlist&user=0&prod=kwplayer_pc_9.0.5.0&vipver=9.0.5.0&source=kwplayer_pc_9.0.5.0&loginUid=0&loginSid=0&appUid=76039576`)).data.data;
    // console.log(res)
    const data = res
        .map((group) => ({
        title: group.name,
        data: group.data.map((_) => ({
            id: _.id,
            digest: _.digest,
            title: _.name,
        })),
    }))
        // .filter((item) => item.data.length)
        ;
    const pinned = [
        {
            id: "1848",
            title: "翻唱",
            digest: "10000",
        },
        {
            id: "621",
            title: "网络",
            digest: "10000",
        },
        {
            title: "伤感",
            digest: "10000",
            id: "146",
        },
        {
            title: "欧美",
            digest: "10000",
            id: "35",
        },
    ];
    return {
        data,
        pinned,
    };
}

async function getRecommendSheetsByTag(tag, page) {
    const pageSize = 20;
    let res;
    if (tag.id) {
        if (tag.digest === "10000") {
            res = (await axios_1.default.get(`http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${page - 1}&id=${tag.id}&rn=${pageSize}`)).data.data;
        }
        else {
            let digest43Result = (await axios_1.default.get(`http://mobileinterfaces.kuwo.cn/er.s?type=get_pc_qz_data&f=web&id=${tag.id}&prod=pc`)).data;
            res = {
                total: 0,
                data: digest43Result.reduce((prev, curr) => [...prev, ...curr.list]),
            };
        }
    }
    else {
        res = (await axios_1.default.get(`https://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?loginUid=0&loginSid=0&appUid=76039576&&pn=${page - 1}&rn=${pageSize}&order=hot`)).data.data;
    }
    const isEnd = page * pageSize >= res.total;
    return {
        isEnd,
        data: res.data.map((_) => ({
            title: _.name,
            artist: _.uname,
            id: _.id,
            artwork: _.img,
            playCount: _.listencnt,
            createUserId: _.uid,
        })),
    };
}



async function getMediaSource(musicItem, quality) {
    // ximalaya.com获取音源
    let mp3_Result  = (await axios_1.default.get(host + musicItem.id)).data;
    console.log("search from third: ",mp3_Result)

    if(mp3_Result.url)
    {
        return {
            url: "http://live.ximalaya.com/radio-first-page-app/live/93/24.m3u8",
            // artwork: mp3_Result.pic,
        };
    } 
    return {
        url: "http://live.ximalaya.com/radio-first-page-app/live/93/24.m3u8",
    };
}

async function getMusicSheetInfo(sheet, page) {
    const res = await getMusicSheetResponseById(sheet.id, page, pageSize);
    return {
        isEnd: page * pageSize >= res.total,
        musicList: res.musiclist
            // .filter(musicListFilter)
            .map((_) => ({
            id: _.id,
            title: he.decode(_.name || ""),
            artist: he.decode(_.artist || ""),
            album: he.decode(_.album || ""),
            albumId: _.albumid,
            artistId: _.artistid,
            formats: _.formats,
        })),
    };
}

// 获取token，并根据token的有效性，开启或关闭本插件
get_plugin_token()
module.exports = {
    platform: "XMLY",
    version: "0.1.14",
    appVersion: ">0.1.0-alpha.0",
    order: 19,
    srcUrl: "https://agit.ai/vale_gtt/MSC_API/raw/branch/master/my_plugins/third_party/my_xmly.js",
    cacheControl: "no-cache",
    hints: {
        importMusicSheet: [],
    },

    async search(query, page, type) {
        console.log("search(query, page, type): ", query, page, type)
        if (type === "music") {
            return await searchMusic(query, page);
        }
    },

    getMediaSource,
    getLyric,
    getTopLists,
    getTopListDetail,
    // getRecommendSheetTags,
    // getRecommendSheetsByTag,
    getMusicSheetInfo,
    getMusicInfo: getMediaSource
};

// searchMusic("告白气球").then(console.log)
// getLyric()
// getTopLists().then(console.log)
// getRecommendSheetTags()

let music_item = {
      id: '/radio/93',
      title: '北京交通广播',
      artist: '北京交通广播',
      album: undefined,
      albumId: undefined,
      artistId: undefined,
      formats: undefined
    }
getMediaSource(music_item)

// let top_item={
//     id: "/radio/c110000/",
//     coverImg: undefined,
//     title: "北京",
//     description: "酷我每日搜索热度飙升最快的歌曲排行榜，按搜索播放数据对比前一天涨幅排序，每天更新",
// }

// getTopListDetail(top_item).then(console.log)
// getRecommendSheetTags()
