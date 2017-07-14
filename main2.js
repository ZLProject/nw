var fs = require('fs'),//文件读写
    path = require('path'),
    exec = require("child_process").exec,//子进程执行库
    appConfig = require('./configs'),//配置文件
    appPath = fs.realpathSync('.');//当前程序的绝对路径

var opt = {
    encoding: 'utf8', //编码
    timeout: 0, //超时
    maxBuffer: 200 * 1024, //信息缓冲区
    killSignal: 'SIGTERM', //??
    cwd: 'cmd', //工作目录
    env: null //环境变量
};

/*中介者对象*/
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

/*后端服务模块*/
var uploadService = function () {
    var p = printer;
    //printer.localIp=printer.getLocalIP();	//终端ip
    var port = {
            'http': 0,
            'upload': 0
        },
        $dirname = fs.realpathSync('.'),
        mine = appConfig.mine,
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
            appConfig.sevice.filePortSSL = uploadSSl.address().port;
        });
    } else {
        var uploadHttp = http.createServer(serve).listen(port.upload);
        uploadHttp.on('listening', function () {
            console.log("Http Upload Sevice 服务在端口 " + uploadHttp.address().port + " 启动成功.");
            appConfig.sevice.filePort = uploadHttp.address().port;
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
        appConfig.sevice.httpPort = serverHttp.address().port;
    });
};


/*广告模块*/
var ad = {
    'showAds': 0,
    'hasAds': false,
    /*广告加载*/
    'updateAds': function () {
        /*_machineNo  =  RJ00144(终端机编号)*/
        var _machineNo = appConfig.sevice.machineNo;
        /*appConfig.api.server == http://123.57.207.27*/
        $.get(appConfig.api.server + '/api/videoMno/' + _machineNo + '?' + new Date().getTime(), function (res) {
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
                ad.linkAds(res.data);
            }
            /*else if(res.update != undefined){/!*无关联,使用之前视频播放方式*!/
             printer.getAds(); //自动更新广告
             }*/
        });
    },
    /*关联广告加载*/
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

        fs.readdir(appPath + '\\public\\video', function (err, files) {
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
                    fs.unlinkSync(_unpath);//fs.unlinkSync() 删除文件操作。
                }
            });
        });

        var setting = getUserInfo(data, 'setting');
        var useAd = getUserInfo(data, 'useAd');
        var download = function (data) {
            var opts = {
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
                    var cmdCommand = 'wget -O ../public/video/' + fileName + '  ' + appConfig.api.server + '/video/' + fileName;
                    exec(cmdCommand, opts, function (err, stdout, stderr) {
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
                var html = '<video id="video"  autoplay="autoplay" width="100%" height="100%"></video>' +
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
                //默认时段
                var html = getVideos(itemData.setting);
                /*itemData.setting = ["video285.mp4", "video283.mp4"]*!/
                 /!*把得到的video标签 写入到ad.html里面去
                 * 文件名称
                 * 要写入的数据
                 * */
                fs.writeFile("public/video/ad.html", html, "binary", function (err) {
                    if (err) {
                        console.log("video标签写入ad.html失败!");
                    } else {
                        console.log("video标签写入ad.html成功!");
                    }
                });
                $('#adsAutoBox').append(html);
                /*将video 插入 main.html #adsAutoBox*/
                // alert("下载完成");

            });
        };

        var checkAds = function () {
            return new Promise(function (resolve, reject) {
                var useSize = getUserInfo(data, 'useSize');
                $.each(useAd, function (i, fileName) {
                    var _localfile = appPath + '\\public\\video\\' + fileName;
                    printer.readLocalFile(_localfile,function (ex) {
                        if (ex) {
                            var stat = fs.statSync(_localfile).size;
                            if (useSize[i] === stat) {
                                resolve()
                            } else {
                                reject();
                            }
                        } else {
                            reject()
                        }
                    });
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

    }
};

/*打印照片模块*/
var printer = {
    /*打印全局变量*/
    'global':{
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
        "setRandom": function () {
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
        /**检查是否正在自动打印中*/
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
                return;
                /*直接退出，防止下面代码执行*/
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
            console.log('打印队列为', printer.global.printList);
        },
        /* 清理打印队列*/
        "cleanPrintList": function (printObj) {
            var _len = printer.global.printList.length, /*打印队列的长度*/
                _imgUrl = printObj.imgUrl;
            if (_len === 0) {
                return;
            }
            for (var i = 0; i < _len; i++) {
                var _print = printer.global.printList[i];
                if (_print.imgUrl === _imgUrl) {
                    printer.global.printList.splice(i, 1);
                    break;
                }
            }
            console.log('清理后的打印队列为', printer.global.printList)
        },
        /*检查打印队列是否有打印任务*/
        "checkPrintList": function () {
            var _len = printer.global.printList.length;
            return _len === 0 ? false : true;
        }
    },

    'readLocalFile':function (filePath,callback) {
        fs.exists(filePath, function (ex) {
            callback && callback(ex);
        })
    },
    /*客户端心跳*/
    'heartBeatInit': function () {
        printer.heartBeat = setInterval(function () {
            var _url = appConfig.api.server,
                _machineNo = appConfig.sevice.machineNo;
            _url += '/api/heartBeat/' + _machineNo + '/' + new Date().getTime();
            console.log('发送心跳');
            $.get(_url, function (heartData) {
                console.log(heartData);
            }, 'json');
        }, appConfig.sevice.heartBeatTimer);
    },

    /**
     普通打印流程
     */
    'normal':{
        /*连接普通服务器*/
        "clientNormalServer": function (res) {
            //设置终端机属性
            printer.global.clientInfo.randomnum = res.randomnum;
            /*间隔时间*/
            printer.global.clientInfo.second = res.second;
            //显示终端机随机码
            printer.global.setRandom();
            //调用startTimer，开始定时查询服务端关联数据
            printer.normal.startTimer();
        },
        /*预览图片的函数
        * imgSrc 图片路径*/
        'previewImg':function (imgSrc) {
            var main = document.getElementById('main-js'),
                div = document.createElement('div');
            /*解析字符串模板的函数*/
            var formateString = function (str, data) {
                return str.replace(/\{#(\w+)#\}/g,function (match, key) {
                    return typeof data === 'undefined' ? '' : data;
                })
            };
            var tpl = [
                '<div class="innerBox">',
                '<img src="{#imgSrc#}" alt="">',
                '<button id="sure">确定</button>',
                '<button id="cancel">取消</button>',
                '</div>'
            ].join('');
            div.id = 'preview-js';
            div.className = 'preview';
            div.innerHTML = formateString(tpl, imgSrc);
            main.appendChild(div);
            $("#sure").click(function () {
                $("#preview-js").remove();
                Mediator.send('printOk')
            });
            $("#cancel").click(function () {
                $("#preview-js").remove();
                Mediator.send('printNo')
            });
        },
        /*开启定时获取终端机列表*/
        "startTimer": function () {
            //定义TimerObj
            var startTimerObj = setInterval(function () {
                console.log("开启定时查询定单服务");
                var _mno = appConfig.sevice.machineNo;
                var _url = appConfig.api.server + "/api/getClientOrderList/" + _mno;
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
                            var _printObj = printer.global.printList[0];
                            var _photoFile = appPath + '\\public\\photo\\' + _printObj.imgUrl + '.jpg';
                            var promise = new Promise(function (resole, reject) {
                                printer.readLocalFile(_photoFile,function (ex) {
                                    if (ex){
                                        resole();
                                    }else {
                                        reject();
                                    }
                                })
                            });
                            promise.then(function onFulfilled(value) {
                                clearInterval(startTimerObj);
                                console.log('图片存在');
                                /*预览图片*/
                                printer.normal.previewImg(_photoFile);
                                /*如果用户点击确定，开始打印图片*/
                                Mediator.register('printOk',printer.normal.gotoPrint);
                                /*如果用户点击取消，停止打印*/
                                Mediator.register('printNo',function () {
                                    printer.normal.stopPrint(_printObj);
                                });
                            }).catch(function onRejected(printObj) {
                                clearInterval(startTimerObj);
                                console.log('本地不存在图片，执行下载步骤');
                                printer.normal.downloadImg(_printObj)
                            })
                        }
                    } else {
                        console.error("client orders load faild , auto print not working!");
                    }
                }, 'json');
            }, printer.global.clientInfo.second * 1000)
        },
        /**
         参数 {imgUrl:"33723623}
         success 进入打印页
         faild   删除该打印对象，重新走打印流程
         */
        "downloadImg": function (printObj) {/*example {imgUrl:"33723623}"*/
            /*下载图片的命令*/
            var getCmd = 'wget -O ../public/photo/' + printObj.imgUrl + '.jpg  ' + appConfig.api.server + '/print/' + printObj.imgUrl + '.jpg';

            var promise = new Promise(function (resole, reject) {
                // 使用exec执行wget命令
                exec(getCmd, opt, function (err, stdout, stderr) {
                    if (err) {//如果图片下载失败，执行reject回调函数
                        reject(printObj);
                    } else {//如果下载图片成功，执行resole回调函数
                        resole();
                    }
                });
            });
            promise.then(function onFulfilled(value) {
                console.log("图片下载成功");

                printer.normal.startTimer();
            }).catch(function onRejected(printObj) {
                console.log('图片下载失败');
                /*删除图片的命令*/
                var delCmd = 'del ' + appPath + '\\public\\photo\\' + printObj.imgUrl + '.jpg';
                //删除下载失败后产生的0字节大小的文件
                exec(delCmd, opt, function (err1, stdout1, stderr1) {});
                /*清楚打印队列中出错的项*/
                printer.global.cleanPrintList(printObj);
                //调用startTimer，开始定时查询服务端关联数据
                printer.normal.startTimer();
            })
        },
        /*去打印*/
        "gotoPrint": function () {
            //设置打印机正在进行中
            printer.global.setInPrinter(printer.global.start);
            //验证终端机是否正在工作
            if (printer.global.checkIsWorkingSta()) {//终端机正在工作，启动监听服务，监听终端机状态，当处于非工作状态时不允许
                console.log('终端机正在工作中');
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
                console.log('终端机没有工作');
                if (printer.global.checkPrintList()) {//打印队列中是否还有打印任务
                    //获取数组中第一个元素
                    var _printObj = printer.global.printList[0];
                    /*example {imgUrl:"33723623}"*/
                    //检查订单是否正常
                    printer.normal.doPrint(_printObj);
                } else {
                    //设置打印状态为非工作状态
                    printer.global.setInPrinter(printer.global.end);
                    return;
                }
            }
        },

        "doPrint": function (printObj) {
            var _imgUrl = printObj.imgUrl;
            var _server = appConfig.api.server,
                orderUrl = _server + '/api/getOrder/' + _imgUrl + '/' + new Date().getTime() + "?machineNo=" + appConfig.sevice.machineNo,
                printPhotoUrl = _server + '/api/printPhoto/' + _imgUrl + '/' + appConfig.sevice.machineNo + '/' + new Date().getTime();
            //获取订单
            $.get(orderUrl, function (orderData) {
                console.log('当前订单数' + orderData.order.count, '已打印订单数' + orderData.order.currentcount);
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
                    console.log('订单状态' + orderData.state);
                    var num = orderData.order.count * 1 - orderData.order.currentcount * 1;
                    if (num <= 0) {
                        //停止本次打印，并重新走打印流程
                        printer.normal.stopPrint(printObj);
                    } else {
                        //获取服务器订单打印计数
                        $.get(printPhotoUrl, function (printPhotoData) {
                            console.log(printPhotoData.state);
                            // console.log(printPhotoData);
                            if (printPhotoData.state) {
                                //执行打印
                                var _size = orderData.order.size;
                                printer.print(printObj, _size, function (photoName) {
                                    /*删除本地打印过的照片*/
                                    printer.normal.deletePhoto(photoName);
                                    printer.normal.stopPrint(printObj);
                                })
                            } else {
                                //停止本次打印，并重新走打印流程
                                printer.normal.stopPrint(printObj);
                            }
                        });
                    }
                } else {
                    //停止本次打印，并重新走打印流程
                    console.log('停止打印');
                    printer.normal.stopPrint(printObj);
                }
            });
        },
        "closeClientOrder": function (code) {
            var api = appConfig.api.server;
            var closeApi = api + "/api/closeClientOrder/" + code;
            $.get(closeApi, function (result) {});
        },
        /*
         * 打印完成之后删除目录下的照片
         * photoName  要删除的照片名称
         */
        'deletePhoto': function (photoName) {
            var _photoPath = '\\public\\photo\\',
                _path = appPath + _photoPath + photoName + '.jpg';
            /*测试路径下的文件是否存在*/
            var timer = setInterval(function () {/*定时删除文件，当文件没有写入时，程序已执行完毕。不能正确读取文件*/
                fs.exists(_path, function (ex) {
                    if (ex) {/*如果存在*/
                        /*清除定时器*/
                        clearInterval(timer);
                        /*删除照片操作*/
                        fs.unlinkSync(_path);
                        console.log('照片' + photoName + '.jpg，已成功删除！')
                    }
                });
            }, 1000)
        },
        /*
         * 停止打印
         * printObj  {imgUrl:'url'}*/
        'stopPrint': function (printObj) {
            //从数据库中修改该订单状态
            printer.normal.closeClientOrder(printObj.imgUrl);
            //订单获取失败，从队列中清除
            printer.global.cleanPrintList(printObj);
            //重新设置标题信息
            printer.client.getToSetInfo();

            printer.normal.startTimer();
        }
    },

    /*打印照片*/
    'print': function (printObj, size, callback) {
        var _photoName = printObj.imgUrl;
        var _path = 'public\\photo\\' + _photoName + '.jpg';
        if (size != 8) {
            // var printCmd = 'rundll32 C:\\WINDOWS\\system32\\shimgvw.dll,ImageView_PrintTo "' + appPath + '\\' + _path + '" "DS-RX2"';
            console.log('正在打印照片');
        } else {
            // var printCmd = 'rundll32 C:\\WINDOWS\\system32\\shimgvw.dll,ImageView_PrintTo "' + appPath + '\\' + _path + '" "DS-RX1-8"';
        }
        // var child = exec(printCmd, opt, function (err, stdout, stderr) {
        //     if (err) {
        //         console.log(err + '-->' + printCmd);
        //     } else {
        //         console.log(stderr + '-->' + printCmd);
        //     }
        // });
        callback && callback(_photoName);
    }
};



/**
 获取终端机信息
 */
printer.client = {
    "getInfo": function () {
        /*_mno = RJ00144，机器识别码*/
        var _mno = appConfig.sevice.machineNo,
            /*_url = http://123.57.207.27/api/clientInfo/RJ00144*/
            _url = appConfig.api.server + "/api/clientInfo/" + _mno;
        $.get(_url, function (res) {/*res ={printerTimer:12,processtype:0,randomnum:74434,second:5,sta:true}*/
            if (res.sta && res.processtype == 0) {
                //走普通打印流程
                printer.normal.clientNormalServer(res);
            }
        }, 'json');
    },

    "getToSetInfo": function () {/*获取动态打印码*/
        var _mno = appConfig.sevice.machineNo;
        /*机器码RJ00144*/
        /*_url =  http://123.57.207.27/api/clientInfo/RJ00144*/
        var _url = appConfig.api.server + "/api/clientInfo/" + _mno;
        $.get(_url, function (res) {
            // res = {"sta":true,"randomnum":39138,"second":5,"processtype":0,"printerTimer":12}
            if (res.sta) {
                // printer.log.other.info("get processtype success is : " + res.processtype);
                console.log("get processtype success is : " + res.processtype);
                if (res.processtype == 0) {
                    printer.global.clientInfo.randomnum = res.randomnum;
                    printer.global.clientInfo.second = res.second;
                    //显示终端机随机码
                    printer.global.setRandom();
                    console.log("reset random to title : " + res.randomnum)
                    // printer.log.other.info("reset random to title : " + res.randomnum);
                } else if (res.processtype == 1) {

                }
            } else {
                // printer.log.other.info("client info load faild , auto print not working!");
                console.log("client info load faild , auto print not working!")
            }
        }, 'json');
    }
};