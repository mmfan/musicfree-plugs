"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const he = require("he");
const pageSize = 30;
function artworkShort2Long(albumpicShort) {
    const firstSlashOfAlbum = albumpicShort?.indexOf("/") ?? -1;
    return firstSlashOfAlbum !== -1
        ? `https://img4.kuwo.cn/star/albumcover/256${albumpicShort.slice(firstSlashOfAlbum)}`
        : undefined;
}
function musicListFilter(item) {
    return true;
}
function formatMusicItem(_) {
    return {
        id: _.MUSICRID.replace("MUSIC_", ""),
        artwork: artworkShort2Long(_.web_albumpic_short),
        title: he.decode(_.NAME || ""),
        artist: he.decode(_.ARTIST || ""),
        album: he.decode(_.ALBUM || ""),
        albumId: _.ALBUMID,
        artistId: _.ARTISTID,
        formats: 'aac|mp3|flac'
    };
}
function formatMusicItemApp(_) {
    return {
        id: _.rid,
        artwork: _.albumpic.replace('/120/', '/240/'),
        title: he.decode(_.name || ""),
        artist: he.decode(_.artist || ""),
        album: he.decode(_.album || ""),
        albumId: _.albumid,
        artistId: _.artistid,
        formats: 'aac|mp3|flac'
    };
}
function formatAlbumItem(_) {
    return {
        id: _.albumid,
        artist: he.decode(_.artist || ""),
        title: he.decode(_.name || ""),
        artwork: _.img ?? artworkShort2Long(_.pic),
        description: he.decode(_.info || ""),
        date: _.pub,
        artistId: _.artistid,
    };
}
function formatArtistItem(_) {
    return {
        id: _.ARTISTID,
        avatar: _.hts_PICPATH,
        name: he.decode(_.ARTIST || ""),
        artistId: _.ARTISTID,
        description: he.decode(_.desc || ""),
        worksNum: _.SONGNUM
    };
}
function formatMusicSheet(_) {
    return {
        id: _.playlistid,
        title: he.decode(_.name || ""),
        artist: he.decode(_.nickname || ""),
        artwork: _.pic,
        playCount: _.playcnt,
        description: he.decode(_.intro || ""),
        worksNum: _.songnum,
    };
}

// 从酷我接口获取官方音乐信息
async function getMediaSource_KW_API(musicId) {
    const desUrl = `https://apis.jxcxin.cn/api/kuwo?id=${musicId}&type=json&apiKey=c452fc69e6ef7199b49b310b4afa26a1`;
    const servercontent = (await axios_1.default.get(desUrl)).data;
    console.log(servercontent);
    if (servercontent.code == 200) {
        return servercontent.data;
    }
    else
        return "";

}


async function searchMusic(query, page) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            client: 'kt',
            all: query,
            pn: page - 1,
            rn: pageSize,
            uid: 794762570,
            ver: 'kwplayer_ar_9.2.2.1',
            vipver: '1',
            show_copyright_off: 1,
            newver: 1,
            ft: 'music',
            cluster: 0,
            strategy: 2012,
            encoding: 'utf8',
            rformat: 'json',
            vermerge: 1,
            mobi: 1,
            issubtitle: 1
        },
    })).data;
    const songs = res.abslist
        // .filter(musicListFilter)
        .map(formatMusicItem);
    return {
        isEnd: (+res.PN + 1) * +res.RN >= +res.TOTAL,
        data: songs,
    };
}
async function searchMusic2(query, page) {
    let url = `http://wapi.kuwo.cn/api/www/search/searchMusicBykeyWord?key=${encodeURIComponent(query)}&prefix=&pn=${page}&rn=${pageSize}`;
    const res = (await (0, axios_1.default)({
        method: "get",
        url: url,
    })).data;
    let total = parseInt(res.data.total);
    let totalpage = total / pageSize + (total % pageSize > 0 ? 1 : 0);
    totalpage = parseInt(totalpage.toString());
    let isEnd = false;
    if (page >= totalpage) {
        isEnd = true;
    }
    const songs = res.data.list
        // .filter(musicListFilter)
        .map(formatMusicItemApp);
    return {
        isEnd: isEnd,
        data: songs,
    };
}

async function searchAlbum(query, page) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            all: query,
            ft: "album",
            itemset: "web_2013",
            client: "kt",
            pn: page - 1,
            rn: pageSize,
            rformat: "json",
            encoding: "utf8",
            pcjson: 1,
        },
    })).data;
    const albums = res.albumlist.map(formatAlbumItem);
    return {
        isEnd: (+res.PN + 1) * +res.RN >= +res.TOTAL,
        data: albums,
    };
}
async function searchArtist(query, page) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            all: query,
            ft: "artist",
            itemset: "web_2013",
            client: "kt",
            pn: page - 1,
            rn: pageSize,
            rformat: "json",
            encoding: "utf8",
            pcjson: 1,
        },
    })).data;
    const artists = res.abslist.map(formatArtistItem);
    return {
        isEnd: (+res.PN + 1) * +res.RN >= +res.TOTAL,
        data: artists,
    };
}
async function searchMusicSheet(query, page) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            all: query,
            ft: "playlist",
            itemset: "web_2013",
            client: "kt",
            pn: page - 1,
            rn: pageSize,
            rformat: "json",
            encoding: "utf8",
            pcjson: 1,
        },
    })).data;
    const musicSheets = res.abslist.map(formatMusicSheet);
    return {
        isEnd: (+res.PN + 1) * +res.RN >= +res.TOTAL,
        data: musicSheets,
    };
}
async function getArtistMusicWorks(artistItem, page) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            pn: page - 1,
            rn: pageSize,
            artistid: artistItem.id,
            stype: "artist2music",
            sortby: 0,
            alflac: 1,
            show_copyright_off: 1,
            pcmp4: 1,
            encoding: "utf8",
            plat: "pc",
            thost: "search.kuwo.cn",
            vipver: "MUSIC_9.1.1.2_BCS2",
            devid: "38668888",
            newver: 1,
            pcjson: 1,
        },
    })).data;
    const songs = res.musiclist
        // .filter(musicListFilter)
        .map((_) => {
        return {
            id: _.musicrid,
            artwork: artworkShort2Long(_.web_albumpic_short),
            title: he.decode(_.name || ""),
            artist: he.decode(_.artist || ""),
            album: he.decode(_.album || ""),
            albumId: _.albumid,
            artistId: _.artistid,
            formats: _.formats,
        };
    });
    return {
        isEnd: (+res.pn + 1) * pageSize >= +res.total,
        data: songs,
    };
}
async function getArtistAlbumWorks(artistItem, page) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            pn: page - 1,
            rn: pageSize,
            artistid: artistItem.id,
            stype: "albumlist",
            sortby: 1,
            alflac: 1,
            show_copyright_off: 1,
            pcmp4: 1,
            encoding: "utf8",
            plat: "pc",
            thost: "search.kuwo.cn",
            vipver: "MUSIC_9.1.1.2_BCS2",
            devid: "38668888",
            newver: 1,
            pcjson: 1,
        },
    })).data;
    const albums = res.albumlist
        // .filter(musicListFilter)
        .map(formatAlbumItem);
    return {
        isEnd: (+res.pn + 1) * pageSize >= +res.total,
        data: albums,
    };
}
async function getArtistWorks(artistItem, page, type) {
    if (type === "music") {
        return getArtistMusicWorks(artistItem, page);
    }
    else if (type === "album") {
        return getArtistAlbumWorks(artistItem, page);
    }
}
async function getLyric(musicItem) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: "http://m.kuwo.cn/newh5/singles/songinfoandlrc",
        timeout: 10000,
        params: {
            musicId: musicItem.id,
            httpStatus: 1,
        },
    })).data;
    const list = res.data.lrclist;
    return {
        rawLrc: list.map((_) => `[${_.time}]${_.lineLyric}`).join("\n"),
    };
}
async function getAlbumInfo(albumItem) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            pn: 0,
            rn: 100,
            albumid: albumItem.id,
            stype: "albuminfo",
            sortby: 0,
            alflac: 1,
            show_copyright_off: 1,
            pcmp4: 1,
            encoding: "utf8",
            plat: "pc",
            thost: "search.kuwo.cn",
            vipver: "MUSIC_9.1.1.2_BCS2",
            devid: "38668888",
            newver: 1,
            pcjson: 1,
        },
    })).data;
    const songs = res.musiclist
        // .filter(musicListFilter)
        .map((_) => {
        return {
            id: _.id,
            artwork: albumItem.artwork ?? res.img,
            title: he.decode(_.name || ""),
            artist: he.decode(_.artist || ""),
            album: he.decode(_.album || ""),
            albumId: albumItem.id,
            artistId: _.artistid,
            formats: _.formats,
        };
    });
    return {
        musicList: songs,
    };
}
async function getTopLists() {
    const result = (await axios_1.default.get("http://wapi.kuwo.cn/api/pc/bang/list")).data
        .child;
    return result.map((e) => ({
        title: e.disname,
        data: e.child.map((_) => ({
            id: _.sourceid,
            coverImg: _.pic5 ?? _.pic2 ?? _.pic,
            title: _.name,
            description: _.intro,
        })),
    }));
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
async function importMusicSheet(urlLike) {
    let id;
    if (!id) {
        id = urlLike.match(/https?:\/\/www\/kuwo\.cn\/playlist_detail\/(\d+)/)?.[1];
    }
    if (!id) {
        id = urlLike.match(/https?:\/\/m\.kuwo\.cn\/h5app\/playlist\/(\d+)/)?.[1];
    }
    if (!id) {
        id = urlLike.match(/^\s*(\d+)\s*$/);
    }
    if (!id) {
        return;
    }
    let page = 1;
    let totalPage = 30;
    let musicList = [];
    while (page < totalPage) {
        try {
            const data = await getMusicSheetResponseById(id, page, 80);
            totalPage = Math.ceil(data.total / 80);
            if (isNaN(totalPage)) {
                totalPage = 1;
            }
            musicList = musicList.concat(data.musicList
                    // .filter(musicListFilter)
                    .map((_) => ({
                id: _.id,
                title: he.decode(_.name || ""),
                artist: he.decode(_.artist || ""),
                album: he.decode(_.album || ""),
                albumId: _.albumid,
                artistId: _.artistid,
                formats: _.formats,
            })));
        }
        catch { }
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 200 + Math.random() * 100);
        });
        ++page;
    }
    return musicList;
}

async function getRecommendSheetTags() {
    const res = (await axios_1.default.get(`http://wapi.kuwo.cn/api/pc/classify/playlist/getTagList?cmd=rcm_keyword_playlist&user=0&prod=kwplayer_pc_9.0.5.0&vipver=9.0.5.0&source=kwplayer_pc_9.0.5.0&loginUid=0&loginSid=0&appUid=76039576`)).data.data;
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


async function so_MP3_API(musicItem) {


    return await zz123_mp3(musicItem.artist, musicItem.title);
    // return await hifi_mp3(singerName, songName);
}

async function zz123_mp3(singerName, songName) {
    // 从zz123.com搜索音源。经过测试，该站点可以搜索VIP音乐
    let so_url = "https://zz123.com/search/?key=" + encodeURIComponent(singerName + " - " + songName);
    let digest43Result = (await axios_1.default.get(so_url)).data;
    // console.log(digest43Result)
    let sv = digest43Result.indexOf('pageSongArr=');
    console.log(sv)
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

async function getMediaSourceUNION(musicItem, quality) {
    console.log('查询',musicItem);
    let purl = "";
    // 从酷我官方查找音源。遇到试听音源时，查找其他音源
    const res = await getMediaSource_KW_API(musicItem.id);
    console.log('酷我音源结果：',res);

    if (res && res.url != null && res.url != '') {
        purl = res.url;
    }
    else
    {
        const res_3rd = await so_MP3_API(musicItem);
        purl = res_3rd.url;
    }

    return {
        url: purl,
        rawLrc: res.lyrics,
        artwork: res.img,
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
    platform: "酷我音乐",
    version: "0.1.13",
    appVersion: ">0.1.0-alpha.0",
    order: 19,
    srcUrl: "https://agit.ai/vale_gtt/MSC_API/raw/branch/master/dist/kuwo/my_kuwo.js",//"http://adad23u.appinstall.life/dist/kuwo/index.js",
    cacheControl: "no-cache",
    hints: {
        importMusicSheet: [
            "VIP音源：自建歌单-分享-复制试听链接，直接粘贴即可",
            "H5：复制URL并粘贴，或者直接输入纯数字歌单ID即可",
            "导入过程中会过滤掉所有VIP/试听/收费音乐，导入时间和歌单大小有关，请耐心等待",
        ],
    },
    async search(query, page, type) {
        if (type === "music") {
            return await searchMusic(query, page);
        }
        if (type === "album") {
            return await searchAlbum(query, page);
        }
        if (type === "artist") {
            return await searchArtist(query, page);
        }
        if (type === "sheet") {
            return await searchMusicSheet(query, page);
        }
    },
    async getMediaSource(musicItem, quality) {
        let br;
        if (quality === "low") {
            br = "aac";
        }
        else if (quality === "standard") {
            br = "mp3";
        }
        else {
            br = "flac";
        }
        return await getMediaSourceUNION(musicItem, br);

    },
    getAlbumInfo,
    getLyric,
    getArtistWorks,
    getTopLists,
    getTopListDetail,
    importMusicSheet,
    getRecommendSheetTags,
    getRecommendSheetsByTag,
    getMusicSheetInfo,
};
//getMediaSourceUNION({ id: '34362172' }, "high").then(f => console.log(f));
