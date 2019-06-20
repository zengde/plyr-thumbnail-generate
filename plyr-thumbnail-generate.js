(function (document) {
	// only firefox support contextmenu attribute ' contextmenu="supermenu" ' and menu element
	let firefoxHtml = `
	<menu type="context" id="supermenu">
	  <menu label="Create Thumbnail Image">
		<menuitem label="1x1" onclick="alert('no')"></menuitem>
		<menuitem label="3x3" onclick="alert('no')"></menuitem>
		<menuitem label="4x4" onclick="alert('no')"></menuitem>
		<menuitem label="7x7" onclick="alert('no')"></menuitem>
		<menuitem label="10x10" onclick="alert('no')"></menuitem>
	  </menu>
	</menu>`;

	let thumbnailHtml = `
	<style>
	.cls-context-menu-link {
	   display:block;
	   padding:20px;
	   background:#ECECEC;
	}

	.cls-context-menu { position:absolute; display:none;z-index:5; }

	.cls-context-menu ul, #context-menu li {
	   list-style:none;
	   margin:0; padding:0;
	   background:white;
	}

	.cls-context-menu { border:solid 1px #CCC;}
	.cls-context-menu li { border-bottom:solid 1px #CCC; }
	.cls-context-menu li:last-child { border:none; }
	.cls-context-menu li a {
	   display:block;
	   padding:5px 20px 5px 10px;
	   text-decoration:none;
	   color:blue;
	}
	.cls-context-menu li a:hover {
	   background:blue;
	   color:#FFF;
	}
	.cls-context-dropdown>a:after {
		display: block;
		float: right;
		width: 0;
		height: 0;
		margin-top: 7px;
		margin-right: -15px;
		border-color: transparent;
		border-left-color: #f00;
		border-style: solid;
		border-width: 5px 0 5px 5px;
		content: " ";
	}
	.cls-context-dropdown >ul{display:none;}
	.cls-context-dropdown:hover >ul{display:block;}
	.cls-context-dropdownsub{
		position:absolute;
		top: 0;
		left: 100%;
		margin-top: -6px;
		margin-left: -1px;
		-webkit-border-radius: 0 6px 6px 6px;
		-moz-border-radius: 0 6px 6px 6px;
		border-radius: 0 6px 6px 6px;
	}
	</style>
	<div id="div-context-menu" class="cls-context-menu">
	   <ul>
		   <li class='cls-context-dropdown'>
			   <a href='javascript:;'>Create Thumbnail Image</a>
			   <ul class='cls-context-dropdownsub'>
				   <li>
					   <a class='cls-context-item' href='javascript:;'>1x1</a>
					   <a class='cls-context-item' href='javascript:;'>3x3</a>
					   <a class='cls-context-item' href='javascript:;'>4x4</a>
					   <a class='cls-context-item' href='javascript:;'>7x7</a>
					   <a class='cls-context-item' href='javascript:;'>10x10</a>
				   </li>
			   </ul>
		   </li>
	   </ul>
	</div>`;

	function saveScreenShot (data, filename) {
		let saveLink = document.createElement('a');
		saveLink.href = data;
		saveLink.download = filename;
		let event = document.createEvent('MouseEvents');
		event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		saveLink.dispatchEvent(event);
	}

	async function capture (player, label, matrix) {
		matrix = matrix.split('x');
		let [rows, cols] = matrix;
		let total = rows * cols;

		let { videoWidth, videoHeight } = player.media;

		let { width: thumbWidth = 220, height: thumbHeight = 170, after = 'download' } = player.config.thumbnailCreate || {};
		let [totalWidth, totalHeight] = [cols * thumbWidth, rows * thumbHeight];

		let { duration, startTime } = player;
		let inter = duration / total;
		// console.dir('duration--'+duration)
		// console.dir('inter--'+inter)
		// console.dir('matix--'+rows+','+cols)
		player.currentTime = 0;

		let canvas = Object.assign(document.createElement('canvas'), { width: totalWidth, height: totalHeight });
		let canvasCtx = canvas.getContext('2d');

		let img = new Image();
		img.setAttribute('crossOrigin', 'anonymous');

		let x, y;
		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < cols; j++) {
				await new Promise((resolve, reject) => {
					player.currentTime += inter;
					setTimeout(() => {
						// console.log('cutime--'+player.currentTime)
						x = j * thumbWidth;
						y = i * thumbHeight;
						// console.log('x,y--'+x+','+y)
						canvasCtx.drawImage(player.media, x, y, thumbWidth, thumbHeight);
						resolve(true);
					}, 1000);
				});
			}
		}

		player.currentTime = startTime;

		img.onload = (function () {
			let imgURI = canvas.toDataURL('image/png');
			img.src = imgURI.replace('image/png', 'image/octet-stream');
			let screenShotImg = img.src.replace(/^data:image\/[^;]+/, 'data:application/octet-stream');
			switch (after) {
				case 'download':
					saveScreenShot(screenShotImg, `${label}.png`);
					break;
				case 'poster':
					player.elements.container.classList.add('plyr__poster-enabled');
					player.elements.poster.style.backgroundImage = `url(${imgURI})`;
					break;
				case 'thumbnail':
					player.config.thumbnail = {
						enabled: true,
						pic_num: total,
						width: thumbWidth,
						height: thumbHeight,
						col: cols,
						row: rows,
						offsetX: 0,
						offsetY: 0,
						urls: [imgURI]
					};
					break;
			}
		})();
	}

	// chrome 上设置currentTime失效 解决方法 将video src改为在线视频完整引用地址
	document.addEventListener('ready', event => {
		const curPlayer = event.detail.plyr;
		const config = curPlayer.config;

		document.body.insertAdjacentHTML('beforeend', thumbnailHtml);
		const rgtClickContextMenu = document.getElementById('div-context-menu');

		curPlayer.elements.wrapper.addEventListener('contextmenu', e => {
			var elmnt = e.target

			// e.preventDefault();
			var eid = elmnt.id.replace(/link-/, "")
			rgtClickContextMenu.style.left = e.pageX + 'px'
			rgtClickContextMenu.style.top = e.pageY + 'px'
			rgtClickContextMenu.style.display = 'block'
			var toRepl = "to=" + eid.toString()
			rgtClickContextMenu.innerHTML = rgtClickContextMenu.innerHTML.replace(/to=\d+/g, toRepl)
		});

		document.addEventListener('click', e => {
			let button = e.which || e.button;
			if (button === 1) {
				rgtClickContextMenu.style.display = 'none';
			}
			let target = e.target;
			if (target && target.classList.contains('cls-context-item')) {
				capture(curPlayer, '缩略图', target.textContent);
			}
		});
		/*
		curPlayer.on('seeked',e=>{
			console.dir(e)
		})
		*/
	});
})(document);
