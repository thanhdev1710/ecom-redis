;(function(){
  var d = document;
  var currentScript = d.currentScript || (function(){ var s = d.getElementsByTagName('script'); return s[s.length - 1]; })();
  var scriptSrc = currentScript && currentScript.src ? currentScript.src : (window.location.origin + '/embed.js');
  var baseUrl = (function(){ try { return new URL(scriptSrc).origin; } catch(e) { return window.location.origin; } })();

  function injectCss(href){ var link = d.createElement('link'); link.rel='stylesheet'; link.href=href; d.head.appendChild(link); }
  function el(tag, attrs, html){ var e=d.createElement(tag); if(attrs){ Object.keys(attrs).forEach(function(k){ e.setAttribute(k, attrs[k]); }); } if(html) e.innerHTML=html; return e; }

  function appendMessage(messages, text, cls){
    var wrap = el('div', { class: 'vh-message ' + (cls ? ('vh-' + cls) : 'vh-bot') });
    var content = el('div', { class: 'vh-message-content' }); content.textContent = text;
    if (cls === 'bot' || !cls){
      var row = el('div'); row.style.display='flex'; row.style.gap='10px'; row.style.alignItems='flex-start';
      var av = el('div', { class: 'vh-bot-avatar' }); av.innerHTML = '<img src="'+ baseUrl + '/images/chatbot_1.png" alt="bot" />';
      row.appendChild(av); row.appendChild(content); wrap.appendChild(row);
    } else { wrap.appendChild(content); }
    messages.appendChild(wrap); messages.scrollTop = messages.scrollHeight;
  }

  function resolvedImageSrc(src){
    if (!src) return 'https://via.placeholder.com/400x400?text=Product';
    if (/^https?:\/\//i.test(src)) {
      // Always rebase absolute image URLs to current site origin (port 3000)
      try {
        var u = new URL(src);
        return window.location.origin + u.pathname + (u.search || "");
      } catch (_) {
        return src;
      }
    }
    if (/^\//.test(src)) return window.location.origin + src; // root-relative → current site
    return src;
  }

  function renderProductCard(messages, p){
    var priceStr = (typeof p.price === 'number') ? (p.price.toLocaleString('vi-VN') + '₫') : (p.price || 'Liên hệ');
    var card = el('div', { class: 'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm group overflow-hidden border-border hover:shadow-lg transition-shadow duration-300 pt-0', 'data-slot':'card' });
    var aTop = el('a', { href: '/products/' + (p.id || '') });
    var imgWrap = el('div', { class: 'relative aspect-square overflow-hidden bg-muted cursor-pointer border-b-2' });
    var img = el('img', { alt: (p.name || 'Sản phẩm'), loading: 'lazy', width: '300', height: '400', decoding: 'async', class: 'object-cover w-full h-full' });
    img.src = resolvedImageSrc(p.image);
    imgWrap.appendChild(img); aTop.appendChild(imgWrap); card.appendChild(aTop);
    var content = el('div', { class: 'p-4', 'data-slot': 'card-content' });
    var aTitle = el('a', { href: '/products/' + (p.id || '') });
    var titleRow = el('div', { class: 'flex items-start justify-between gap-2 mb-2' });
    var h3 = el('h3', { class: 'font-medium text-base leading-tight line-clamp-2 hover:text-primary transition-colors' }); h3.textContent = p.name || 'Sản phẩm';
    titleRow.appendChild(h3); aTitle.appendChild(titleRow); content.appendChild(aTitle);
    var brand = el('p', { class: 'text-sm text-muted-foreground mb-2' }); brand.textContent = p.brand || ''; content.appendChild(brand);
    var metaRow = el('div', { class: 'flex items-center gap-2 mb-3' });
    var rateWrap = el('div', { class: 'flex items-center gap-1' });
    var star = d.createElementNS('http://www.w3.org/2000/svg', 'svg'); star.setAttribute('viewBox','0 0 24 24'); star.classList.add('h-4','w-4'); star.setAttribute('fill','currentColor');
    var path = d.createElementNS('http://www.w3.org/2000/svg','path'); path.setAttribute('d','M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z'); star.appendChild(path);
    var rateText = el('span', { class: 'text-sm font-medium' }); rateText.textContent = (p.ratingAvg || '').toString(); rateWrap.appendChild(star); rateWrap.appendChild(rateText);
    var sold = el('span', { class: 'text-sm text-muted-foreground' }); sold.textContent = p.sold ? ('Đã bán ' + p.sold) : '';
    metaRow.appendChild(rateWrap); metaRow.appendChild(sold); content.appendChild(metaRow);
    var price = el('p', { class: 'text-xl font-semibold text-primary' }); price.textContent = priceStr; content.appendChild(price);
    card.appendChild(content);
    var wrap = el('div', { class: 'vh-message vh-bot' });
    var row = el('div'); row.style.display='flex'; row.style.gap='10px'; row.style.alignItems='flex-start';
    var av = el('div', { class: 'vh-bot-avatar' }); av.innerHTML = '<img src="'+ baseUrl + '/images/chatbot_1.png" alt="bot" />';
    row.appendChild(av); row.appendChild(card); wrap.appendChild(row); messages.appendChild(wrap); messages.scrollTop = messages.scrollHeight;
  }

  function renderQuickReplies(messages, qr, sendDirect){
    if (!qr || !qr.length) return; var wrap = el('div', { class:'vh-message vh-bot' });
    var row = el('div'); row.style.display='flex'; row.style.gap='10px'; row.style.alignItems='flex-start';
    var av = el('div', { class:'vh-bot-avatar' }); av.innerHTML = '<img src="'+ baseUrl + '/images/chatbot_1.png" alt="bot" />';
    var col = el('div');
    qr.forEach(function(q){
      var b = el(q.url ? 'a' : 'button', { class:'vh-product-link' });
      var label = q.text || q.payload || 'Chọn';
      if (q.url) { b.href = (/^https?:\/\//i.test(q.url)) ? q.url : (baseUrl + q.url); b.target = '_blank'; }
      b.textContent = label; if (q.payload) b.title = q.payload;
      b.style.marginTop = '8px';
      if (!q.url) b.addEventListener('click', function(){ sendDirect(q.payload || label); });
      col.appendChild(b);
    });
    row.appendChild(av); row.appendChild(col); wrap.appendChild(row); messages.appendChild(wrap); messages.scrollTop = messages.scrollHeight;
  }

  function showTyping(messages){ var t = el('div',{class:'vh-message vh-bot'}); var row = el('div'); row.style.display='flex'; row.style.gap='10px'; row.style.alignItems='flex-start'; var av = el('div',{class:'vh-bot-avatar'}); av.innerHTML = '<img src="'+ baseUrl + '/images/chatbot_1.png" alt="bot" />'; var dots = el('div',{class:'vh-typing-indicator'}); dots.innerHTML='<span></span><span></span><span></span>'; row.appendChild(av); row.appendChild(dots); t.appendChild(row); messages.appendChild(t); messages.scrollTop = messages.scrollHeight; return t; }

  function mount(){
    injectCss(baseUrl + '/widget.css');
    var btn = el('div', { id:'chatbot-widget-button' }, '<img src="'+ baseUrl + '/images/chatbot_1.png" alt="Chat" />');
    var box = el('div', { id:'chatbot-container' }); box.style.display='none';
    var header = el('div', { class:'vh-chatbot-header' }); var info = el('div', { class:'vh-chatbot-header-info' });
    var av = el('div',{class:'vh-chatbot-avatar'}); av.innerHTML = '<img src="'+ baseUrl + '/images/chatbot_1.png" style="width:35px;height:60px;" alt="Chat" />';
    var htext = el('div',{class:'vh-chatbot-header-text'},'<h3>Trợ lý tư vấn</h3><p>Sẵn sàng hỗ trợ bạn</p>'); var close = el('div',{class:'vh-chatbot-close', title:'Đóng'},'✕');
    info.appendChild(av); info.appendChild(htext); header.appendChild(info); header.appendChild(close);
    var messages = el('div', { class:'vh-chatbot-messages', id:'chatbot-messages' });
    var inputBar = el('div', { class:'vh-chatbot-input' }); var input = el('input',{type:'text',id:'chatbot-input',placeholder:'Nhập tin nhắn của bạn...'}); var sendBtn = el('button',{id:'chatbot-send',type:'button'},'Gửi'); inputBar.appendChild(input); inputBar.appendChild(sendBtn);
    box.appendChild(header); box.appendChild(messages); box.appendChild(inputBar);

    btn.addEventListener('click', function(){ box.style.display = box.style.display==='none' ? 'flex' : 'none';
      btn.style.display= btn.style.display==='flex' ? 'none' : 'none'; 
      if (box.style.display==='flex'){ input.focus(); if (messages.childElementCount===0) sendDirect('xin chào'); } });
    close.addEventListener('click', function(){ box.style.display='none';btn.style.display='flex' });

    var userId = 'user_' + Math.random().toString(36).slice(2,11); try { if (!localStorage.getItem('chatbot_userId')) localStorage.setItem('chatbot_userId', userId); else userId = localStorage.getItem('chatbot_userId'); } catch(e){}

    async function onSend(){ var text=(input.value||'').trim(); if(!text) return; appendMessage(messages,text,'user'); input.value=''; await sendDirect(text); }
    async function sendDirect(text){ var typing=showTyping(messages); try { var res=await fetch(baseUrl + '/api/chat',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message:text, userId:userId })}); var data=await res.json(); typing.remove(); if(!data||data.ok!==true){ appendMessage(messages,'Lỗi server, vui lòng thử lại sau.'); return; } var r=data.reply||{}; if(r.type==='product'&&r.product){ renderProductCard(messages,r.product); renderQuickReplies(messages,r.quickReplies||[],sendDirect); } else if(r.type==='link'&&r.url){ appendMessage(messages,r.text||'Vui lòng truy cập liên kết bên dưới'); renderQuickReplies(messages,[{text:'Mở form báo giá',url:r.url}],sendDirect);} else if(r.type==='text'&&r.text){ appendMessage(messages,r.text); if(Array.isArray(r.items)) r.items.forEach(function(p){ renderProductCard(messages,p); }); renderQuickReplies(messages,r.quickReplies||[],sendDirect);} else { appendMessage(messages,'Mình chưa tìm thấy phản hồi phù hợp.'); } } catch(e){ typing.remove(); appendMessage(messages,'Lỗi kết nối, vui lòng thử lại.'); } }

    sendBtn.addEventListener('click', onSend); input.addEventListener('keydown', function(e){ if (e.key==='Enter') onSend(); });
    d.body.appendChild(btn); d.body.appendChild(box);
  }

  if (d.readyState==='loading') d.addEventListener('DOMContentLoaded', mount); else mount();
})();


