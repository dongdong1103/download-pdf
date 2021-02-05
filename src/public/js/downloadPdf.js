;(function(undefined) {
    "use strict" //使用js严格模式检查，使语法更规范
    var _global;
    var plugin = {
        domWidth: null,
        a4DomHeight: null,
        blankHead: false,
        pdfDownloadPaddingClear: function(node) {
            const allTds = node.find('td')
            Array.from(new Set(allTds)).forEach(ele => {
                ele.style.paddingTop = 0
            })
        },
        pdfDownloadPadding: async function(node) {
            let modules = Array.from(node.childNodes).find(ele => ele.localName === 'tbody').childNodes;
            for(let i = 1,len = modules.length;i < len;i++){
                await plugin.pdfDownloadPaddingFun(modules[i])
            }
        },
        pdfDownloadPaddingFun: async function(item) {
            const pageHeaderH = plugin.blankHead ? 0 : 40;  //页头的高度
            const pageFooterH = plugin.blankHead ? 50 : 100;  //页尾的高度
            if(item.localName == 'tr'){
                let beforeH = $(item).offset().top;
                const topPage = Math.floor(beforeH/plugin.a4DomHeight)
                let lengDom = item.clientHeight > (plugin.a4DomHeight - pageHeaderH - pageFooterH)
                const pagePadding = (plugin.a4DomHeight * (topPage + 1)) - beforeH
                /**
                 * 两种情况需要分页（添加padding-top）
                 * 1. tr高度 > pdf height
                 * 2. tr高度 < pdf height，但是tr top 到 tr top所在页的距离 - tr自高 < 页脚pageFooterH
                */
                if (!!lengDom || pagePadding - item.clientHeight < pageFooterH) {
                    const paddings = pagePadding + pageHeaderH
                    await Array.from(new Set(item.children)).forEach(ele => {
                        ele.style.paddingTop = paddings + 'px'
                    })
                    if (!!lengDom) {
                        if (item.querySelector('table')) {
                            await plugin.pdfDownloadPadding($(item.querySelector('table'))[0]);
                        }
                    }
                }
            }
        },
        pdfDownload: async function({id, lang, name, noHead = false} = {id, lang, name, noHead}){
            await $('html').animate({scrollTop:0},800); // 滚动到top再进行下载
            const element = $("#" + id);    // 这个dom元素是要导出pdf的div容器
            if (!element.length) {
                return
            }
            const loading = document.getElementById("download-loading")
            if (loading) {
                loading.style.display = 'block'
            }
            const a4Width = 592.28
            const a4Height = 841.89
            const w = element.width();    // 获得该容器的宽
            const h = element.height();    // 获得该容器的高
            const offsetTop = element.offset().top;    // 获得该容器到文档顶部的距离
            const offsetLeft = element.offset().left;    // 获得该容器到文档最左的距离
            plugin.domWidth = w
            plugin.blankHead = noHead
            plugin.a4DomHeight = Math.floor(w/a4Width * a4Height)
            await plugin.pdfDownloadPadding(element[0]);
            setTimeout(() => {
            let canvas = document.createElement("canvas");
            let abs = 0;
            const win_i = $(window).width();    // 获得当前可视窗口的宽度（不包含滚动条）
            const win_o = window.innerWidth;    // 获得当前窗口的宽度（包含滚动条）
            if(win_o>win_i){
                abs = (win_o - win_i)/2;    // 获得滚动条长度的一半
            }
            canvas.width = w * 2;    // 将画布宽&&高放大两倍
            canvas.height = h * 2;
            let context = canvas.getContext("2d");
            context.fillStyle = 'red'; //设置背景色为白色
            context.scale(2, 2);
            context.translate(-offsetLeft-abs,-offsetTop);
            // 这里默认横向没有滚动条的情况，因为offset.left(),有无滚动条的时候存在差值，因此
            // translate的时候，要把这个差值去掉
            html2canvas(element,
            {background :'#FFFFFF', scale:2,dpi: 150}).then(function(canvas) {
            let contentWidth = canvas.width;
            let contentHeight = canvas.height;
            //一页pdf显示html页面生成的canvas高度;
            let pageHeight = contentWidth / a4Width * a4Height;
            //未生成pdf的html页面高度
            let leftHeight = contentHeight;
            //页面偏移
            let position = 0;
            //a4纸的尺寸[595.28,841.89]，html页面生成的canvas在pdf中图片的宽高
            let imgWidth = a4Width;
            let imgHeight = a4Width/contentWidth * contentHeight;

            let pageData = canvas.toDataURL('image/jpeg', 1.0);

            let pdf = new jsPDF('', 'pt', 'a4');

            //有两个高度需要区分，一个是html页面的实际高度，和生成pdf的页面高度(841.89)
            //当内容未超过pdf一页显示的范围，无需分页
            if (leftHeight < pageHeight) {
                pdf.addImage(pageData, 'JPEG', 0, noHead ? 0 : 60, imgWidth, imgHeight);
            } else {    // 分页
                while(leftHeight > 0) {
                    pdf.addImage(pageData, 'JPEG', 0, position + 20, imgWidth, imgHeight)
                    leftHeight -= pageHeight;
                    position -= a4Height;
                    //避免添加空白页
                    if(leftHeight > 0) {
                        pdf.addPage();
                    }
                }
            }
            // 添加图片水印及页眉页脚
            let totalPages = pdf.internal.getNumberOfPages();
            let head = new Image;
            head.crossOrigin = "";
            head.src = `./public/images/${noHead ? 'footer' : 'header'}.jpg`;
            let footer = new Image;
            footer.crossOrigin = "";
            footer.src = `./public/images/footer.jpg`;
            head.onload = function() {
                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    let pdfWidth = pdf.internal.pageSize.width
                    let pdfHeight = pdf.internal.pageSize.height
                    let headerHeight = pdfWidth/head.width * head.height
                    let footerHeight = pdfWidth/footer.width * footer.height
                    // 页眉
                    pdf.addImage(head, -10, 0, pdfWidth, headerHeight);
                    // 页脚
                    if (noHead) {
                        pdf.addImage(footer, 0, pdfHeight - 12.5, pdfWidth - 25, footerHeight);
                    } else {
                        pdf.addImage(footer, 0, pdfHeight - 25, pdfWidth, footerHeight);
                        pdf.setFontSize(8);
                        pdf.setFillColor('#ccc')
                        pdf.text(pdfWidth - 60, pdfHeight - 10, 'Page: ' + i +'/' + totalPages); //print number bottom right
                    }

                }

                pdf.save(`${name}.pdf`);
                plugin.pdfDownloadPaddingClear(element);
                if (loading) {
                    loading.style.display = 'none'
                }
            };
            })
            }, 800);
        }
    }
    // 最后将插件对象暴露给全局对象
    _global = (function(){ return this || (0, eval)('this'); }());
    if (typeof module !== "undefined" && module.exports) {
        module.exports = plugin;
    } else if (typeof define === "function" && define.amd) {
        define(function(){return plugin;});
    } else {
        !('plugin' in _global) && (_global.plugin = plugin);
    }
})();
