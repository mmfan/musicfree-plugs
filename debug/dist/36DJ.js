"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");
const CryptoJS = require("crypto-js");
const searchRows = 20;
const host="http://www.36dj.com";
const musicurl="http://tn1.72djapp.cn:8399/";
const tuku="http://tv.zanlagua.com/tuku/"
async function getTopLists() {

    const headers = {

    };
    const params = {

    };
    
     const albums = [];   
    
  const html = await axios_1.get(host, { headers, params });
  const obj=html.data;
  const $ = (0, cheerio_1.load)(obj);
  const rawAlbums = $("div.menu").find("li");
  
 const imgs=Array('','dj1.jpg','dj1.png','dj2.jpg','dj2.png','dj3.png','','');
   
   for(let i=1;i<rawAlbums.length;i++){
     
         albums.push({
                id: $(rawAlbums[i]).find("a").attr("href"),
                title: $(rawAlbums[i]).find("a").text(),
                coverImg: "http://tv.zanlagua.com/img/"+imgs[i],
            });
     
   }
 
       const jianjiao = {
        title: "36DJ",
        data: albums,
    };
    
    
    
    
   html = await axios_1.get(host+"/html/special.html", { headers, params });
   obj=html.data;    
   $ = (0, cheerio_1.load)(obj);  
  const rawAlbums2 = $("div.special").find("li");
  const albums2 = [];   

   
   for(let i=0;i<rawAlbums2.length;i++){
       
         var imgcc=$(rawAlbums2[i]).find("a").find("img").attr("src");
  
  if(imgcc.substring(0,4)=="http"){}else{
        imgcc=host+imgcc;
    }  
     
         albums2.push({
                id: $(rawAlbums2[i]).find("a").attr("href"),
                title: $(rawAlbums2[i]).find("a").text(),
                coverImg:imgcc,
            });
     
   }
 
       const jianjiao2 = {
        title: "精品专辑",
        data: albums2,
    };
   
   
   return [jianjiao,jianjiao2];
    
}

async function getTopListDetail(topListItem) {
     const headers = {

    };
    const params = {

    };
    
    const albums = [];
    const html = await axios_1.default.get(host+topListItem.id, { headers, params });
    const obj=html.data;
    const $ = (0, cheerio_1.load)(obj);
    const rawAlbums = $("ul.mulist").find("p");
    
     
     
     for(let i=0;i<rawAlbums.length;i++){
         albums.push({
                      platform: '36DJ',
                      id: $(rawAlbums[i]).find("a").attr("href"),
                      artist:"36DJ",
                      title: $(rawAlbums[i]).find("a").text(),
                      album: topListItem.title,
                      artwork:"http://tv.zanlagua.com/img/j1.jpeg",
         });
     }
     
 
     
     return {
      id: topListItem.id,
      description:"好听的DJ音乐",
     // coverImg: topListItem.coverImg,
      title: topListItem.title,
      musicList: albums,
    };
    
}

async function getMediaSource(musicItem, quality) {
    
      const headers = {

    };
    const params = {

    };   
    
    
    
    const html2 = await axios_1.default.get(host+musicItem.id, { headers, params });
    const obj2=html2.data;
    const $2 = (0, cheerio_1.load)(obj2); 
    const urlc=obj2.match(/"playurl":\s*"(.*?)"/)[1];
  
       return {
          
            url:musicurl+urlc,

        };
}

  async function getMusicInfo(musicItem) {
    // 根据音乐获取音乐详细信息
      const headers = {

    };
    const params = {

    };   
    const html2 = await axios_1.default.get("http://tv.zanlagua.com/getimg.php", { headers, params });
    const obj2=html2.data;    
    console.log(obj2);
    
    return {
      artwork: tuku+obj2,
    };
  }

async function getRecommendSheetTags() {
    // 获取推荐歌单 tag
    return {
      pinned: [
        {
          id: "1",
          title: "栏目",
        },
      ],
      data: [
        {
          title: "年代",
          data: [
            {
              id: "101",
              title: "80后",
            },
            {
              id: "102",
              title: "90后",
            },
          ],
        },
      ],
    };
  }
async function getRecommendSheetsByTag(tagItem) {
    // 获取某个 tag 下的所有歌单
         const headers = {

    };
    const params = {

    };
    if(tagItem.id==""){
        
          
              const html = await axios_1.get(host+"/html/special.html", { headers, params });
              const obj=html.data;    
              const $ = (0, cheerio_1.load)(obj);  
              const rawAlbums2 = $("div.special").find("li");
              const albums2 = [];   
            
               
               for(let i=0;i<rawAlbums2.length;i++){
                   
                         var imgcc=$(rawAlbums2[i]).find("a").find("img").attr("src");
                  
                          if(imgcc.substring(0,4)=="http"){}else{
                                imgcc=host+imgcc;
                            }  
                             
                                 albums2.push({
                                        id: $(rawAlbums2[i]).find("a").attr("href"),
                                        title: $(rawAlbums2[i]).find("a").text(),
                                        artwork:imgcc,
                                        playCount: 122220,
                                    });
                 
               }
        
        
    }else  if(tagItem.id=="1"){
        
                     const albums2 = [];   
                
              const html = await axios_1.get(host, { headers, params });
              const obj=html.data;
              const $ = (0, cheerio_1.load)(obj);
              const rawAlbums = $("div.menu").find("li");
              
             const imgs=Array('','m1.png','m2.jpeg','m3.jpeg','m4.jpg','m5.jpeg','m6.jpeg','m7.png','m8.jpeg','m9.jpeg');
               
               for(let i=1;i<rawAlbums.length;i++){
                 
                     albums2.push({
                            id: $(rawAlbums[i]).find("a").attr("href"),
                            title: $(rawAlbums[i]).find("a").text(),
                            artwork: "http://tv.zanlagua.com/img/"+imgs[i],
                            playCount: 122220,
                        });
                 
               }
             
                   
                   
       
    }
    return {
      isEnd: true,
      data: albums2,
    };
}
async function getMusicSheetInfo(sheetItem, page) {
     const headers = {
        
            };
            const params = {
        
            };
    
    if (page <= 1) {
        
                
                
                
            
            const albums = [];
            const html = await axios_1.default.get(host+sheetItem.id, { headers, params });
            const obj=html.data;
            const $ = (0, cheerio_1.load)(obj);
            const rawAlbums = $("ul.mulist").find("p");
            
             
             
             for(let i=0;i<rawAlbums.length;i++){
                 albums.push({
                              platform: '36DJ',
                              id: $(rawAlbums[i]).find("a").attr("href"),
                              artist:"36DJ",
                              title: $(rawAlbums[i]).find("a").text(),
                              album: sheetItem.title,
                              artwork:"http://tv.zanlagua.com/img/j1.jpeg",
                 });
             }
             
                  var iendpage=false;
         if(rawAlbums.length<25){iendpage=true;}
                
                
              return {
                isEnd: iendpage,
                musicList: albums,
                albumItem: {
                  description: "这是专辑的补充说明",
                },
              }
    }else{
        
        
          
            const albums = [];
            const html = await axios_1.default.get(host+sheetItem.id+"index_"+page+".html", { headers, params });
            const obj=html.data;
            const $ = (0, cheerio_1.load)(obj);
            const rawAlbums = $("ul.mulist").find("p");
            
             
             
             for(let i=0;i<rawAlbums.length;i++){
                 albums.push({
                              platform: '36DJ',
                              id: $(rawAlbums[i]).find("a").attr("href"),
                              artist:"36DJ",
                              title: $(rawAlbums[i]).find("a").text(),
                              album: sheetItem.title,
                              artwork:"http://tv.zanlagua.com/img/j1.jpeg",
                 });
             }
             
         var iendpage=false;
         if(rawAlbums.length<25){iendpage=true;}
                
                
              return {
                isEnd: iendpage,
                musicList: albums,
                albumItem: {
                  description: "这是专辑的补充说明",
                },
              }
        
        
        
    }
    
    
}

async function getAlbumInfo(albumItem, page) {
    if (page <= 1) {
      return {
        isEnd: false,
        musicList: [],
        albumItem: {
          description: "这是专辑的补充说明",
        },
      };
    }

    // 其他页码正常返回
    return {
      isEnd: true,
      musicList: [],
    };
  }
module.exports = {
  /** 用来说明插件信息的属性 */
  platform: "36DJ",
  version: "0.0.2", // 插件版本号
  hints: {
        importMusicSheet: [
            "36dj.com采集",

        ],
    },
    primaryKey: ["id"],
    cacheControl: "no-store",
    srcUrl: "http://tv.zanlagua.com/360dj.js",
  /** 供给软件在合适的时机调用的函数 */

  getTopLists,
  getTopListDetail,
  getMediaSource,
  getMusicInfo,
  getRecommendSheetTags,
  getRecommendSheetsByTag,
  getMusicSheetInfo,
  getAlbumInfo,
};

getTopLists()