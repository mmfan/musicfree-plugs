"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const he = require("he");
const cheerio_1 = require("cheerio");
const CryptoJS = require("crypto-js");

const host = "http://ww" + "w.dd" + "a5.com"
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
        artwork: _.artwork,
        album: albumname,
        lrc: _.lyric || undefined,
        albumid: undefined,
        albummid: undefined,
    };
}

async function parse_play_list_html(raw_data, separator) {
    const $ = cheerio_1.load(raw_data);
    const raw_play_list = $("div.play_list").find("li");
    let song_list_arr = [];
    for(let i=0; i<raw_play_list.length; i++)
    {
        const item=$(raw_play_list[i]).find("a");
        
        let data_id = $(item[1]).attr("href").match(/\/mp3\/(.*?).html/)[1]
        // console.log($(item[0]).text())
        // let separated_text = $(item[1])
        let data_artist = $(item[2]).text() // 通过分隔符区分歌手和歌名
        let data_title = $(item[1]).text()
        let data_artwork = $(raw_play_list[i]).find("img").attr("src")
        song_list_arr.push({
            id: data_id, 
            title: data_title, 
            artist: data_artist,
            artwork: data_artwork
        })
    }
    // console.log("song_list_arr:",song_list_arr)
    return(song_list_arr)
}

async function parse_top_list_html(raw_data) {
    const $ = cheerio_1.load(raw_data);
    const raw_play_list = $("div.class").find("li");
    const page_data = $("div.pagedata").text();

    let classify_list = [];
    for(let i=0; i<5; i++)
    {
        const item=$(raw_play_list[i]).find("a");
        let data_address = $(item[0]).attr("href")
        let data_title = $(item[0]).text()
        classify_list.push({
            id: data_address, 
            coverImg: undefined,
            title: data_title, 
            description: "每日同步官方数据。" + page_data
        })
    }

    let hot_list = [];
    for(let i=5; i<15; i++)
    {
        const item=$(raw_play_list[i]).find("a");
        let data_address = $(item[0]).attr("href")
        let data_title = $(item[0]).text()
        hot_list.push({
            id: data_address, 
            coverImg: undefined,
            title: data_title, 
            description: "每日同步官方数据。" + page_data
        })
    }
    // console.log("song_list_arr:",song_list_arr)
    return {
        classify_list,
        hot_list,
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
    let url_serch = host + "/so.php?wd=" + key_word
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
        
    const raw_html = (await axios_1.default.get(host + "/list/hotsong.html")).data
    let toplist = await parse_top_list_html(raw_html)

    return [{
        title: "热门榜单",
        data: (toplist.hot_list).map((_) => {
            return ({
                id: _.id,
                coverImg: _.coverImg,
                title: _.title,
                description: _.description,
            });
        }),
    }, 
    {
        title: "音乐分类",
        data: (toplist.classify_list).map((_) => {
            return ({
                id: _.id,
                coverImg: _.coverImg,
                title: _.title,
                description: _.description,
            });
        }),
    }]
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
    // dda5.com获取音源
    let header = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": host+`/song/${musicItem.id}.html`,
    }
    let mp3_Result = (await (0, axios_1.default)({
        method: "post",
        url: host + `/style/js/play.php`,
        headers: header,
        data: `id=${musicItem.id}&type=dance`,
    })).data;
    console.log("search from third: ",mp3_Result.url)

    if(mp3_Result.url)
    {
        return {
            url: mp3_Result.url,
            artwork: mp3_Result.pic,
            rawLrc: mp3_Result.lrc
        };
    } 
    return {
        url: ""
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
    platform: "DD",
    version: "0.1.14",
    appVersion: ">0.1.0-alpha.0",
    order: 19,
    srcUrl: "https://agit.ai/vale_gtt/MSC_API/raw/branch/master/my_plugins/third_party/my_dda5.js",
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
    getLyric: getMediaSource,
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

// let music_item =
//     {
//         id: '60054704037',
//         songmid: undefined,
//         title: '告白气球',
//         artist: '周杰伦',
//         artwork: 'https://d.musicapp.migu.cn/data/oss/resource/00/2h/ty/mo',
//         album: undefined,
//         lrc: undefined,
//         albumid: undefined,
//         albummid: undefined
//       }
// getMediaSource(music_item)

let top_item={
    id: "/list/hotsong.html",
    coverImg: undefined,
    title: "热歌榜",
    description: "酷我每日搜索热度飙升最快的歌曲排行榜，按搜索播放数据对比前一天涨幅排序，每天更新",
}

getTopListDetail(top_item)
// getRecommendSheetTags()
