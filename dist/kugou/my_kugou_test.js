"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");
const pageSize = 20;
const validMusicFilter = (_) => _.privilege === 0 || _.privilege === 8;
function formatMusicItem(_) {
    return {
        id: _.hash,
        title: _.songname,
        artist: _.singername ??
            (_.authors?.map((_) => _?.author_name ?? "")?.join(", ") ||
                _.filename?.split("-")?.[0]?.trim()),
        album: _.album_name ?? _.remark,
        album_id: _.album_id,
        album_audio_id: _.album_audio_id,
        artwork: _.album_sizable_cover
            ? _.album_sizable_cover.replace("{size}", "400")
            : undefined,
        "320hash": _["320hash"],
        sqhash: _.sqhash,
        origin_hash: _.origin_hash,
    };
}
function formatImportMusicItem(_) {
    let title = _.name;
    const singerName = _.singername;
    if (singerName && title) {
        const index = title.indexOf(singerName);
        if (index !== -1) {
            title = title.substring(index + singerName.length + 2)?.trim();
        }
        if (!title) {
            title = singerName;
        }
    }
    const qualites = _.relate_goods;
    return {
        id: _.hash,
        title,
        artist: singerName,
        album: _.albumname ?? "",
        album_id: _.album_id,
        album_audio_id: _.album_audio_id,
        artwork: _?.info?.image?.replace("{size}", "400"),
        "320hash": qualites?.[1]?.hash,
        sqhash: qualites?.[2]?.hash,
        origin_hash: qualites?.[3]?.hash,
    };
}
const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "zh-CN,zh;q=0.9",
};
async function searchMusic(query, page) {
    const res = (await axios_1.default.get("http://mobilecdn.kugou.com/api/v3/search/song", {
        headers,
        params: {
            format: "json",
            keyword: query,
            page,
            pagesize: pageSize,
            showtype: 1,
        },
    })).data;
    const songs = res.data.info
        // .filter(validMusicFilter)
        .map(formatMusicItem);
    return {
        isEnd: page * pageSize >= res.data.total,
        data: songs,
    };
}
async function searchAlbum(query, page) {
    const res = (await axios_1.default.get("http://msearch.kugou.com/api/v3/search/album", {
        headers,
        params: {
            version: 9108,
            iscorrection: 1,
            highlight: "em",
            plat: 0,
            keyword: query,
            pagesize: 20,
            page,
            sver: 2,
            with_res_tag: 0,
        },
    })).data;
    const albums = res.data.info.map((_) => ({
        id: _.albumid,
        artwork: _.imgurl?.replace("{size}", "400"),
        artist: _.singername,
        title: (0, cheerio_1.load)(_.albumname).text(),
        description: _.intro,
        date: _.publishtime?.slice(0, 10),
    }));
    return {
        isEnd: page * 20 >= res.data.total,
        data: albums,
    };
}
async function searchMusicSheet(query, page) {
    const res = (await axios_1.default.get("http://mobilecdn.kugou.com/api/v3/search/special", {
        headers,
        params: {
            format: "json",
            keyword: query,
            page,
            pagesize: pageSize,
            showtype: 1,
        },
    })).data;
    const sheets = res.data.info.map(item => ({
        title: item.specialname,
        createAt: item.publishtime,
        description: item.intro,
        artist: item.nickname,
        coverImg: item.imgurl,
        gid: item.gid,
        playCount: item.playcount,
        id: item.specialid,
        worksNum: item.songcount
    }));
    return {
        isEnd: page * pageSize >= res.data.total,
        data: sheets,
    };
}


async function getMediaSource(musicItem, quality) {
    let purl = "";

    // 获取官方音乐
    const res = await Official_MP3_API(musicItem, quality);
    console.log("音源：", res);
    
    //酷狗音源是部分免费（VIP）时，寻找其他音源
    if(!res.is_free_part)
    {
        purl = res.play_url || res.play_backup_url;
    }

    // 从其他站点搜索音源
    else {
        const url_1 = await Thrd_MP3_API(musicItem);
        purl = url_1.url;
    };

    console.log("播放音源：",purl);
    return {
        url: purl,
        rawLrc: res.lyrics,
        artwork: res.img,
    };
}

// 官方音乐信息，包括歌手、id、歌词、歌手照片等
async function Official_MP3_API(musicItem, quality){
    let hash;
    if (quality === "low") {
        hash = musicItem.id;
    }
    else if (quality === "standard") {
        hash = musicItem["320hash"];
    }
    else if (quality === "high") {
        hash = musicItem.sqhash;
    }
    else {
        hash = musicItem.origin_hash;
    }
    if (!hash) {
        // return;
        hash = musicItem["320hash"];//若无音质可选，则使用标准音质
    }
    const res = (await axios_1.default.get("https://wwwapi.kugou.com/yy/index.php", {
        headers,
        params: {
            r: "play/getdata",
            hash: hash,
            appid: "1014",
            mid: "56bbbd2918b95d6975f420f96c5c29bb",
            album_id: musicItem.album_id,
            album_audio_id: musicItem.album_audio_id,
            _: Date.now(),
        },
    })).data.data;

    return res;
}

//搜索第三方音源
async function Thrd_MP3_API(musicItem) {

    let url_ok = "";
    if(url_ok == "")
    {
        const res = await zz123_mp3(musicItem.artist, musicItem.title);
        if(res.url)
        {
            url_ok = res.url;
        } 
    }

    if(url_ok == "")
    {
        const res = await slider_mp3(musicItem.artist, musicItem.title);
        if(res.url)
        {
            url_ok = res.url;
        } 
    }
    
    return {
        url: url_ok,
    };
}

async function zz123_mp3(singerName, songName) {
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
    return {
        url: ""
    };
}


async function jxcxin_mp3(musicId) {
    //从 apis.jxcxin.cn获取音源。经过测试，该站点无发获取VIP音源
    const desUrl = `https://apis.jxcxin.cn/api/kugou?id=${musicId}`;
    const servercontent = (await (0, axios_1.default)({
        url: desUrl,
        method: 'get',
        timeout: 1000,
    })).data;
    console.log(servercontent);
    if (servercontent.code == 200) {
        let res_url = servercontent.data.url
        return 
        {
            url: servercontent.data.url
        };
    }
    else {
        return {
            url:''
        };
    }

}

async function slider_mp3(singerName, songName) {
    //从slider.kz获取音源
    let purl = "";
    let serverUrl = `https://slider.kz/vk_auth.php?q=${encodeURIComponent(singerName)}-${encodeURIComponent(songName)}`;
    // console.log(serverUrl);
    let res = (await (0, axios_1.default)({
        method: "GET",
        url: serverUrl,
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true,
    })).data;
    // console.log(res);
    if (res.audios[''].length > 0) {
        purl = res.audios[''][0].url;
        if (purl.indexOf("http") == -1) {
            purl = "https://slider.kz/" + purl;
        }
         return {
            url: purl,
          };
    }
    return {
        url: ""
    };
}

async function hifi_mp3(singerName, songName) {
    let keyword = encodeURIComponent(singerName + " " + songName);
    keyword = keyword.replace('-', '_2d');
    keyword = keyword.replace('%', '_');
    let so_url = "https://www.hifini.com/search-" + keyword + ".htm";
    console.log(so_url);
    let digest43Result = (await axios_1.default.get(so_url)).data;
    var pattern = /class="media-body">(.*?)<\/div>/isg;
    let rsList = digest43Result.match(pattern);
    let musicUrl;
    for (const it of rsList) {
        let vs = it.match(/href="thread(.*?)">(.*?)<\/a>/);
        let name = vs[0].replace("<em>", "").replace("</em>", "").replace(" ", "").trim();
        name = name.replace(/<[^>]+>/g, "");
        if (name.indexOf(singerName) != -1 && name.indexOf(`《${songName}》`)) {
            let href_url = "https://www.hifini.com/thread" + vs[1];
            let Result = (await axios_1.default.get(href_url)).data;
            console.log(href_url);
            let musicv = Result.match(/get_music.php(.*)'/);
            console.log(musicv);
            if (musicv == null) {
                return {
                    url: ''
                };
            }
            if (musicv.length > 1 && musicv[1].indexOf('?key') != -1) {
                musicUrl = "https://www.hifini.com/get_music.php" + musicv[1];
                return {
                    url: musicUrl
                };
                break;
            }
        }
    }
    return {
        url: ''
    };
}




async function getTopLists() {
    const lists = (await axios_1.default.get("http://mobilecdnbj.kugou.com/api/v3/rank/list?version=9108&plat=0&showtype=2&parentid=0&apiver=6&area_code=1&withsong=0&with_res_tag=0", {
        headers: headers,
    })).data.data.info;
    const res = [
        {
            title: "热门榜单",
            data: [],
        },
        {
            title: "特色音乐榜",
            data: [],
        },
        {
            title: "全球榜",
            data: [],
        },
    ];
    const extra = {
        title: "其他",
        data: [],
    };
    lists.forEach((item) => {
        if (item.classify === 1 || item.classify === 2) {
            res[0].data.push({
                id: item.rankid,
                description: item.intro,
                coverImg: item.imgurl?.replace("{size}", "400"),
                title: item.rankname,
            });
        }
        else if (item.classify === 3 || item.classify === 5) {
            res[1].data.push({
                id: item.rankid,
                description: item.intro,
                coverImg: item.imgurl?.replace("{size}", "400"),
                title: item.rankname,
            });
        }
        else if (item.classify === 4) {
            res[2].data.push({
                id: item.rankid,
                description: item.intro,
                coverImg: item.imgurl?.replace("{size}", "400"),
                title: item.rankname,
            });
        }
        else {
            extra.data.push({
                id: item.rankid,
                description: item.intro,
                coverImg: item.imgurl?.replace("{size}", "400"),
                title: item.rankname,
            });
        }
    });
    if (extra.data.length !== 0) {
        res.push(extra);
    }
    return res;
}
async function getTopListDetail(topListItem) {
    const res = await axios_1.default.get(`http://mobilecdnbj.kugou.com/api/v3/rank/song?version=9108&ranktype=0&plat=0&pagesize=100&area_code=1&page=1&volid=35050&rankid=${topListItem.id}&with_res_tag=0`, {
        headers,
    });
    return {
        ...topListItem,
        musicList: res.data.data.info.map(formatMusicItem),
    };
}
async function getAlbumInfo(albumItem, page = 1) {
    const res = (await axios_1.default.get("http://mobilecdn.kugou.com/api/v3/album/song", {
        params: {
            version: 9108,
            albumid: albumItem.id,
            plat: 0,
            pagesize: 100,
            area_code: 1,
            page,
            with_res_tag: 0,
        },
    })).data;
    return {
        isEnd: page * 100 >= res.data.total,
        albumItem: {
            worksNum: res.data.total,
        },
        musicList: res.data.info
            // .filter(validMusicFilter)
            .map((_) => {
            const [artist, songname] = _.filename.split("-");
            return {
                id: _.hash,
                title: songname.trim(),
                artist: artist.trim(),
                album: _.album_name ?? _.remark,
                album_id: _.album_id,
                album_audio_id: _.album_audio_id,
                artwork: albumItem.artwork,
                "320hash": _["320hash"],
                sqhash: _.sqhash,
                origin_hash: _.origin_hash,
            };
        }),
    };
}
async function importMusicSheet(urlLike) {
    let id = urlLike.match(/^(?:.*?)(\d+)(?:.*?)$/)?.[1];
    let musicList = [];
    if (!id) {
        return;
    }
    let res = await axios_1.default.post(`http://t.kugou.com/command/`, {
        appid: 1001,
        clientver: 9020,
        mid: "21511157a05844bd085308bc76ef3343",
        clienttime: 640612895,
        key: "36164c4015e704673c588ee202b9ecb8",
        data: id,
    });
    if (res.status === 200 && res.data.status === 1) {
        let data = res.data.data;
        let response = await axios_1.default.post(`http://www2.kugou.kugou.com/apps/kucodeAndShare/app/`, {
            appid: 1001,
            clientver: 10112,
            mid: "70a02aad1ce4648e7dca77f2afa7b182",
            clienttime: 722219501,
            key: "381d7062030e8a5a94cfbe50bfe65433",
            data: {
                id: data.info.id,
                type: 3,
                userid: data.info.userid,
                collect_type: data.info.collect_type,
                page: 1,
                pagesize: data.info.count,
            },
        });
        if (response.status === 200 && response.data.status === 1) {
            let resource = [];
            response.data.data.forEach((song) => {
                resource.push({
                    album_audio_id: 0,
                    album_id: "0",
                    hash: song.hash,
                    id: 0,
                    name: song.filename.replace(".mp3", ""),
                    page_id: 0,
                    type: "audio",
                });
            });
            let postData = {
                appid: 1001,
                area_code: "1",
                behavior: "play",
                clientver: "10112",
                dfid: "2O3jKa20Gdks0LWojP3ly7ck",
                mid: "70a02aad1ce4648e7dca77f2afa7b182",
                need_hash_offset: 1,
                relate: 1,
                resource,
                token: "",
                userid: "0",
                vip: 0,
            };
            var result = await axios_1.default.post(`https://gateway.kugou.com/v2/get_res_privilege/lite?appid=1001&clienttime=1668883879&clientver=10112&dfid=2O3jKa20Gdks0LWojP3ly7ck&mid=70a02aad1ce4648e7dca77f2afa7b182&userid=390523108&uuid=92691C6246F86F28B149BAA1FD370DF1`, postData, {
                headers: {
                    "x-router": "media.store.kugou.com",
                },
            });
            if (response.status === 200 && response.data.status === 1) {
                musicList = result.data.data
                    // .filter(validMusicFilter)
                    .map(formatImportMusicItem);
            }
        }
    }
    return musicList;
}

module.exports = {
    platform: "蓝莓",
    version: "0.1.4",
    appVersion: ">0.1.0-alpha.0",
    order: 17,
    srcUrl: "https://agit.ai/vale_gtt/MSC_API/raw/branch/master/dist/kugou/my_kugou_test.js",
    cacheControl: "no-cache",
    primaryKey: ["id", "album_id", "album_audio_id"],
    hints: {
        importMusicSheet: [
            "仅支持酷狗APP通过酷狗码导入，输入纯数字酷狗码即可。",
            "导入过程中会过滤掉所有VIP/试听/收费音乐，导入时间和歌单大小有关，请耐心等待",
        ],
    },
    async search(query, page, type) {
        if (type === "music") {
            return await searchMusic(query, page);
        }
        else if (type === "album") {
            return await searchAlbum(query, page);
        }
        else if (type === "sheet") {
            return await searchMusicSheet(query, page);
        }
    },
    getMediaSource,
    getLyric: getMediaSource,
    getTopLists,
    getTopListDetail,
    getAlbumInfo,
    importMusicSheet,
};
