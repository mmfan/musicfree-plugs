"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");
const CryptoJS = require("crypto-js");
const searchRows = 20;
const host="http://www.2t58.com";
const musicurl="http://tn1.72djapp.cn:8399/";
const tuku="http://tv.zanlagua.com/tuku/"






async function getMediaSource(musicItem, quality) {
    

    var songkey=musicItem.id.match(/\/song\/(.*?).html/)[1]  
    
          const headers2 = {
            "Accept":"application/json, text/javascript, */*; q=0.01",
            "Accept-Encoding":"gzip, deflate",
            "Accept-Language":"zh-CN,zh;q=0.9",
            "User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            "X-Requested-With":"XMLHttpRequest",
    };   
    
   
    
    const html2 = await axios_1.get("http://tv.zanlagua.com/2T58.php?songkey="+songkey,headers2);   
    const obj=html2.data;
    
 
 
    
        
        
    
       return {
          
            url:obj["url"],

        };
        
        
}

  async function getMusicInfo(musicItem) {
    // 根据音乐获取音乐详细信息
    var songkey=musicItem.id.match(/\/song\/(.*?).html/)[1]  
    
          const headers2 = {
            "Accept":"application/json, text/javascript, */*; q=0.01",
            "Accept-Encoding":"gzip, deflate",
            "Accept-Language":"zh-CN,zh;q=0.9",
            "User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            "X-Requested-With":"XMLHttpRequest",
    };   
    
   
    
    const html2 = await axios_1.get("http://tv.zanlagua.com/2T58.php?songkey="+songkey,headers2);   
    const obj=html2.data; 
    
    
    return {
      artwork: obj["pic"],
      title:obj["title"].split('-')[1],
      artist:obj["title"].split('-')[0],
    };
  }

async function getRecommendSheetTags() {
    
    
    
                   const headers = {

    };
    const params = {

    };
      
       const html = await axios_1.get("http://www.2t58.com/singerlist/index/index/index/index.html", { headers, params });
              const obj=html.data;    
              const $ = (0, cheerio_1.load)(obj);  
              const rawAlbums2 = $("div.ilingku_fl");
              const albums2 = [];   
              console.log(rawAlbums2.length);
          var arr1=[];    
        for(let i=0;i<rawAlbums2.length;i++){
            
                const plp=$(rawAlbums2[i]).find("li")[0];
                console.log($(plp).text());
                const plp2=$(rawAlbums2[i]).find("li");
                
                var arr2=[];
                
                for(let j=1;j<plp2.length;j++){
                    
                        const jlj=$(rawAlbums2[i]).find("li")[j];
                        //console.log($(jlj).find("a").attr("href"));
                        arr2.push({id:$(jlj).find("a").attr("href"),title:$(jlj).text()})
                }
                arr1.push({title:$(plp).text(),data:arr2});
                
        }
  
    // 获取推荐歌单 tag
    return {
      pinned: [
        {
          id: "1",
          title: "栏目",
        },
      ],
      data: arr1,
    };
  }
async function getRecommendSheetsByTag(tagItem,page) {
    // 获取某个 tag 下的所有歌单
         const headers = {

    };
    const params = {

    };
    if(page==""){page=1;}
    if(page<=0){page=1;}
    var isends=false;
    if(tagItem.id==""){
        
              
              const html = await axios_1.get(host+"/singerlist/index/index/index/index/"+page+".html", { headers, params });
              const obj=html.data;    
              const $ = (0, cheerio_1.load)(obj);  
              const rawAlbums2 = $("div.singer_list").find("li");
              const albums2 = [];   
              if(rawAlbums2.length<96){
                  isends=true;
              }
               
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
        
        
    }else  if(tagItem.id!=""){
        
           var curl=tagItem.id;
           var lpo=curl.replace(".html","");
           
           
           
              const html = await axios_1.get(host+lpo+"/"+page+".html", { headers, params });
              const obj=html.data;    
              const $ = (0, cheerio_1.load)(obj);  
              const rawAlbums2 = $("div.singer_list").find("li");
              const albums2 = [];   
              if(rawAlbums2.length<96){
                  isends=true;
              }
               
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
             
                   
                   
       
    }
    return {
      isEnd: isends,
      data: albums2,
    };
}
async function getMusicSheetInfo(sheetItem, page) {
     const headers = {
        
            };
            const params = {
        
            };
        var userkey=sheetItem.id.match(/\/singer\/(.*?).html/)[1]
        

        
                
                
                
            
            const albums = [];
            const html = await axios_1.default.get(host+"/singer/"+userkey+"/"+page+".html", { headers, params });
            const obj=html.data;
            
            const $ = (0, cheerio_1.load)(obj);
            
            const pimg = $("div.pic").find("img").attr("src");
            const pname = $("div.list_r").find("h1").text();
            const pabout = $("div.info").find("p").text();
   
            
            const rawAlbums = $("div.play_list").find("li");
            
             
             
             for(let i=0;i<rawAlbums.length;i++){
                 albums.push({
                              platform: '2T85',
                              id: $(rawAlbums[i]).find("a").attr("href"),
                              artist:sheetItem.title,
                              title: $(rawAlbums[i]).find("a").text(),
                              album: "2T85",
                              target2:$(rawAlbums[i]).find("a").attr("target"),
    
                 });
             }
             
                  var iendpage=false;
         if(rawAlbums.length<68){iendpage=true;}
                console.log(pabout);
        if(page<=1){
              return {
                isEnd: iendpage,
                musicList: albums,
                albumItem: {
                  description:pabout,
                },
              }
        }else{
               return {
                isEnd: iendpage,
                musicList: albums,

              }
        }
    
    
}

async function getAlbumInfo(albumItem, page) {
    console.log("getAlbumInfo");
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
  
   async function getLyric(musicItem) {
       var songkey=musicItem.id.match(/\/song\/(.*?).html/)[1]  
    return {
      lrc: "http://www.2t58.com/plug/down.php?ac=music&lk=lrc&id="+songkey, // 链接
      
    };
  } 
module.exports = {
  /** 用来说明插件信息的属性 */
  platform: "2T58",
  version: "0.0.1", // 插件版本号
  hints: {
        importMusicSheet: [
            "2t58.com采集",

        ],
    },
    primaryKey: ["id"],
    cacheControl: "no-store",
    srcUrl: "http://tv.zanlagua.com/2T58.js",
  /** 供给软件在合适的时机调用的函数 */


  getMediaSource,
  getMusicInfo,
  getRecommendSheetTags,
  getRecommendSheetsByTag,
  getMusicSheetInfo,
  getAlbumInfo,
  getLyric,
};

getMediaSource()