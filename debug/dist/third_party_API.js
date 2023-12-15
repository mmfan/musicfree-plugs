"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");
const CryptoJs = require("crypto-js");


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

exports.slider_mp3 = function (singerName, songName) {
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
}


// http://www.2t58.com/so/%E5%91%A8%E6%9D%B0%E4%BC%A6%20%E6%99%B4%E5%A4%A9.html
// %E5%91%A8%E6%9D%B0%E4%BC%A6%20%E6%99%B4%E5%A4%A9
exports._2t58_mp3 = async function (singerName, songName) {
    // 从 2t58.com搜索音源。经过测试，该站点可以搜索VIP音乐
    let so_url = `http://www.2t58.com/so/${encodeURIComponent(singerName)}%20${encodeURIComponent(songName)}.html`;

    let site_Result = (await axios_1.default.get(so_url)).data;
    // console.log(site_Result)
    let sv = site_Result.indexOf('<div class="name"><a href="');
    // console.log(sv)
    if (sv != -1) {
        site_Result = site_Result.substring(sv + 27);
        let ev = site_Result.indexOf('" target=');
        let site_Result_url = 'http://www.2t58.com' + site_Result.substring(0, ev);

        let mp3_html_Result = //(await axios_1.default.get(site_Result_url)).data;
            (await (0, axios_1.default)({
                method: "GET",
                url: site_Result_url,
                xsrfCookieName: "XSRF-TOKEN",
                withCredentials: true,
            })).data;




        // console.log(mp3_html_Result)
        let mp3_sv = mp3_html_Result.indexOf('preload="metadata" src="');
        if (mp3_sv != -1) {
            mp3_html_Result = mp3_html_Result.substring(mp3_sv + 24);
            let ev = site_Result.indexOf('"></audio></div>');
            let mp3_url = mp3_html_Result.substring(0, ev);
        }


    }
}

// http://www.86109.com/so.php?wd=%E5%91%A8%E6%9D%B0%E4%BC%A6+%E6%99%B4%E5%A4%A9
exports._86109_mp3 = async function (singerName, songName) {
    // 86109.com搜索音源。
    let  so_url = `http://www.86109.com/so.php?wd=${encodeURIComponent(singerName)}+${encodeURIComponent(songName)}`;
    let search_res = (await axios_1.default.get(so_url)).data;
    // console.log(search_res)
    let sv = search_res.indexOf('<a href="/flac/');
    // console.log(sv)
    if (sv != -1) {
        search_res = search_res.substring(sv + 15);
        
        let ev = search_res.indexOf('.html"');
        let mp3_id = search_res.substring(0, ev);
        if(mp3_id)
        {
            let req_url = 'https://api.44h4.com/mgmp3/'+ mp3_id+'.mp3'
            // console.log(req_url)

            return {
                url: req_url
            };
        }

    }
    return {
        url: ""
    };

}

exports.adad23u_mp3 =  async function (musicItem) {
    // 从速悦音乐接口中获取音源，测试不可用
    let serverUrl = `http://adad23u.appinstall.life/getmp3source/qq/sq/${musicItem.songmid}`;
    let res = (await (0, axios_1.default)({
        method: "GET",
        url: serverUrl,
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true,
    })).data;
    console.log(res);
    if (res.url.indexOf("http") != -1) {
        return {
            url: res.url,
        };
    }

    return {
        url: ""
    };
}


exports.hifi_mp3 = async function (singerName, songName) {
    let keyword = encodeURIComponent(singerName + " " + songName);
    keyword = keyword.replace('-', '_2d');
    keyword = keyword.replace('%', '_');
    let so_url = "https://www.hifini.com/search-" + keyword + ".htm";
    console.log(so_url);
    let digest43Result =//(await axios_1.default.get(so_url)).data;

    (await (0, axios_1.default)({
        method: "GET",
        url: so_url,
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true,
    })).data;

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

// 从jxcxin中获取酷我接口音乐信息
exports.jxcxin_kw_api = async function (musicId) {
    const desUrl = `https://apis.jxcxin.cn/api/kuwo?id=${musicId}&type=json&apiKey=c452fc69e6ef7199b49b310b4afa26a1`;
    const servercontent = (await axios_1.default.get(desUrl)).data;
    // console.log(servercontent);
    // if (servercontent.code == 200) {
    //     return servercontent.data;
    // }
    // else
        return "";
}

// 以下内容用于调试
const debug = 0
if(debug)
{
    const musicItem = {
        id: 97773,
        songmid: '0039MnYb0qxYhV',
        title: '晴天',
        artist: '周杰伦',
        artwork: 'https://y.gtimg.cn/music/photo_new/T002R300x300M000000MkMni19ClKG.jpg',
        album: '叶惠美',
        lrc: undefined,
        albumid: 8220,
        albummid: '000MkMni19ClKG'
    };

    const musicItem1 = {
            id: 215076997,
            songmid: '0003f6pW1hOLKG',
            title: '晴天 (钢琴版)',
            artist: '文武贝',
            artwork: 'https://y.gtimg.cn/music/photo_new/T002R300x300M000004QXtXm1PWWmu.jpg',
            album: '文武贝流行钢琴曲',
            lrc: undefined,
            albumid: 3866787,
            albummid: '004QXtXm1PWWmu'
        };

    const musicItem2 = {
        id: 244115385,
        songmid: '004Fs2FP1EvZYc',
        title: '晴天 (Live)',
        artist: '周杰伦',
        artwork: 'https://y.gtimg.cn/music/photo_new/T002R300x300M000004fXSyj3bWTMN.jpg',
        album: '周杰伦地表最强世界巡回演唱会',
        lrc: undefined,
        albumid: 9040723,
        albummid: '004fXSyj3bWTMN'
    }

    this.zz123_mp3(musicItem.artist, musicItem.title).then(console.log);
    // this.slider_mp3(musicItem.artist, musicItem.title).then(console.log);
    // this._2t58_mp3(musicItem.artist, musicItem.title).then(console.log);
    // this._86109_mp3(musicItem.artist, musicItem.title).then(console.log);
    // this.jxcxin_kw_api(musicItem.id).then(console.log);
    // this.hifi_mp3(musicItem.artist, musicItem.title).then(console.log);
    // this.adad23u_mp3(musicItem.artist, musicItem.title).then(console.log);
    














}