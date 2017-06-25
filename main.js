<<<<<<< HEAD
/*Mediator 中介者负责各个模块之间通信
* Meditor.register('type',fn);
* Mediator.send('type');
* */
var Mediator = function () {
    var _msg = {};
    return {
        register: function (type, action) {
            if (_msg[type]) {
                _msg[type].push(action);
            } else {
                _msg[type] = [];
                _msg[type].push(action);
            }
        },
        send: function (type) {
            if (_msg[type]) {
                for (var i = 0; i < _msg[type].length; i++) {
                    _msg[type][i] && _msg[type][i]();
                }
            }
        }
    }
}();
=======
var printer = {};
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
var printer = {
    'showAds': 0,
    'hasAds': false,
    'defaultTimeSetting': undefined,
    'log': {},
    'fs': require('fs'),//文件读写
    'appConfig': require('./configs'),
    'path': require('path'),
    'exec': require('child_process').exec, //子进程执行库
<<<<<<< HEAD
=======
    // '$':require('jquery')
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
    /*后端服务*/
    'uploadService': function () {
        var p = printer;
        //printer.localIp=printer.getLocalIP();	//终端ip
        var logger = p.log.servers,
            port = {
                'http': 0,
                'upload': 0
            },
            fs = p.fs,
            $dirname = p.fs.realpathSync('.'),
            mine = p.appConfig.mine,
            path = p.path,
            http = require('http'),
            https = require('https'),
            url = require('url'),
            _existsSync = fs.existsSync || path.existsSync,
            formidable = require('formidable'),
            nodeStatic = require('node-static'),
            imageMagick = require('imagemagick'),
            options = {
                tmpDir: $dirname + '/tmp',
                publicDir: $dirname + '/public',
                uploadDir: $dirname + '/public/files',
                uploadUrl: '/files/',
                maxPostSize: 11000000000, // 11 GB
                minFileSize: 1,
                maxFileSize: 10000000000, // 10 GB
                acceptFileTypes: /.+/i,
                inlineFileTypes: /\.(gif|jpe?g|png)$/i,
                imageTypes: /\.(gif|jpe?g|png)$/i,
                imageVersions: {
                    'thumbnail': {
                        width: 80,
                        height: 80
                    }
                },
                accessControl: {
                    allowOrigin: '*',
                    allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
                    allowHeaders: 'Content-Type, Content-Range, Content-Disposition'
                },
                /* Uncomment and edit this section to provide the service via HTTPS:
                 ssl: {
                 key: fs.readFileSync('/Applications/XAMPP/etc/ssl.key/server.key'),
                 cert: fs.readFileSync('/Applications/XAMPP/etc/ssl.crt/server.crt')
                 },
                 */
                nodeStatic: {
                    cache: 3600 // seconds to cache served files
                }
            },
            utf8encode = function (str) {
                return unescape(encodeURIComponent(str));
            },
            fileServer = new nodeStatic.Server(options.publicDir, options.nodeStatic),
            nameCountRegexp = /(?:(?: \(([\d]+)\))?(\.[^.]+))?$/,
            nameCountFunc = function (s, index, ext) {
                return '_' + ((parseInt(index, 10) || 0) + 1) + '_' + (ext || '');
            },
            FileInfo = function (file) {
                this.name = file.name;
                this.size = file.size;
                this.type = file.type;
                this.deleteType = 'DELETE';
            },
            UploadHandler = function (req, res, callback) {//
                this.req = req;
                this.res = res;
                this.callback = callback;
            },
            serve = function (req, res) {
                res.setHeader('Access-Control-Allow-Origin', options.accessControl.allowOrigin);
                res.setHeader('Access-Control-Allow-Methods', options.accessControl.allowMethods);
                res.setHeader('Access-Control-Allow-Headers', options.accessControl.allowHeaders);
                var handleResult = function (result, redirect) {
                        if (redirect) {
                            res.writeHead(302, {'Location': redirect.replace(/%s/, encodeURIComponent(JSON.stringify(result)))});
                            res.end();
                        } else {
                            res.writeHead(200, {'Content-Type': req.headers.accept.indexOf('application/json') !== -1 ? 'application/json' : 'text/plain'});
                            res.end(JSON.stringify(result));
                        }
                    },
                    setNoCacheHeaders = function () {
                        res.setHeader('Pragma', 'no-cache');
                        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
                        res.setHeader('Content-Disposition', 'inline; filename="files.json"');
                    },
                    handler = new UploadHandler(req, res, handleResult);
                switch (req.method) {
                    case 'OPTIONS':
                        res.end();
                        break;
                    case 'HEAD':
                    case 'GET':
                        if (req.url === '/') {
                            setNoCacheHeaders();
                            if (req.method === 'GET') {
                                handler.get();
                            } else {
                                res.end();
                            }
                        } else {
                            fileServer.serve(req, res);
                        }
                        break;
                    case 'POST':
                        setNoCacheHeaders();
                        handler.post();
                        break;
                    case 'DELETE':
                        handler.destroy();
                        break;
                    default:
                        res.statusCode = 405;
                        res.end();
                }
            };
        fileServer.respond = function (pathname, status, _headers, files, stat, req, res, finish) {
            // Prevent browsers from MIME-sniffing the content-type:
            _headers['X-Content-Type-Options'] = 'nosniff';
            if (!options.inlineFileTypes.test(files[0])) {
                // Force a download dialog for unsafe file extensions:
                _headers['Content-Type'] = 'application/octet-stream';
                _headers['Content-Disposition'] = 'attachment; filename="' + utf8encode(path.basename(files[0])) + '"';
            }
            nodeStatic.Server.prototype.respond.call(this, pathname, status, _headers, files, stat, req, res, finish);
        };
        FileInfo.prototype.validate = function () {
            if (options.minFileSize && options.minFileSize > this.size) {
                this.error = 'File is too small';
            } else if (options.maxFileSize && options.maxFileSize < this.size) {
                this.error = 'File is too big';
            } else if (!options.acceptFileTypes.test(this.name)) {
                this.error = 'Filetype not allowed';
            }
            return !this.error;
        };
        FileInfo.prototype.safeName = function () {
            // Prevent directory traversal and creating hidden system files:
            this.name = path.basename(this.name).replace(/^\.+/, '');
            // Prevent overwriting existing files:
            while (_existsSync(options.uploadDir + '/' + this.name)) {
                this.name = this.name.replace(nameCountRegexp, nameCountFunc);
            }
            //this.name=this.name.replace(/[ ]/,'');
        };
        FileInfo.prototype.initUrls = function (req) {
            if (!this.error) {
                var that = this,
                    baseUrl = (options.ssl ? 'https:' : 'http:') + '//' + req.headers.host + options.uploadUrl;
                this.url = this.deleteUrl = baseUrl + encodeURIComponent(this.name);
                Object.keys(options.imageVersions).forEach(function (version) {
                    if (_existsSync(options.uploadDir + '/' + version + '/' + that.name)) {
                        that[version + 'Url'] = baseUrl + version + '/' + encodeURIComponent(that.name);
                    }
                });
            }
        };
        UploadHandler.prototype.get = function () {
            var handler = this, files = [];
            fs.readdir(options.uploadDir, function (err, list) {
                list.forEach(function (name) {
                    var stats = fs.statSync(options.uploadDir + '/' + name), fileInfo;
                    if (stats.isFile() && name[0] !== '.') {
                        fileInfo = new FileInfo({
                            name: name,
                            size: stats.size
                        });
                        fileInfo.initUrls(handler.req);
                        files.push(fileInfo);
                    }
                });
                handler.callback({
                    files: files
                });
            });
        };
        UploadHandler.prototype.post = function () {
            var handler = this, form = new formidable.IncomingForm(), tmpFiles = [], files = [], map = {}, counter = 1,
                redirect,
                finish = function () {
                    counter -= 1;
                    if (!counter) {
                        files.forEach(function (fileInfo) {
                            fileInfo.initUrls(handler.req);
                        });
                        handler.callback({
                            files: files
                        }, redirect);
                    }
                };
            form.uploadDir = options.tmpDir;
            form.on('fileBegin', function (name, file) {
                tmpFiles.push(file.path);
                var fileInfo = new FileInfo(file, handler.req, true);
                fileInfo.safeName();
                map[path.basename(file.path)] = fileInfo;
                files.push(fileInfo);
            }).on('field', function (name, value) {
                if (name === 'redirect') {
                    redirect = value;
                }
            }).on('file', function (name, file) {
                var fileInfo = map[path.basename(file.path)];
                fileInfo.size = file.size;
                if (!fileInfo.validate()) {
                    fs.unlink(file.path);
                    return;
                }
                fs.renameSync(file.path, options.uploadDir + '/' + fileInfo.name);
                if (options.imageTypes.test(fileInfo.name)) {
                    Object.keys(options.imageVersions).forEach(function (version) {
                        counter += 1;
                        var opts = options.imageVersions[version];
                        imageMagick.resize({
                            width: opts.width,
                            height: opts.height,
                            srcPath: options.uploadDir + '/' + fileInfo.name,
                            dstPath: options.uploadDir + '/' + version + '/' + fileInfo.name
                        }, finish);
                    });
                }
            }).on('aborted', function () {
                tmpFiles.forEach(function (file) {
                    fs.unlink(file);
                });
            }).on('error', function (e) {
                logger.error(e);
            }).on('progress', function (bytesReceived, bytesExpected) {
                if (bytesReceived > options.maxPostSize) {
                    handler.req.connection.destroy();
                }
            }).on('end', finish).parse(handler.req);
        };
        UploadHandler.prototype.destroy = function () {
            var handler = this, fileName;
            if (handler.req.url.slice(0, options.uploadUrl.length) === options.uploadUrl) {
                fileName = path.basename(decodeURIComponent(handler.req.url));
                if (fileName[0] !== '.') {
                    fs.unlink(options.uploadDir + '/' + fileName, function (ex) {
                        Object.keys(options.imageVersions).forEach(function (version) {
                            fs.unlink(options.uploadDir + '/' + version + '/' + fileName);
                        });
                        handler.callback({success: !ex});
                    });
                    return;
                }
            }
            handler.callback({success: false});
        };
        if (options.ssl) {
            var uploadSSl = https.createServer(options.ssl, serve).listen(port.upload);
            uploadSSl.on('listening', function () {
                console.log("Https Upload Sevice 服务在端口 " + uploadSSl.address().port + " 启动成功.");
                printer.appConfig.sevice.filePortSSL = uploadSSl.address().port;
            });
        } else {
            var uploadHttp = http.createServer(serve).listen(port.upload);
            uploadHttp.on('listening', function () {
                console.log("Http Upload Sevice 服务在端口 " + uploadHttp.address().port + " 启动成功.");
                printer.appConfig.sevice.filePort = uploadHttp.address().port;
            });
        }
        var serverHttp = http.createServer(function (request, response) {
            var pathname = url.parse(request.url).pathname;
            if (pathname == "/") {
                return false;
            }
            if (pathname == "/frm/upok.json") {
                var getQuery = url.parse(request.url).query;
                var getData = printer.qs.parse(getQuery); //getData数据
                if (getData['img'] != '') {
                    printer.homebtn._machine_upok(getData['img']);
                }
            }
            var realPath = path.join($dirname, pathname);
            var ext = path.extname(realPath);
            ext = ext ? ext.slice(1) : 'unknown';
            fs.exists(realPath, function (exists) {
                if (!exists) {
                    logger.error('http 404 ' + realPath);
                    response.writeHead(404, {'Content-Type': 'text/plain'});
                    response.write("This request URL " + pathname + " was not found on this server.");
                    response.end();
                } else {
                    fs.readFile(realPath, "binary", function (err, file) {
                        if (err) {
                            logger.error('http 500 ' + realPath);
                            response.writeHead(500, {'Content-Type': 'text/plain'});
                            response.end(err);
                        } else {
                            //logger.info('http 200 '+realPath);
                            var contentType = mine[ext] || "text/plain";
                            response.writeHead(200, {'Content-Type': contentType});
                            response.write(file, "binary");
                            response.end();
                        }
                    });
                }
            });
        });
        serverHttp.listen(port.http);
        serverHttp.on('listening', function () {
            console.log("Http Service服务在端口 " + serverHttp.address().port + " 启动成功.");
            printer.appConfig.sevice.httpPort = serverHttp.address().port;
        });
    },
    /*广告加载*/
    'updateAds': function () {
        /*_machineNo  =  RJ00144(终端机编号)*/
        var _machineNo = printer.appConfig.sevice.machineNo;
        /*printer.appConfig.api.server == http://123.57.207.27*/
        $.get(printer.appConfig.api.server + '/api/videoMno/' + _machineNo + '?' + new Date().getTime(), function (res) {
            /*var res = {
             "status": true,
             "data": [{
             "specialTimeName": "\u9ed8\u8ba4\u65f6\u6bb5",
             "isDefault": "1",
             "setting": ["video285.mp4", "video283.mp4"],
             "useAd": ["video285.mp4", "video283.mp4"],
             "useSize": [4213214, 9585135]
             }]
             }
             */
            /*判断后台是否有特殊时段关联*/
            if (res.data != undefined) {/*有关联*/
                printer.linkAds(res.data);
            }
            /*else if(res.update != undefined){/!*无关联,使用之前视频播放方式*!/
             printer.getAds(); //自动更新广告
             }*/
        });
    },
    /*关联广告加载*/
    /*'linkAds': function (data) {
     /!*海底捞*!/
     /!*data: [{
     "specialTimeName": "\u9ed8\u8ba4\u65f6\u6bb5",
     "isDefault": "1",
     "setting": ["video285.mp4", "video283.mp4"],
     "useAd": ["video285.mp4", "video283.mp4"],
     "useSize": [4213214, 9585135]
     }]*!/
     var appPath = printer.fs.realpathSync('.');
     printer.fs.readdir(appPath + '\\public\\video', function (err, files) {
     files = $.map(files, function (e, i) {/!*file = ["ad.html", "video283.mp4", "video285.mp4"]*!/
     if (e.toUpperCase() != "THUMBS.DB") {
     return e;
     }
     });
     var isExistInNet = function (e) {
     var result = false;
     $.map(data, function (itemData) {
     $.map(itemData.useAd, function (itemAd) {
     if (itemAd.toUpperCase() == e.toUpperCase()) {
     result = true;
     }
     });
     });
     return result;
     };
     $.each(files, function (i, e) {
     var pattern = new RegExp("(.FLV|.MP4)");
     var a = !isExistInNet(e);
     var b = pattern.test(e.toUpperCase());
     //当前列表中没有数据且是FLV结尾就删除且每月28号,每次切换组合会使得列表被干掉
     var myDate = new Date();
     var date = myDate.getDate();
     if (28 == date && !isExistInNet(e) && pattern.test(e.toUpperCase())) {
     var _unpath = appPath + '\\public\\video\\' + e;
     printer.fs.unlinkSync(_unpath);//fs.unlinkSync() 删除文件操作。
     }
     });
     });
     var adDown = function (file, i) {
     var adCmd = 'wget -O ../public/video/' + file + '  ' + printer.appConfig.api.server + '/video/' + file;
     var opt = {
     encoding: 'utf8',
     timeout: 5000,
     maxBuffer: 200 * 1024 * 1024,
     killSignal: 'SIGTERM',
     cwd: 'cmd',
     env: null
     };
     printer.exec(adCmd, opt, function (err, stdout, stderr) {
     if (err) {
     console.log('下载广告文件' + file + '失败' + err + "已重试");
     } else {
     console.log('下载广告文件' + file + '成功' + stderr);
     }
     });
     };
     var needDownLoad = true;
     var OKCount = 0;
     /!*
     * checkAdsAllOK检查所有的广告是否都已加载或文件中已存在
     * data object 后端返回的视频名称 是个对象
     * needDownLoad boolean 是否需要加载
     *!/
     var checkAdsAllOK = function (data, needDownLoad) {
     OKCount = 0;
     $.each(data, function (iData, eData) {
     /!*eData = {
     "specialTimeName": "\u9ed8\u8ba4\u65f6\u6bb5",
     "isDefault": "1",
     "setting": ["video285.mp4", "video283.mp4"],
     "useAd": ["video285.mp4", "video283.mp4"],
     "useSize": [4213214, 9585135]
     }*!/
     $.each(eData.useAd, function (i, e) {/!* e = "video285.mp4"&"video283.mp4"*!/
     /!*读取public/video目录下视频文件*!/
     var _localfile = appPath + '\\public\\video\\' + e;
     /!*测试某个路径下的文件是否存在。*!/
     printer.fs.exists(_localfile, function (ex) {/!*ex返回true，则存在，false则不存在*!/
     if (ex) {/!*如果广告文件存在*!/
     /!*获取文件信息 stat {
     dev : 0 ,
     mode : 33206 ,
     nlink : 1 ,
     uid : 0 ,
     gid : 0 ,
     rdev : 0 ,
     ino : 0 ,
     size : 378(字节) ,
     atime : Tue Jun 10 2014 13:57:13 GMT +0800 <中国标准时间> ,
     mtime : Tue Jun 13 2014 09:48:31 GMT +0800 <中国标准时间> ,
     ctime : Tue Jun 10 2014 13:57:13 GMT +0800 <中国标准时间>
     }*!/
     var stat = printer.fs.statSync(_localfile);
     /!*判断文件尺寸大小和后端返回的数据是否存在*!/
     if (stat.size != eData.useSize[i] && eData.useSize[i] != 0) {
     if (needDownLoad) {/!*如果目录下没有广告，就下载广告*!/
     adDown(e);
     }
     } else {
     OKCount++;
     /!*printer.log.test.fatal("showADs" + OKCount + "   " + eData.useAd.length + '    ' + printer.showAds);*!/
     console.log("showADs" + OKCount + "   " + eData.useAd.length + '    ' + printer.showAds);
     if (OKCount >= eData.useAd.length && printer.showAds == 0) {
     printer.fs.exists(appPath + '\\public\\video\\ad.html', function (ad) {
     if (ad) {/!*如果目录下有广告，就直接加载广告*!/
     console.log("广告已存在");
     loadAds();
     }
     });
     printer.showAds = true;
     }
     }
     } else {
     /!*printer.log.test.fatal("no ads " + _localfile);*!/
     console.log("no ads " + _localfile);
     if (needDownLoad) {
     adDown(e);
     }
     }
     });
     });
     });
     };
     var loadAds = function () {
     /!*getVideos获取视频，返回视频播放的html
     * setting array ["video285.mp4", "video283.mp4"] 后端接受到的数据
     *!/
     var getVideos = function (settings) {
     var videos = "";
     var divide = "\"../../public/video/\",";
     $.map(settings, function (item) {
     videos = videos + ",\"public/video/" + item + "\"";
     });
     videos = videos.substr(1, videos.length);
     // var html = '<object class="" type="application/x-shockwave-flash"  width="100%" height="100%">\n' +
     //     '<param name="movie" value="res/images/flvplayer.swf">\n' +
     //     '<param name="quality" value="high">\n' +
     //     '<param name="allowFullScreen" value="true">\n' +
     //     '<param name="loop" value="true">\n' +
     //     '<param name="wmode" value="transparent">\n' +
     //     '<param name="FlashVars" value="vcastr_file=' + videos + '&amp;BufferTime=0&amp;IsAutoPlay=1&amp;IsContinue=1">\n' +
     //     '<embed src="res/images/flvplayer.swf" allowfullscreen="true" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash" width="100%" height="100%">\n' +
     //     '</object>';
     var html = '<video id="video" poster="D:/clientApp/res/images/flvplayer.mp4"  autoplay="autoplay" width="100%" height="100%"></video>'+
     '<script type="text/javascript">' +
     '$(function () {' +
     'var video = document.getElementById("video");' +
     'var vList = [' + videos + ']; ' +
     'var vLen = vList.length; ' +
     'var curr = 0; ' +
     'video.addEventListener("ended", play);' +
     'play();' +
     'function play(e) {' +
     'video.src = vList[curr];' +
     'video.load(); ' +
     'video.play();' +
     'curr++;' +
     'if (curr >= vLen) curr = 0; ' +
     '}' +
     '})' +
     '</script>';
     return html;
     };
     var curTime = new Date().getTime();
     $.map(data, function (itemData) {
     if (itemData.isDefault == "1" || itemData.isDefault == 1) {
     //默认时段
     var html = getVideos(itemData.setting);

     /!*itemData.setting = ["video285.mp4", "video283.mp4"]*!/
     /!*把得到的video标签 写入到ad.html里面去
     * 文件名称
     * 要写入的数据
     * *!/
     printer.fs.writeFile("public/video/ad.html", html, "binary", function (err) {
     if (err) {
     console.log("video标签写入ad.html失败!");
     } else {
     console.log("video标签写入ad.html成功!");
     }
     });
     printer.defaultTimeSetting = html;
     $('#adsAutoBox').append(html);
     /!*将video 插入 main.html #adsAutoBox*!/
     // alert("下载完成");
     } else {/!*特殊时段*!/
     if (typeof(itemData.setting) != undefined && itemData.setting != "") {
     var beginEndTimes = itemData.specialTimeName.split("~");
     var beginTime = new Date();
     var beginHourMinute = beginEndTimes[0].split(":");
     beginTime.setHours(beginHourMinute[0], beginHourMinute[1], 0, 0);
     var endTime = new Date();
     var endHourMinute = beginEndTimes[1].split(":");
     //17 45   17   46
     endTime.setHours(endHourMinute[0], endHourMinute[1], 0, 0);
     if (endTime.getTime() >= curTime) {
     //判断当前时间是否在特殊时间段内
     if (curTime > beginTime.getTime() && curTime < endTime.getTime()) {
     var html = getVideos(itemData.setting);
     $('#adsAutoBox').html(html);
     /!*将video 插入 main.html #adsAutoBox*!/
     } else {
     //特殊时段开始
     setTimeout(function () {
     var html = getVideos(itemData.setting);
     $('#adsAutoBox').html(html);
     /!*将video 插入 main.html #adsAutoBox*!/
     }, (beginTime.getTime() - curTime));
     }
     //特殊时段结束
     setTimeout(function () {
     var html = printer.defaultTimeSetting;
     $('#adsAutoBox').html(html);
     /!*将video 插入 main.html #adsAutoBox*!/
     }, (endTime.getTime() - curTime));
     }
     }
     }
     });
     };
     checkAdsAllOK(data, true);
     if (printer.showAds == false) {
     var dingshiTask = setInterval(function () {/!*第一次下载完成之后文件不加载，需要定时加载，如果加载完毕则清除定时器*!/
     checkAdsAllOK(data, false);
     if (printer.showAds == true) {
     clearInterval(dingshiTask);
     }
     }, 1000);
     }
     }*/
    'linkAds': function (data) {
        /*海底捞*/
        /*data: [{
         "specialTimeName": "\u9ed8\u8ba4\u65f6\u6bb5",
         "isDefault": "1",
         "setting": ["video285.mp4", "video283.mp4"],
         "useAd": ["video285.mp4", "video283.mp4"],
         "useSize": [4213214, 9585135]
         }]*/
        var getUserInfo = function (data, key) {
            var arr = [];
            $.each(data, function (i, item) {
                $.each(item[key], function (j, val) {
                    arr.push(val)
                })
            });
            return arr;
        };
<<<<<<< HEAD
=======
        var Mediator = function () {
            var _msg = {};
            return {
                register: function (type, action) {
                    if (_msg[type]) {
                        _msg[type].push(action);
                    } else {
                        _msg[type] = [];
                        _msg[type].push(action);
                    }
                },
                send: function (type) {
                    if (_msg[type]) {
                        for (var i = 0; i < _msg[type].length; i++) {
                            _msg[type][i] && _msg[type][i]();
                        }
                    }
                }
            }
        }();
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
        var appPath = printer.fs.realpathSync('.');
        printer.fs.readdir(appPath + '\\public\\video', function (err, files) {
            files = $.map(files, function (e, i) {/*file = ["ad.html", "video283.mp4", "video285.mp4"]*/
                if (e.toUpperCase() != "THUMBS.DB") {
                    return e;
                }
            });
            var isExistInNet = function (e) {
                var result = false;
                $.map(data, function (itemData) {
                    $.map(itemData.useAd, function (itemAd) {
                        if (itemAd.toUpperCase() == e.toUpperCase()) {
                            result = true;
                        }
                    });
                });
                return result;
            };
            $.each(files, function (i, e) {
                var pattern = new RegExp("(.FLV|.MP4)");
                var a = !isExistInNet(e);
                var b = pattern.test(e.toUpperCase());
                //当前列表中没有数据且是FLV结尾就删除且每月28号,每次切换组合会使得列表被干掉
                var myDate = new Date();
                var date = myDate.getDate();
                if (28 == date && !isExistInNet(e) && pattern.test(e.toUpperCase())) {
                    var _unpath = appPath + '\\public\\video\\' + e;
                    printer.fs.unlinkSync(_unpath);//fs.unlinkSync() 删除文件操作。
                }
            });
        });

        var setting = getUserInfo(data, 'setting');
        var useAd = getUserInfo(data, 'useAd');
        var download = function (data) {
            var opt = {
                encoding: 'utf8',
                timeout: 5000,
                maxBuffer: 200 * 1024 * 1024,
                killSignal: 'SIGTERM',
                cwd: 'cmd',
                env: null
            };
            var useAd = getUserInfo(data, "useAd");
            return new Promise(function (resolve, reject) {
                $.each(useAd, function (j, fileName) {
                    var cmdCommand = 'wget -O ../public/video/' + fileName + '  ' + printer.appConfig.api.server + '/video/' + fileName;
                    printer.exec(cmdCommand, opt, function (err, stdout, stderr) {
                        if (err) {
                            reject(fileName)
                        } else {
                            resolve(fileName)
                        }
                    });
                });
            });
        };

        var loadAds = function () {
            /*getVideos获取视频，返回视频播放的html
             * setting array ["video285.mp4", "video283.mp4"] 后端接受到的数据
             */
            var getVideos = function (settings) {
                var videos = "";
                var divide = "\"../../public/video/\",";
                $.map(settings, function (item) {
                    videos = videos + ",\"public/video/" + item + "\"";
                });
                videos = videos.substr(1, videos.length);
                // var html = '<object class="" type="application/x-shockwave-flash"  width="100%" height="100%">\n' +
                //     '<param name="movie" value="res/images/flvplayer.swf">\n' +
                //     '<param name="quality" value="high">\n' +
                //     '<param name="allowFullScreen" value="true">\n' +
                //     '<param name="loop" value="true">\n' +
                //     '<param name="wmode" value="transparent">\n' +
                //     '<param name="FlashVars" value="vcastr_file=' + videos + '&amp;BufferTime=0&amp;IsAutoPlay=1&amp;IsContinue=1">\n' +
                //     '<embed src="res/images/flvplayer.swf" allowfullscreen="true" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash" width="100%" height="100%">\n' +
                //     '</object>';
                var html = '<video id="video" poster="D:/clientApp/res/images/flvplayer.mp4"  autoplay="autoplay" width="100%" height="100%"></video>' +
                    '<script type="text/javascript">' +
                    '$(function () {' +
                    'var video = document.getElementById("video");' +
                    'var vList = [' + videos + ']; ' +
                    'var vLen = vList.length; ' +
                    'var curr = 0; ' +
                    'video.addEventListener("ended", play);' +
                    'play();' +
                    'function play(e) {' +
                    'video.src = vList[curr];' +
                    'video.load(); ' +
                    'video.play();' +
                    'curr++;' +
                    'if (curr >= vLen) curr = 0; ' +
                    '}' +
                    '})' +
                    '</script>';
                return html;
            };
            var curTime = new Date().getTime();
            $.map(data, function (itemData) {
                if (itemData.isDefault == "1" || itemData.isDefault == 1) {
                    //默认时段
                    var html = getVideos(itemData.setting);

                    /*itemData.setting = ["video285.mp4", "video283.mp4"]*!/
                     /!*把得到的video标签 写入到ad.html里面去
                     * 文件名称
                     * 要写入的数据
                     * */
                    printer.fs.writeFile("public/video/ad.html", html, "binary", function (err) {
                        if (err) {
                            console.log("video标签写入ad.html失败!");
                        } else {
                            console.log("video标签写入ad.html成功!");
                        }
                    });
                    printer.defaultTimeSetting = html;
                    $('#adsAutoBox').append(html);
                    /*将video 插入 main.html #adsAutoBox*/
                    // alert("下载完成");
                } else {/*特殊时段*/
                    if (typeof(itemData.setting) != undefined && itemData.setting != "") {
                        var beginEndTimes = itemData.specialTimeName.split("~");
                        var beginTime = new Date();
                        var beginHourMinute = beginEndTimes[0].split(":");
                        beginTime.setHours(beginHourMinute[0], beginHourMinute[1], 0, 0);
                        var endTime = new Date();
                        var endHourMinute = beginEndTimes[1].split(":");
                        //17 45   17   46
                        endTime.setHours(endHourMinute[0], endHourMinute[1], 0, 0);
                        if (endTime.getTime() >= curTime) {
                            //判断当前时间是否在特殊时间段内
                            if (curTime > beginTime.getTime() && curTime < endTime.getTime()) {
                                var html = getVideos(itemData.setting);
                                $('#adsAutoBox').html(html);
                                /*将video 插入 main.html #adsAutoBox*/
                            } else {
                                //特殊时段开始
                                setTimeout(function () {
                                    var html = getVideos(itemData.setting);
                                    $('#adsAutoBox').html(html);
                                    /*将video 插入 main.html #adsAutoBox*/
                                }, (beginTime.getTime() - curTime));
                            }
                            //特殊时段结束
                            setTimeout(function () {
                                var html = printer.defaultTimeSetting;
                                $('#adsAutoBox').html(html);
                                /*将video 插入 main.html #adsAutoBox*/
                            }, (endTime.getTime() - curTime));
                        }
                    }
                }
            });
        };

        var checkAds = function () {
            return new Promise(function (resolve, reject) {
                var appPath = printer.fs.realpathSync('.');
                var useSize = getUserInfo(data, 'useSize');
                $.each(useAd, function (i, fileName) {
                    var _localfile = appPath + '\\public\\video\\' + fileName;
                    printer.fs.exists(_localfile, function (ex) {
                        if (ex) {
                            var stat = printer.fs.statSync(_localfile).size;
                            if (useSize[i] === stat) {
                                resolve()
                            } else {
                                reject();
                            }
                        } else {
                            reject()
                        }
                    })
                });
            });
        };

        Mediator.register('downloadComplete', function () {
            console.log("下载完成");
            checkAds().then(function onFulfilled(value) {
                Mediator.send('hasAds')
            }).catch(function onRejected(error) {
                Mediator.send('noAds')
            })
        });
        Mediator.register('hasAds', function () {
            console.log("文件存在");
            loadAds()
        });
        Mediator.register('noAds', function () {
            console.log("文件不存在");
            download(data).then(function onFulfilled(value) {
                // console.log('下载广告文件失败');
                Mediator.send("downloadFailed");
            }).catch(function onRejected(error) {
                // console.log('下载广告文件成功');
                Mediator.send("downloadComplete");
            });
        });

        checkAds().then(function onFulfilled(value) {
            Mediator.send('hasAds')
        }).catch(function onRejected(error) {
            Mediator.send('noAds')
        })

    },
    /*客户端心跳*/
    'heartBeatInit': function () {
        printer.heartBeat = setInterval(function () {
            var _url = printer.appConfig.api.server,
                _machineNo = printer.appConfig.sevice.machineNo;
            _url += '/api/heartBeat/' + _machineNo + '/' + new Date().getTime();
            console.log('发送心跳');
            $.get(_url, function (heartData) {
                console.log(heartData);
            }, 'json');
        }, printer.appConfig.sevice.heartBeatTimer);
    },

    /*打印照片*/
    'print': function (path, size, callback) { //打印照片判断是几寸的
<<<<<<< HEAD
        console.log("执行打印");
=======
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
        var opt = {
            encoding: 'utf8', //编码
            timeout: 0, //超时
            maxBuffer: 200 * 1024, //信息缓冲区
            killSignal: 'SIGTERM', //??
            cwd: 'cmd', //工作目录
            env: null //环境变量
<<<<<<< HEAD
        };
=======
        }
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
        appPath = printer.fs.realpathSync('.');
        //var printCmd='mspaint /p '+appPath+'\\'+path;
        if (size != 8) {
            var printCmd = 'rundll32 C:\\WINDOWS\\system32\\shimgvw.dll,ImageView_PrintTo "' + appPath + '\\' + path + '" "DS-RX1"';
            // var printCmd = 'rundll32 C:\\WINDOWS\\system32\\shell32.dll,RestartDialog';
        } else {
            var printCmd = 'rundll32 C:\\WINDOWS\\system32\\shimgvw.dll,ImageView_PrintTo "' + appPath + '\\' + path + '" "DS-RX1-8"';
        }
        //return false;
        var child = printer.exec(printCmd, opt, function (err, stdout, stderr) {
            if (err) {
<<<<<<< HEAD
                // printer.log.print.fatal(err + '-->' + printCmd);
                console.log(err + '-->' + printCmd)
            } else {
                console.log(stderr + '-->' + printCmd)
                // printer.log.print.info(stderr + '-->' + printCmd);
=======
                printer.log.print.fatal(err + '-->' + printCmd);
            } else {
                printer.log.print.info(stderr + '-->' + printCmd);
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
            }
            if (typeof(callback) !== "undefined")
                callback(err, stdout, stderr);
        });
    },
<<<<<<< HEAD

    /*测试打印照片*/
    'testPrint': function (path, size, callback) { //打印照片判断是几寸的
        console.log("执行打印");
    }
=======
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
};
/**
 海底捞打印全局变量
 */
printer.global = {
    /**
     打印队列
     数据结构：[{"imgUrl":"..."}]
     */
    "printList": [],
    /*终端机是否工作中*/
    "isWorking": 0,
    /*终端机是否正在打印*/
    "isInPrinter": 0,
    /*开始变量*/
    "start": 1,
    /*结束变量*/
    "end": 0,
    /*终端机信息*/
    "clientInfo": {
        /*终端机动态码*/
        "randomnum": '',
        /*间隔调用时间*/
        "second": 5
    },
    /*设置动态码到终端机的展示框*/
<<<<<<< HEAD
    "setRandomNumber": function () {
=======
    "setRandomToTitle": function () {
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
        $("#dynamic-number").val(printer.global.clientInfo.randomnum);
    },
    /*设置工作状态*/
    "setWorking": function (w) {
        printer.global.isWorking = w;
    },
    /*设置打印状态*/
    "setInPrinter": function (i) {
        printer.global.isInPrinter = i;
    },
    /*检查终端是否正在工作中*/
    "checkIsWorkingSta": function () {
        return printer.global.isWorking == printer.global.start;
    },
<<<<<<< HEAD
    /*检查是否正在自动打印中*/
=======
    /**检查是否正在自动打印中*/
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
    "checkIsInPrinterSta": function () {
        return printer.global.isInPrinter == printer.global.start;
    },
    /*添加到打印队列*/
    "setPrintList": function (printObj) {
        //获取打印队列的长度
        var _len = printer.global.printList.length;
        var _imgUrl = printObj.imgUrl;
        var _isIn = false;//是否在打印队列，false 否，true 是
        if (_len === 0) {//如果打印队列为空，则插入{"imgUrl":"..."}
            printer.global.printList.push(printObj);
        }
        //验证该张图片是否存在打印队列中
        for (var i = 0; i < _len; i++) {
            var _print = printer.global.printList[i];
            if (_print.imgUrl === _imgUrl) {
                _isIn = true;
                break;
            }
        }
        if (!_isIn) {//如果没在打印队列，则添加到队列
            printer.global.printList.push(printObj);
        }
    },
    /* 清理打印队列*/
    "cleanPrintList": function (printObj) {
        var _len = printer.global.printList.length, /*打印队列的长度*/
            _imgUrl = printObj.imgUrl;
        if (_len == 0) {
            return;
        }
        for (var i = 0; i < _len; i++) {
            var _print = printer.global.printList[i];
            if (_print.imgUrl === _imgUrl) {
                printer.global.printList.splice(i, 1);
                break;
            }
        }
    },
    /*检查打印队列是否有打印任务*/
    "checkPrintList": function () {
        var _len = printer.global.printList.length;
        return _len === 0 ? false : true;
    }
};
/**
 普通打印流程
 */
printer.normal = {
    /*startTimer 对象，用于关闭调用*/
    "startTimerObj": null,
    /*连接普通服务器*/
    "clientNormalServer": function (res) {
        //设置终端机属性
        printer.global.clientInfo.randomnum = res.randomnum;
        /*间隔时间*/
        printer.global.clientInfo.second = res.second;
        //显示终端机随机码
<<<<<<< HEAD
        printer.global.setRandomNumber();
=======
        printer.global.setRandomToTitle();
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
        //调用startTimer，开始定时查询服务端关联数据
        printer.normal.startTimer();
    },
    /*开启定时获取终端机列表*/
    "startTimer": function () {
        //定义TimerObj
        printer.normal.startTimerObj = setInterval(function () {
<<<<<<< HEAD
            var _mno = printer.appConfig.sevice.machineNo,
             _url = printer.appConfig.api.server + "/api/getClientOrderList/" + _mno;
=======
            var _mno = printer.appConfig.sevice.machineNo;
            var _url = printer.appConfig.api.server + "/api/getClientOrderList/" + _mno;
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
            //获取订单列表
            $.get(_url, function (res) {
                /*res = {"sta":true,"clientOrders":[{
                 cid:"RJ00144"
                 id:"3640534"
                 isprint:"0"
                 orderno:"33723623"
                 printtime:null}]*/
                if (res.sta) {
                    var _orderLen = res.clientOrders.length;
                    if (_orderLen != 0) {//如果clientOrders为零则没有订单打印
                        //将打印对象加入到print list中
                        for (var i = 0; i < _orderLen; i++) {
                            var _clientOrder = res.clientOrders[i];
                            /*将打印对象添加到打印队列*/
                            printer.global.setPrintList({"imgUrl": _clientOrder.orderno});
                        }
                        //调用gotoPrint，前往打印
                        if (!printer.global.checkIsInPrinterSta()) {/*如果打印机没有工作*/
                            //前往打印
                            printer.normal.gotoPrint();
<<<<<<< HEAD
=======
                            console.log("goto print");
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
                        }
                    }
                } else {
                    console.error("client orders load faild , auto print not working!");
                }
            }, 'json');
        }, printer.global.clientInfo.second * 1000)
    },
    /*去打印*/
    "gotoPrint": function () {
        //设置打印机正在进行中
        printer.global.setInPrinter(printer.global.start);
        //验证终端机是否正在工作
        if (printer.global.checkIsWorkingSta()) {//终端机正在工作，启动监听服务，监听终端机状态，当处于非工作状态时不允许
            var _listenTimer = null;
            var _listenWorking = function () {
                if (!printer.global.checkIsWorkingSta()) {//如果终端机没有在工作
                    // printer.hdl.gotoPrint();
                    console.log('没在工作，去打印')
                } else {
                    if (_listenTimer != null) {
                        clearTimeout(_listenTimer);
                    }
                    _listenTimer = setTimeout(function () {
                        _listenWorking();
                    }, 3000);
                }
            }();
        } else {
            if (printer.global.checkPrintList()) {//继续进行图片下载
                //获取数组中第一个元素
                var _printObj = printer.global.printList[0];
                /*example {imgUrl:"33723623}"*/
                //检查订单是否正常
                printer.normal.downloadImg(_printObj);
            } else {
                //停止打印
                printer.global.setInPrinter(printer.global.end);
                return;
            }
        }
    },
    /**
     参数 {imgUrl:"33723623}
     success 进入打印页
     faild   删除该打印对象，重新走打印流程
     */
<<<<<<< HEAD
    "downloadImg": function (printObj) {/*example{imgUrl:"33723623"}*/
=======
    "downloadImg": function (printObj) {/*example {imgUrl:"33723623}"*/
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
        console.log('开始下载图片');
        printer.normal.getFileByCode(printObj.imgUrl, function (err, stdout, stderr) {
            if (err) {/*如果下载出现错误*/
                setTimeout(function () {
                    /*清楚打印队列中出错的项*/
                    printer.global.cleanPrintList(printObj);
                    //重新启动海底捞打印流程
                    printer.normal.gotoPrint();
                }, 1000);
            } else {/*如果成功，就去打印*/
<<<<<<< HEAD
                console.log('下载成功，去打印');
=======
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
                setTimeout(function () {
                    printer.normal.doPrint(printObj);
                }, 3000);
            }
        });
    },
    /*真正的下载图片操作*/
    'getFileByCode': function (code, callback) { //根据微信码取得文件
        var appPath = printer.fs.realpathSync('.'); //程序绝对路径
        var getCmd = 'wget -O ../public/photo/' + code + '.jpg  ' + printer.appConfig.api.server + '/print/' + code + '.jpg';
        var delCmd = 'del ' + appPath + '\\public\\photo\\' + code + '.jpg';
        var opt = {
            encoding: 'utf8', //编码
            timeout: 0, //超时
            maxBuffer: 200 * 1024, //信息缓冲区
            killSignal: 'SIGTERM', //??
            cwd: 'cmd', //工作目录
            env: null //环境变量
        };
        // 使用exec执行wget命令
        var child = printer.exec(getCmd, opt, function (err, stdout, stderr) {
            if (err) {
                //删除下载失败后产生的0字节大小的文件
                printer.exec(delCmd, opt, function (err1, stdout1, stderr1) {
                });
            } else {
                console.info(stderr + '\n----\n');
            }
            if (typeof(callback) !== "undefined") {
                callback(err, stdout, stderr);
            }
        });
    },
<<<<<<< HEAD
    "doPrint": function (printObj) {/*{}*/
=======
    "doPrint": function (printObj) {
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
        var code = printObj.imgUrl;
        var api = printer.appConfig.api.server,
            orderUrl = api + '/api/getOrder/' + code + '/' + new Date().getTime() + "?machineNo=" + printer.appConfig.sevice.machineNo,
            printPhotoUrl = api + '/api/printPhoto/' + code + '/' + printer.appConfig.sevice.machineNo + '/' + new Date().getTime();
        var _stopPrint = function (printObj) {
            //从数据库中修改该订单状态
            printer.normal.closeClientOrder(printObj.imgUrl);
            //订单获取失败，从队列中清除
            printer.global.cleanPrintList(printObj);
            //重新设置标题信息
            printer.client.getToSetInfo();
<<<<<<< HEAD
            // if (!printer.global.checkPrintList()) {
                // printer.nav.reset();
            // }
=======
            if (!printer.global.checkPrintList()) {
                printer.nav.reset();
            }
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
            //回调到gotoPrint
            setTimeout(function () {
                printer.normal.gotoPrint();
            }, 1000);

        };

<<<<<<< HEAD
        //获取订单
        $.get(orderUrl, function (orderData) {
            console.log(orderUrl);
            /* orderData = {
             state: true,
             order: {
             code: "33723623",
             count: "1",需要打印的照片数量
             currentcount: "0",已经打印的照片数量
             id: "3723623",
             info: [],
             mno: "",
             payType: "1",
             price: "0",
             resimgs: [],
             shopId: "2",
             size: "0",
             sta: "2",
             store_free_count: "0",
             storeid: "14",
             time: "1497671670",
             type: "onephoto",
             typeconf: {
             cateid: "1",
             count: "1",
             func: "bsaephoto",
             height: "0",
             icon: "/res/images/p_icon1.png",
             id: "1",
             mxn: null,
             name: "onephoto",
             ord: "1",
             state: "1",
             width: "0",
             zhname: "单张照片"
             },
             uid: "0"
             }
             }*/
            if (orderData.state) {
                console.log(orderData);
=======
        //获取订单  未完待续
        $.get(orderUrl, function (orderData) {
           /* orderData = {
                state: true,
                 order: {
                    code: "33723623",
                    count: "1",
                    currentcount: "0",
                    id: "3723623",
                    info: [],
                    mno: "",
                    payType: "1",
                    price: "0",
                    resimgs: [],
                    shopId: "2",
                    size: "0",
                    sta: "2",
                    store_free_count: "0",
                    storeid: "14",
                    time: "1497671670",
                    type: "onephoto",
                    typeconf: {
                        cateid: "1",
                        count: "1",
                        func: "bsaephoto",
                        height: "0",
                        icon: "/res/images/p_icon1.png",
                        id: "1",
                        mxn: null,
                        name: "onephoto",
                        ord: "1",
                        state: "1",
                        width: "0",
                        zhname: "单张照片"
                    },
                    uid: "0"
                }
            }*/
            if (orderData.state) {
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
                var num = orderData.order.count * 1 - orderData.order.currentcount * 1;
                if (num <= 0) {
                    //停止本次打印，并重新走打印流程
                    _stopPrint(printObj);
                } else {
                    var sumNum = num;
                    var nowNum = 1;
                    //递归打印照片
                    var _printPhoto = function (code) {
                        if (num <= 0) {
                            //停止本次打印，并重新走打印流程
                            _stopPrint(printObj);
                        } else {
                            //更新服务器订单打印计数
                            $.get(printPhotoUrl, function (printPhotoData) {
<<<<<<< HEAD
                                /*printPhotoData =  {state: true, current: 1, count: "1"}*/
                                console.log("订单更新成功");
                                if (printPhotoData.state) {
                                    //执行打印

=======
                                console.log(printPhotoData);
                                if (printPhotoData.state) {
                                    //执行打印
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
                                    var delPhotoEvent = function () {
                                        var _a = printer.fs.realpathSync('.'),
                                            _f1 = '\\public\\photo\\';
                                        _unp = _a + _f1 + code + '.jpg';
<<<<<<< HEAD
                                        /*测试某个路径下的文件是否存在*/
                                        printer.fs.exists(_unp, function (ex) {
                                            if (ex) {/*false 不存在  true 存在*/
                                                /*删除路径下的文件*/
                                                printer.fs.unlinkSync(_unp);
                                            }
=======
                                        printer.fs.exists(_unp, function (ex) {
                                            if (ex)
                                                printer.fs.unlinkSync(_unp);
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
                                        });
                                        try {
                                            clearTimeout(_auto_close_event);
                                        } catch (e) {
                                            //console.log(e);
                                        }
<<<<<<< HEAD
                                        // printer.nav.reset();
                                    };
                                    var _size = orderData.order.size;
                                    printer.print('public\\photo\\' + code + '.jpg', _size, function (err, stdout, stderr) {

                                        //alert('打印 '+printPhotoData.current+' 指令发送成功！');
                                        //防止多次弹出完成提示框
                                        /*printer.alert({
=======
                                        ;
                                        printer.nav.reset();
                                    }
                                    //console.log("啊哈哈哈哈哈哈哈哈" + orderData.order);
                                    //add by yaojinqiu 20160713
                                    var _size = orderData.order.size;
                                    printer.print('public\\photo\\' + code + '.jpg', _size, function (err, stdout, stderr) {
                                        //console.log('---------->',i,num);
                                        //alert('打印 '+printPhotoData.current+' 指令发送成功！');
                                        //防止多次弹出完成提示框
                                        printer.alert({
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
                                            'title': '正在打印...',
                                            'txt': '共' + sumNum + '张，系统正在打印第' + nowNum + '张，请稍候..<p style="color:red;font-size:14px;"><span id="self_print_tips_box"></span>为了保护您的隐私，本照片将自动从本终端删除！</p>',
                                            'btn': ['确定'],
                                            'top': 100,
                                            'callback': [function (o) {
                                                delPhotoEvent();
                                            }]
<<<<<<< HEAD
                                        });*/
=======
                                        });
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
                                        num--;
                                        nowNum++;
                                        var _tips_event_i = 0;
                                        var _tips_event = function () {
                                            _tips_event_i += 1;
<<<<<<< HEAD
                                           if (_tips_event_i < 10) {
=======
                                            $('#self_print_tips_box').html('打印指令发送成功！' + (10 - _tips_event_i) + ' 秒后自动关闭！<br>');
                                            if (_tips_event_i < 10) {
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
                                                _auto_close_event = setTimeout(function () {
                                                    _tips_event();
                                                }, 1000);
                                            } else {
                                                if (num <= 0) {
                                                    delPhotoEvent();
                                                }
                                            }
<<<<<<< HEAD
                                        };
                                        // printer.log.other.info("print success!");
                                        console.log("print success!");
=======
                                        }
                                        printer.log.other.info("print success!");
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
                                        _tips_event();
                                        //修改num数量
                                        //进行第N次打印
                                        setTimeout(function () {
                                            _printPhoto(code);
                                        }, 9500);
                                    });
                                } else {
<<<<<<< HEAD
                                    console.log("order upd faild ：" + code);
                                    // printer.log.other.info("order upd faild ：" + code);
=======
                                    printer.log.other.info("order upd faild ：" + code);
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
                                    //停止本次打印，并重新走打印流程
                                    _stopPrint(printObj);
                                }
                            });
                        }
<<<<<<< HEAD
                    };
=======
                    }
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
                    _printPhoto(code);
                }
            } else {
                //停止本次打印，并重新走打印流程
                _stopPrint(printObj);
            }
        });
    },
<<<<<<< HEAD
    "closeClientOrder": function (imgUrl) {
        var api = printer.appConfig.api.server;
        var closeApi = api + "/api/closeClientOrder/" + imgUrl;
        // printer.log.other.info("close client order code is  ：" + code);
        console.log("关闭的打印订单是：" + imgUrl);
=======
    "closeClientOrder": function (code) {
        var api = printer.appConfig.api.server;
        var closeApi = api + "/api/closeClientOrder/" + code;
        printer.log.other.info("close client order code is  ：" + code);
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
        $.get(closeApi, function (result) {
        });
    }
};

/**
 获取终端机信息
 */
printer.client = {
    "getInfo": function () {
        /*_mno = RJ00144，机器识别码*/
        var _mno = printer.appConfig.sevice.machineNo,
            /*_url = http://123.57.207.27/api/clientInfo/RJ00144*/
            _url = printer.appConfig.api.server + "/api/clientInfo/" + _mno;

        $.get(_url, function (res) {/*res ={printerTimer:12,processtype:0,randomnum:74434,second:5,sta:true}*/
<<<<<<< HEAD
            if (res.sta && res.processtype === 0) {
=======
            if (res.sta && res.processtype == 0) {
>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
                //走普通打印流程
                printer.normal.clientNormalServer(res);
            }
        }, 'json');
    },

    "getToSetInfo": function () {/*获取动态打印码*/
        var _mno = printer.appConfig.sevice.machineNo;
        /*机器码RJ00144*/
        /*_url =  http://123.57.207.27/api/clientInfo/RJ00144*/
        var _url = printer.appConfig.api.server + "/api/clientInfo/" + _mno;
        $.get(_url, function (res) {
            // res = {"sta":true,"randomnum":39138,"second":5,"processtype":0,"printerTimer":12}
            if (res.sta) {
                // printer.log.other.info("get processtype success is : " + res.processtype);
                console.log("get processtype success is : " + res.processtype);
                if (res.processtype == 0) {
                    printer.global.clientInfo.randomnum = res.randomnum;
                    printer.global.clientInfo.second = res.second;
                    //显示终端机随机码
<<<<<<< HEAD
                    printer.global.setRandomNumber();
                    console.log("reset random to title : " + res.randomnum)
                    // printer.log.other.info("reset random to title : " + res.randomnum);
=======
                    printer.global.setRandomToTitle();
                    console.log("reset random to title : " + res.randomnum)
                    // printer.log.other.info("reset random to title : " + res.randomnum);
                } else if (res.processtype == 1) {

>>>>>>> 86058ddac6724e0fa26d1e8e876107117324d4f1
                }
            } else {
                // printer.log.other.info("client info load faild , auto print not working!");
                console.log("client info load faild , auto print not working!")
            }
        }, 'json');
    }
};