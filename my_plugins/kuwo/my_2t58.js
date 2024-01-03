"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const he = require("he");
const cheerio_1 = require("cheerio");
const CryptoJS = require("crypto-js");

const host = "http://ww" + "w.2t" + "58.com"

let search_key_word = ""

const pageSize = 30;
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

async function parse_play_list(raw_data) {
    const $ = cheerio_1.load(raw_data);
    const raw_play_list = $("div.play_list").find("li");
    let song_list_arr = [];
    for(let i=0; i<raw_play_list.length; i++)
    {
        const item=$(raw_play_list[i]).find("a");
        let data_id = $(item[0]).attr("href").match(/\/song\/(.*?).html/)[1]
        let data_title = $(item[0]).text().split(" - ")[1]
        let data_artist = $(item[0]).text().split(" - ")[0]
        song_list_arr.push({
            id: data_id, 
            title: data_title, 
            artist: data_artist
        })
    }
    // console.log("song_list_arr:",song_list_arr)
    return(song_list_arr)
}

async function searchMusic(query, page) {
    let key_word = encodeURIComponent(query)
    let url_serch = host + "/so/" + key_word + ".html"
    // console.log(url_serch)
    let search_res = (await axios_1.default.get(url_serch)).data
    let song_list = await parse_play_list(search_res)

    const songs = song_list.map(formatMusicItem);

    return {
        isEnd: true,
        data: songs,
    };
}


async function getLyric(musicItem) {
    // console.log("getLyric:", musicItem)
    const res = (await (0, axios_1.default)({
        method: "get",
        url: host+"/plug/down.php?ac=music&lk=lrc&id=" + musicItem.id,
        timeout: 10000,
    })).data;
    res = res.split("58.com")[1]    //过滤歌词中的附加信息
    return {
        rawLrc: res
    };
}


async function getTopLists() {
    const result = (await axios_1.default.get("http://wapi.kuwo.cn/api/pc/bang/list")).data
        .child;
        console.log("111111111111111111111",result)
        console.log("2222222222222222")
     result.map((e) => ({
        title: e.disname,
        data: e.child.map((_) => ({
            id: _.sourceid,
            coverImg: _.pic5 ?? _.pic2 ?? _.pic,
            title: _.name,
            description: _.intro,
        })),
    }));
    return result
}

async function getTopListDetail(topListItem) {
    const res = await axios_1.default.get(`http://kbangserver.kuwo.cn/ksong.s`, {
        params: {
            from: "pc",
            fmt: "json",
            pn: 0,
            rn: 80,
            type: "bang",
            data: "content",
            id: topListItem.id,
            show_copyright_off: 0,
            pcmp4: 1,
            isbang: 1,
            userid: 0,
            httpStatus: 1,
        },
    });
    return {
        ...topListItem,
        musicList: res.data.musiclist.map((_) => {
            return {
                id: _.id,
                title: he.decode(_.name || ""),
                artist: he.decode(_.artist || ""),
                album: he.decode(_.album || ""),
                albumId: _.albumid,
                artistId: _.artistid,
                formats: _.formats,
            };
        }),
    };
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
    console.log(res)
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
    // 2t58.com获取音源
    let header = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": host+`/song/${musicItem.id}.html`,
    }
    let mp3_Result = (await (0, axios_1.default)({
        method: "post",
        url: host + `/js/play.php`,
        headers: header,
        data: `id=${musicItem.id}&type=music`,
    })).data;
    console.log("search from third: ",mp3_Result)

    if(mp3_Result.url)
    {
        return {
            url: mp3_Result.url
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

module.exports = {
    platform: "AT",
    version: "0.1.14",
    appVersion: ">0.1.0-alpha.0",
    order: 19,
    srcUrl: "https://agit.ai/vale_gtt/MSC_API/raw/branch/master/my_plugins/kuwo/my_2t58.js",
    cacheControl: "no-cache",
    hints: {
        importMusicSheet: [
            "VIP音源：自建歌单-分享-复制试听链接，直接粘贴即可",
            "H5：复制URL并粘贴，或者直接输入纯数字歌单ID即可",
            "导入过程中会过滤掉所有VIP/试听/收费音乐，导入时间和歌单大小有关，请耐心等待",
        ],
    },

    async search(query, page, type) {
        console.log("search(query, page, type): ", query, page, type)
        search_key_word = query;
        if (type === "music") {
            return await searchMusic(query, page);
        }
    },

    getMediaSource,
    getLyric,
    getTopLists,
    getTopListDetail,
    getRecommendSheetTags,
    getRecommendSheetsByTag,
    getMusicSheetInfo,
};

// searchMusic("告白气球").then(console.log)
// getLyric()
getTopLists().then(console.log)
// getRecommendSheetTags()

// let music_item = {
//     id: 'bnd4c3ZoZA',
//     songmid: undefined,
//     title: '告白气球',
//     artist: '周杰伦',
//     artwork: undefined,
//     album: undefined,
//     lrc: undefined,
//     albumid: undefined,
//     albummid: undefined
//   }
// getMediaSource(music_item)