# html转pdf
----
查阅了很多的资料，目前html转pdf下载，大部分都是由后端来完成。调研后决定前后端分离，前端实现整个功能，后端只负责提供接口数据。
使用html2canvas+jspdf生成pdf，jsrender模版引擎实现从接口获取数据后赋值到html。
当然生成pdf还存在一些问题，于是就诞生了这个插件。
## 引用的插件
- [html2canvas](https://html2canvas.hertzen.com/)使用JavaScript屏幕截图
- [jspdf](http://raw.githack.com/MrRio/jsPDF/master/docs/)用JavaScript生成pdf的库
- [jspdf](https://www.jsviews.com/#fortag)模板库，支持创建自定义函数，并使用纯基于字符串的呈现
## 使用
引用:
```javascript
<script type="text/x-jsrender" id="j-template">
	<table id="pdf-content">
    <tbody>
      <tr>
		    <h3>{{:item.title}}</h3>
		    <p>{{:item.author}}</p>
      </tr>
    </tbody>
	</table>
</script>
<script src="./public/js/jquery-3.5.1.min.js"></script>
<script src="./public/js/jsrender.min.js"></script>
<script src="./public/js/html2canvas2.js"></script>
<script src="./public/js/jspdf.js"></script>
<script src="./public/js/downloadPdf.js"></script>
```
调用:
例子中使用json代替接口ajax获取数据。实际项目可调用接口获取数据。
```javascript
<script type="text/javascript">
	function getJson(res) {
		//获取模板
		jsRenderTpl = $.templates('#j-pdf'),
		//模板与数据结合
		finalTpl = jsRenderTpl(res);
		$('.content-body').html(finalTpl);
		// 下载
		$("#download").click(function () {
			with (plugin) {
				/**
				 * id：下载dom id
				 * name：下载pdf名称
				 */
				pdfDownload({
				  id: "pdf-content",
				  name: res.id,
				});
			}
		})
	}
</script>
<script src="./public/data.json?callback=getJson"></script>
```
